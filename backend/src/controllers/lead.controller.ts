import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import { LeadModel } from "../models/lead.schema";
import { UserModel } from "../models/user.schema";
import { Lead, LeadAnswer } from "@/types/lead";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/;

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
  const { source = "enquiry-form", name, answers = [], pageQuery } =
    req.body ?? {};

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
  if (!PHONE_RE.test(cleanPhone)) {
    throw new AppError(
      "Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9",
      400
    );
  }
  if (source !== "enquiry-form") {
    throw new AppError("Unknown lead source", 400);
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

  const lead = await LeadModel.create({
    source,
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
  const source = String(req.query.source ?? "").trim();

  const filter: mongoose.FilterQuery<Lead> = {};
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { email: { $regex: safe, $options: "i" } },
      { phone: { $regex: safe, $options: "i" } },
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

  sendSuccessResponse(
    res,
    {
      leads,
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

  sendSuccessResponse(res, { lead }, "Lead fetched", 200);
});

/**
 * @desc  Move a lead through the pipeline, or leave a note on it
 * @route PATCH /api/leads/admin/:id
 * @access Admin
 */
export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body ?? {};

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid lead id", 400);
  }

  const update: Partial<Pick<Lead, "status" | "note">> = {};
  if (status !== undefined) {
    const allowed = ["new", "contacted", "qualified", "converted", "lost"];
    if (!allowed.includes(String(status))) {
      throw new AppError("Invalid status", 400);
    }
    update.status = status;
  }
  if (note !== undefined) {
    update.note = String(note).slice(0, 2000);
  }
  if (Object.keys(update).length === 0) {
    throw new AppError("Nothing to update", 400);
  }

  const lead = await LeadModel.findByIdAndUpdate(id, update, { new: true });
  if (!lead) {
    throw new AppError("Lead not found", 404);
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
