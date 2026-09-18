import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import { LeadModel } from "../models/lead.schema";
import { UserModel } from "../models/user.schema";
import { CollegeModel } from "../models/college.schema";
import { CourseModel } from "../models/course.schema";
import { InternshipModel } from "../models/internship.schema";
import { resolveCrmCode } from "../services/crmProfile.services";
import { buildAttribution, LeadAttribution } from "../lib/leadAttribution";
import {
  assertLeadPipelinePair,
  assignLeads,
  countDuplicates,
  listAssignableSales,
  listLeadCampaigns,
  transitionLeadStatus,
  type AssignTarget,
} from "../services/leadPipeline.services";
import {
  buildScholarshipViews,
  scholarshipViewFor,
} from "../services/scholarshipLeadEnrichment.services";
import {
  Lead,
  LeadAnswer,
  LeadProgram,
  LeadProgramKind,
} from "../types/lead";
import { asBrand, BRAND_MAIL } from "../constants/brands";
import { enquiryReceivedMail } from "../mail";
import { isValidPhone } from "../services/phoneVerification.services";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * A verdict written at capture time goes stale: a lead with no account on
 * Monday may sign up on Friday. The read path refreshes anything older.
 */
const EMAIL_CHECK_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * `users.email` is uniquely indexed, so the lookup itself is cheap; the cost
 * worth avoiding is running it per row. This resolves a whole page in one `$in`
 * plus one `bulkWrite`, and never throws: a failed refresh keeps the old
 * verdict and the next read retries.
 */
async function resolveEmailsOnPlatform(leads: Lead[]): Promise<void> {
  const cutoff = Date.now() - EMAIL_CHECK_TTL_MS;

  const stale = leads.filter(
    (lead) =>
      lead.emailOnPlatform === null ||
      lead.emailOnPlatform === undefined ||
      !lead.emailCheckedAt ||
      lead.emailCheckedAt.getTime() < cutoff
  );
  if (stale.length === 0) return;

  const emails = [...new Set(stale.map((lead) => lead.email))];

  try {
    const users = await UserModel.find(
      { email: { $in: emails } },
      { _id: 1, email: 1 }
    ).lean();

    const byEmail = new Map(users.map((u) => [String(u.email), u._id]));
    const now = new Date();

    const ops = stale.map((lead) => {
      const match = byEmail.get(lead.email);
      // keep the in-memory copies in step with what we are about to persist
      lead.emailOnPlatform = Boolean(match);
      lead.emailCheckedAt = now;
      lead.platformUserId = (match as typeof lead.platformUserId) ?? undefined;

      return {
        updateOne: {
          filter: { _id: lead._id },
          update: {
            $set: {
              emailOnPlatform: Boolean(match),
              emailCheckedAt: now,
              ...(match
                ? { platformUserId: match }
                : { platformUserId: undefined }),
            },
            ...(match ? {} : { $unset: { platformUserId: "" } }),
          },
        },
      };
    });

    await LeadModel.bulkWrite(ops, { ordered: false });
  } catch (error) {
      console.error("[leads] email-on-platform refresh failed:", error);
  }
}

const PROGRAM_KINDS: readonly LeadProgramKind[] = ["course", "internship"];

// Titled from the catalogue, never the browser. Both slugs are uniquely indexed.
// `Internship` types `_id` as a string, but lean returns an ObjectId.
const findProgramTitle = async (
  kind: LeadProgramKind,
  slug: string,
): Promise<{ _id: unknown; title?: unknown } | null> =>
  kind === "course"
    ? await CourseModel.findOne({ slug }, { title: 1 }).lean()
    : await InternshipModel.findOne({ slug }, { title: 1 }).lean();

// An unmatched slug or a failed lookup still keeps the slug: neither may cost the lead.
const resolveProgram = async (raw: unknown): Promise<LeadProgram | undefined> => {
  const input = (raw ?? {}) as { kind?: unknown; slug?: unknown };
  const kind = PROGRAM_KINDS.find((k) => k === input.kind);
  const slug = String(input.slug ?? "").trim().slice(0, 200);
  if (!kind || !slug) return undefined;

  const program: LeadProgram = { kind, title: "", slug };
  try {
    const doc = await findProgramTitle(kind, slug);
    if (doc) {
      program.refId = doc._id as mongoose.Types.ObjectId;
      program.title = String(doc.title ?? "");
    }
  } catch (error) {
    console.error("[leads] program lookup failed:", error);
  }
  return program;
};

/**
 * @desc  Capture a lead from the enquiry form
 * @route POST /api/leads
 * @access Proved email and phone (see `requireVerifiedLeadContact`)
 *
 * The address and number come from `req.verifiedContact`, never from the body.
 * Reading them from the body would make both verification paths decoration,
 * since a lead could then be posted straight here with anything in it.
 */
export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    answers = [],
    pageQuery,
    ref,
    collegeId,
    brand: rawBrand,
    program: rawProgram,
  } = req.body ?? {};

  // Which site the enquiry came from. Absent on the LMS form, which is what
  // keeps its behaviour unchanged: only Edulyt has an acknowledgement template.
  const brand = asBrand(rawBrand);

  const proved = req.verifiedContact;
  if (!proved) {
    throw new AppError(
      "Verify your email and mobile number before sending your details",
      401
    );
  }

  const cleanName = String(name ?? "").trim();
  const cleanEmail = proved.email.trim().toLowerCase();
  const cleanPhone = proved.phone.trim();

  if (cleanName.length < 2) {
    throw new AppError("Name is required", 400);
  }
  if (!EMAIL_RE.test(cleanEmail)) {
    throw new AppError("A valid email is required", 400);
  }
  // Shared with the verification path, so a number that was provable is never
  // then refused here. Accepts bare Indian 10-digit and E.164 alike.
  if (!isValidPhone(cleanPhone)) {
    throw new AppError("Enter a valid mobile number", 400);
  }

  const submittedByUserId = proved.userId;

  const cleanAnswers: LeadAnswer[] = (Array.isArray(answers) ? answers : [])
    .slice(0, 40)
    .map((a: LeadAnswer) => ({
      key: String(a?.key ?? "").slice(0, 60),
      label: String(a?.label ?? "").slice(0, 200),
      value: String(a?.value ?? "").slice(0, 500),
    }))
    .filter((a) => a.key && a.value);

  // Wrapped so a failed lookup never costs the student their submission.
  let emailOnPlatform: boolean | null = null;
  let platformUserId: mongoose.Types.ObjectId | undefined;
  try {
    const existing = await UserModel.findOne(
      { email: cleanEmail },
      { _id: 1 }
    ).lean();
    emailOnPlatform = Boolean(existing);
    platformUserId = existing?._id as mongoose.Types.ObjectId | undefined;
  } catch (error) {
    console.error("[leads] inline email check failed:", error);
  }

  // Resolved server-side from the raw code. Accepting a creator id from the
  // browser would let anyone assign leads to anyone.
  let attribution: LeadAttribution = {};
  if (ref) {
    try {
      const resolved = await resolveCrmCode(String(ref));
      if (resolved) {
        const owner = resolved.parentUserId
          ? await UserModel.findById(resolved.parentUserId, {
              firstName: 1,
              lastName: 1,
            }).lean()
          : null;
        const ownerName =
          [owner?.firstName, owner?.lastName].filter(Boolean).join(" ").trim() ||
          "";
        attribution = buildAttribution(resolved, ownerName);
      } else {
        console.warn(`[leads] unresolved ref code: ${String(ref).slice(0, 32)}`);
      }
    } catch (error) {
      // Attribution must never cost the student their submission.
      console.error("[leads] attribution lookup failed:", error);
    }
  }

  // Snapshotted so the state filter is one indexed equality, never a join.
  let college: Record<string, unknown> = {};
  if (collegeId && mongoose.isValidObjectId(collegeId)) {
    try {
      const doc = await CollegeModel.findById(collegeId, {
        name: 1,
        state: 1,
      }).lean();
      if (doc) {
        college = {
          collegeId: doc._id,
          collegeName: doc.name,
          ...(doc.state ? { state: doc.state } : {}),
        };
      }
    } catch (error) {
      console.error("[leads] college snapshot failed:", error);
    }
  }

  const program = await resolveProgram(rawProgram);

  const lead = await LeadModel.create({
    // The endpoint decides the kind; the caller says which site, and which program if any.
    source: { kind: "enquiry", brand, ...(program ? { program } : {}) },
    ...attribution,
    ...college,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    answers: cleanAnswers,
    emailOnPlatform,
    emailCheckedAt: emailOnPlatform === null ? undefined : new Date(),
    platformUserId,
    submittedByUserId:
      submittedByUserId && mongoose.isValidObjectId(submittedByUserId)
        ? submittedByUserId
        : undefined,
    pageQuery: pageQuery ? String(pageQuery).slice(0, 500) : undefined,
  });

  // Course and internship enquiries are not acknowledged. Queued, not awaited:
  // a mail failure must never fail a captured lead. The acknowledgement follows
  // the request's brand for its sender and its link.
  if (!program) {
    enquiryReceivedMail.send(
      { email: cleanEmail, name: cleanName },
      {
        name: cleanName.split(/\s+/)[0] || cleanName,
        ctaUrl: BRAND_MAIL[brand].siteUrl,
        ctaLabel: "Visit our website",
        year: new Date().getFullYear(),
      },
      { brand },
    );
  }

  sendSuccessResponse(res, { id: lead._id }, "Lead captured", 201);
});

/**
 * @desc  List leads for the admin table
 * @route GET /api/leads/admin
 * @access Admin
 */
export const getLeads = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "").trim();
  const subStatus = String(req.query.subStatus ?? "").trim();
  const source = String(req.query.source ?? "").trim();
  const brand = String(req.query.brand ?? "").trim();

  const campaignId = String(req.query.campaignId ?? "").trim();
  const collegeId = String(req.query.collegeId ?? "").trim();
  const state = String(req.query.state ?? "").trim();
  const assignedTo = String(req.query.assignedTo ?? "").trim();
  const creator = String(req.query.creator ?? "").trim();
  const from = String(req.query.from ?? "").trim();
  const to = String(req.query.to ?? "").trim();

  const filter: mongoose.FilterQuery<Lead> = {};
  if (status) filter.status = status;
  // Only alongside a stage: the same sub-status value lives under two of them.
  if (status && subStatus) filter.subStatus = subStatus;
  if (source) filter["source.kind"] = source;
  // Leads from before two brands existed carry no brand, and they are all Airkrit.
  if (brand === "airkrit") filter["source.brand"] = { $in: ["airkrit", null] };
  if (brand === "edulyt") filter["source.brand"] = "edulyt";
  if (campaignId && mongoose.isValidObjectId(campaignId)) {
    filter["source.testId"] = new mongoose.Types.ObjectId(campaignId);
  }
  if (collegeId && mongoose.isValidObjectId(collegeId)) {
    filter.collegeId = new mongoose.Types.ObjectId(collegeId);
  }
  if (state) filter.state = state;
  if (assignedTo === "unassigned") {
    filter["assignedTo.userId"] = null;
  } else if (assignedTo && mongoose.isValidObjectId(assignedTo)) {
    filter["assignedTo.userId"] = new mongoose.Types.ObjectId(assignedTo);
  }
  if (creator && mongoose.isValidObjectId(creator)) {
    filter["creator.userId"] = new mongoose.Types.ObjectId(creator);
  }
  if (from || to) {
    filter.createdAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Anchored on email and phone so their indexes are usable. Name stays
    // unanchored: it has no index either way, and partial-name search is
    // what people actually type.
    filter.$or = [
      { email: { $regex: `^${safe}`, $options: "i" } },
      { phone: { $regex: `^${safe}` } },
      { name: { $regex: safe, $options: "i" } },
    ];
  }

  const [leads, total] = await Promise.all([
    LeadModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    LeadModel.countDocuments(filter),
  ]);

  // One batched refresh for the page being shown, never one query per row.
  await resolveEmailsOnPlatform(leads);

  const [dupes, scholarship] = await Promise.all([
    countDuplicates(
      [...new Set(leads.map((l) => l.email))],
      [...new Set(leads.map((l) => l.phone))]
    ),
    buildScholarshipViews(leads),
  ]);

  const rows = leads.map((lead) => ({
    ...lead.toObject(),
    duplicateEmailCount: dupes.byEmail.get(lead.email) ?? 1,
    duplicatePhoneCount: dupes.byPhone.get(lead.phone) ?? 1,
    scholarship: scholarshipViewFor(scholarship, lead),
  }));

  sendSuccessResponse(
    res,
    {
      leads: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
    "Leads fetched",
    200
  );
});

/**
 * @desc  One lead with every answer it carried
 * @route GET /api/leads/admin/:id
 * @access Admin
 */
export const getLeadById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await LeadModel.findById(id).populate(
    "platformUserId",
    "firstName lastName email phone userType createdAt"
  );
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  await resolveEmailsOnPlatform([lead]);
  const scholarship = await buildScholarshipViews([lead]);

  sendSuccessResponse(
    res,
    {
      lead: {
        ...lead.toObject(),
        scholarship: scholarshipViewFor(scholarship, lead),
      },
    },
    "Lead fetched",
    200
  );
});

/**
 * @desc  Campaigns that have produced at least one lead
 * @route GET /api/leads/admin/campaigns
 * @access Admin with `leads`, super-admin
 */
export const listLeadCampaignsController = asyncHandler(
  async (_req: Request, res: Response) => {
    sendSuccessResponse(
      res,
      { campaigns: await listLeadCampaigns() },
      "Campaigns fetched",
      200
    );
  }
);

/**
 * @desc  Move a lead through the pipeline, or leave a note on it
 * @route PATCH /api/leads/admin/:id
 * @access Admin
 */
export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, subStatus, note } = req.body ?? {};

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid lead id", 400);
  }

  const actor = {
    userId: req.user?._id
      ? new mongoose.Types.ObjectId(String(req.user._id))
      : null,
    name:
      [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ").trim() ||
      "",
  };

  let lead: Lead | null = null;

  if (status !== undefined) {
    const pair = assertLeadPipelinePair(status, subStatus);
    lead = await transitionLeadStatus(
      id,
      pair.stage,
      pair.subStatus,
      actor,
      String(note ?? ""),
    );
  }

  if (note !== undefined) {
    lead = (await LeadModel.findByIdAndUpdate(
      id,
      { note: String(note).slice(0, 2000) },
      { new: true }
    )) as unknown as Lead | null;
  }

  if (!lead) {
    throw new AppError("Nothing to update", 400);
  }

  sendSuccessResponse(res, { lead }, "Lead updated", 200);
});

/**
 * @desc  Delete a lead
 * @route DELETE /api/leads/admin/:id
 * @access Super admin
 */
export const deleteLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await LeadModel.findByIdAndDelete(id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  sendSuccessResponse(res, { id }, "Lead deleted", 200);
});

/**
 * @desc  Assign or unassign a batch of leads
 * @route POST /api/leads/admin/assign
 * @access Admin with `leads`, super-admin
 */
export const assignLeadsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { leadIds, assigneeId } = req.body ?? {};
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw new AppError("Select at least one lead", 400);
    }
    if (leadIds.length > 500) {
      throw new AppError("Assign at most 500 leads at a time", 400);
    }

    let target: AssignTarget | null = null;
    if (assigneeId) {
      if (!mongoose.isValidObjectId(assigneeId)) {
        throw new AppError("Invalid assignee", 400);
      }
      const salesUser = await UserModel.findOne(
        { _id: assigneeId, userType: "sales" },
        { firstName: 1, lastName: 1, email: 1 }
      ).lean();
      if (!salesUser) {
        throw new AppError("Leads can only be assigned to a sales user", 400);
      }
      target = {
        userId: salesUser._id as unknown as mongoose.Types.ObjectId,
        name:
          [salesUser.firstName, salesUser.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || salesUser.email,
      };
    }

    const actor = {
      userId: req.user?._id
        ? new mongoose.Types.ObjectId(String(req.user._id))
        : null,
      name:
        [req.user?.firstName, req.user?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "",
    };

    const count = await assignLeads(leadIds.map(String), target, actor);
    sendSuccessResponse(res, { assigned: count }, "Leads assigned", 200);
  }
);

/**
 * @desc  Sales people an admin can assign leads to
 * @route GET /api/leads/admin/assignees
 * @access Admin with `leads`, super-admin
 */
export const listAssigneesController = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const search = String(req.query.search ?? "").trim();
    sendSuccessResponse(
      res,
      await listAssignableSales(page, limit, search),
      "Assignees fetched",
      200
    );
  }
);

/**
 * @desc  The caller's own assigned leads
 * @route GET /api/leads/mine
 * @access Sales
 *
 * A separate endpoint rather than a filter on the admin pool: this one cannot
 * be widened to somebody else's leads, whatever query string arrives.
 */
export const listMyAssignedLeads = asyncHandler(
  async (req: Request, res: Response) => {
    if (req.user?.userType !== "sales") {
      throw new AppError("You don't have access to this section", 403);
    }
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const status = String(req.query.status ?? "").trim();
    const subStatus = String(req.query.subStatus ?? "").trim();

    const filter: mongoose.FilterQuery<Lead> = {
      "assignedTo.userId": new mongoose.Types.ObjectId(String(req.user._id)),
    };
    if (status) filter.status = status;
    if (status && subStatus) filter.subStatus = subStatus;

    const [leads, total] = await Promise.all([
      LeadModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      LeadModel.countDocuments(filter),
    ]);

    const scholarship = await buildScholarshipViews(leads);
    const rows = leads.map((lead) => ({
      ...lead.toObject(),
      scholarship: scholarshipViewFor(scholarship, lead),
    }));

    sendSuccessResponse(
      res,
      { leads: rows, total, page, totalPages: Math.ceil(total / limit) },
      "Leads fetched",
      200
    );
  }
);

/**
 * @desc  Move one of the caller's own leads through the pipeline
 * @route PATCH /api/leads/mine/:id
 * @access Sales
 *
 * The admin route is behind `adminGuard`, so sales could never use it. This one
 * is scoped to the caller's own assignments inside the write itself, which is
 * what keeps it from becoming a way to edit the whole pool.
 */
export const updateMyAssignedLead = asyncHandler(
  async (req: Request, res: Response) => {
    if (req.user?.userType !== "sales") {
      throw new AppError("You don't have access to this section", 403);
    }

    const { id } = req.params;
    const { status, subStatus, note } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) {
      throw new AppError("Invalid lead id", 400);
    }

    const owned = {
      "assignedTo.userId": new mongoose.Types.ObjectId(String(req.user._id)),
    };
    const actor = {
      userId: new mongoose.Types.ObjectId(String(req.user._id)),
      name:
        [req.user.firstName, req.user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "",
    };

    let lead: Lead | null = null;

    if (status !== undefined) {
      const pair = assertLeadPipelinePair(status, subStatus);
      lead = await transitionLeadStatus(
        id,
        pair.stage,
        pair.subStatus,
        actor,
        String(note ?? ""),
        owned
      );
    }

    if (note !== undefined) {
      lead = (await LeadModel.findOneAndUpdate(
        { _id: id, ...owned },
        { note: String(note).slice(0, 2000) },
        { new: true }
      )) as unknown as Lead | null;
      if (!lead) throw new AppError("Lead not found", 404);
    }

    if (!lead) {
      throw new AppError("Nothing to update", 400);
    }

    sendSuccessResponse(res, { lead }, "Lead updated", 200);
  }
);
