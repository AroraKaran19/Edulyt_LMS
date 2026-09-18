import mongoose from "mongoose";
import { LeadModel } from "../models/lead.schema";
import { UserModel } from "../models/user.schema";
import { AppError } from "../middlewares/error.middleware";
import type { Lead } from "../types/lead";
import {
  conversionPair,
  defaultPair,
  findStage,
  findSubStatus,
  getLeadPipeline,
} from "./leadPipelineSettings.services";

export interface TransitionActor {
  userId: mongoose.Types.ObjectId | null;
  name: string;
}

/**
 * A pipeline update, not a plain one, because the history entry needs the
 * status *before* the change. Reading it first and writing second would let a
 * concurrent change slip in and record a `from` that was never true.
 */
export const buildStatusTransitionPipeline = (
  to: string,
  toSubStatus: string,
  actor: TransitionActor,
  at: Date,
  note?: string,
  /** The pair the admin has marked as a conversion, or null if none is. */
  converts?: { status: string; subStatus: string } | null,
): Record<string, unknown>[] => {
  const entry: Record<string, unknown> = {
    from: "$status",
    fromSubStatus: "$subStatus",
    to,
    toSubStatus,
    changedByUserId: actor.userId,
    // `$literal` because these are data, not expressions: a note typed as
    // "$200 budget" would otherwise be read as a field path and rejected.
    changedByName: { $literal: actor.name },
    changedAt: at,
    note: { $literal: note ?? "" },
  };

  const converting =
    !!converts && converts.status === to && converts.subStatus === toSubStatus;

  return [
    {
      $set: {
        statusHistory: {
          $concatArrays: [{ $ifNull: ["$statusHistory", []] }, [entry]],
        },
      },
    },
    {
      $set: {
        status: to,
        subStatus: toSubStatus,
        // Cleared on the way out, or a lead flipped to converted and back
        // would keep counting.
        convertedAt: converting ? at : null,
        convertedBy: converting
          ? { userId: actor.userId, name: actor.name }
          : null,
      },
    },
  ];
};

/**
 * The pair is the unit of meaning, so it is checked as one, against the
 * pipeline the admin has configured. A retired row is refused for a *new*
 * change while staying readable on the leads already holding it.
 */
export const assertLeadPipelinePair = async (
  stage: unknown,
  subStatus: unknown,
): Promise<{ stage: string; subStatus: string }> => {
  const pipeline = await getLeadPipeline();
  const found = findStage(pipeline, stage);
  if (!found || !found.active) {
    throw new AppError("Invalid status", 400);
  }
  const sub = findSubStatus(pipeline, stage, subStatus);
  if (!sub || !sub.active) {
    throw new AppError(
      `Choose a sub-status that belongs to ${found.label}`,
      400,
    );
  }
  return { stage: found.key, subStatus: sub.key };
};

export const transitionLeadStatus = async (
  leadId: string,
  to: string,
  toSubStatus: string,
  actor: TransitionActor,
  note?: string,
  /**
   * Extra match terms ANDed into the write, so a caller who may only touch
   * their own leads is checked by the same operation that moves the lead.
   * Reading the owner first and updating second leaves that gap open.
   */
  scope: mongoose.FilterQuery<Lead> = {},
  /** Fields the caller may not read back, such as the histories sales never sees. */
  projection?: Record<string, 0 | 1>,
): Promise<Lead> => {
  if (!mongoose.isValidObjectId(leadId)) {
    throw new AppError("Invalid lead id", 400);
  }

  const pipeline = await getLeadPipeline();
  const updated = await LeadModel.findOneAndUpdate(
    // The pair is what changes, so a lead may move within its own stage.
    {
      _id: leadId,
      $nor: [{ status: to, subStatus: toSubStatus }],
      ...scope,
    },
    buildStatusTransitionPipeline(
      to,
      toSubStatus,
      actor,
      new Date(),
      note,
      conversionPair(pipeline),
    ),
    { new: true, ...(projection ? { projection } : {}) },
  );
  if (updated) return updated as unknown as Lead;

  // Matched nothing: the lead is gone, out of scope, or already in that state.
  // The scope is repeated here so an out-of-scope lead reads as missing rather
  // than announcing that it exists.
  const existing = await LeadModel.findOne(
    { _id: leadId, ...scope },
    { status: 1 },
  ).lean();
  if (!existing) throw new AppError("Lead not found", 404);
  const stage = findStage(pipeline, to);
  const sub = findSubStatus(pipeline, to, toSubStatus);
  throw new AppError(
    `This lead is already marked ${stage?.label ?? to} / ${sub?.label ?? toSubStatus}`,
    409,
  );
};

/**
 * The campaigns that actually produced leads, for the pool's campaign filter.
 *
 * Grouped out of the lead pool rather than read from the campaign list so the
 * dropdown never offers a campaign with nothing behind it, and so a leads admin
 * needs no `scholarship.tests` permission to filter by one.
 */
export const buildLeadCampaignFacet = (): Record<string, unknown>[] => [
  { $match: { "source.kind": "scholarship", "source.testId": { $ne: null } } },
  {
    $group: {
      _id: "$source.testId",
      title: { $last: "$source.title" },
      leads: { $sum: 1 },
      latest: { $max: "$createdAt" },
    },
  },
  { $sort: { latest: -1 } },
  { $limit: 200 },
];

export const listLeadCampaigns = async (): Promise<
  { testId: string; title: string; leads: number }[]
> => {
  try {
    const rows = await LeadModel.aggregate(
      buildLeadCampaignFacet() as unknown as mongoose.PipelineStage[],
    );
    return rows.map((row) => ({
      testId: String(row._id),
      title: row.title || "Untitled campaign",
      leads: row.leads ?? 0,
    }));
  } catch (error) {
    // A filter dropdown must never take the page down with it.
    console.error("[leads] campaign list failed:", error);
    return [];
  }
};

/**
 * Counts how many leads share each email and phone on the page being shown.
 * One faceted aggregation over two indexed fields; the alternative is a query
 * per row on the fastest-growing collection in the system.
 */
export const buildDuplicateFacet = (
  emails: string[],
  phones: string[],
): Record<string, unknown>[] => [
  { $match: { $or: [{ email: { $in: emails } }, { phone: { $in: phones } }] } },
  {
    $facet: {
      byEmail: [{ $group: { _id: "$email", n: { $sum: 1 } } }],
      byPhone: [{ $group: { _id: "$phone", n: { $sum: 1 } } }],
    },
  },
];

export const countDuplicates = async (
  emails: string[],
  phones: string[],
): Promise<{ byEmail: Map<string, number>; byPhone: Map<string, number> }> => {
  const empty = { byEmail: new Map(), byPhone: new Map() };
  if (emails.length === 0 && phones.length === 0) return empty;

  try {
    const [result] = await LeadModel.aggregate(
      buildDuplicateFacet(emails, phones) as unknown as mongoose.PipelineStage[],
    );
    const toMap = (rows: { _id: string; n: number }[] = []) =>
      new Map(rows.map((r) => [r._id, r.n]));
    return {
      byEmail: toMap(result?.byEmail),
      byPhone: toMap(result?.byPhone),
    };
  } catch (error) {
    // A duplicate badge is a convenience; it must never fail the pool.
    console.error("[leads] duplicate count failed:", error);
    return empty;
  }
};

export interface AssignTarget {
  userId: mongoose.Types.ObjectId;
  name: string;
}

export const buildAssignmentUpdate = (
  to: AssignTarget | null,
  by: TransitionActor,
  at: Date,
): Record<string, unknown> => ({
  $set: {
    assignedTo: to ? { userId: to.userId, name: to.name } : null,
    assignedBy: { userId: by.userId, name: by.name },
    assignedAt: at,
  },
  $push: {
    assignmentHistory: {
      toUserId: to?.userId ?? null,
      toName: to?.name ?? "",
      byUserId: by.userId,
      byName: by.name,
      at,
    },
  },
});

/**
 * Assignment and a reset to New / New Lead in one write.
 *
 * A pipeline rather than a plain update because the history entry needs each
 * lead's own status *before* the reset, which only `$status` can read and only
 * while the first stage is still running. `convertedAt` and `convertedBy` are
 * left alone deliberately: they are the previous owner's credit on the CRM
 * leaderboards, and a handover is not a reason to take it away.
 */
export const buildAssignmentResetPipeline = (
  to: AssignTarget | null,
  by: TransitionActor,
  at: Date,
  reset: { status: string; subStatus: string },
): Record<string, unknown>[] => {
  const statusEntry = {
    from: "$status",
    fromSubStatus: "$subStatus",
    to: reset.status,
    toSubStatus: reset.subStatus,
    changedByUserId: by.userId,
    // `$literal` because these are data, not expressions: a name beginning
    // with "$" would otherwise be read as a field path and rejected.
    changedByName: { $literal: by.name },
    changedAt: at,
    note: { $literal: "Reset on reassignment" },
  };
  const assignmentEntry = {
    toUserId: to?.userId ?? null,
    toName: { $literal: to?.name ?? "" },
    byUserId: by.userId,
    byName: { $literal: by.name },
    at,
  };

  return [
    {
      $set: {
        statusHistory: {
          $concatArrays: [{ $ifNull: ["$statusHistory", []] }, [statusEntry]],
        },
        assignmentHistory: {
          $concatArrays: [
            { $ifNull: ["$assignmentHistory", []] },
            [assignmentEntry],
          ],
        },
      },
    },
    {
      $set: {
        assignedTo: to
          ? { userId: to.userId, name: { $literal: to.name } }
          : null,
        assignedBy: { userId: by.userId, name: { $literal: by.name } },
        assignedAt: at,
        status: reset.status,
        subStatus: reset.subStatus,
        note: "",
      },
    },
  ];
};

export const assignLeads = async (
  leadIds: string[],
  to: AssignTarget | null,
  by: TransitionActor,
  resetStatus = false,
): Promise<number> => {
  const ids = leadIds
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  if (ids.length === 0) throw new AppError("No valid lead ids", 400);

  const at = new Date();
  const res = await LeadModel.updateMany(
    { _id: { $in: ids } },
    resetStatus
      ? buildAssignmentResetPipeline(to, by, at, defaultPair(await getLeadPipeline()))
      : buildAssignmentUpdate(to, by, at),
  );
  return res.modifiedCount;
};

const escapeRegex = (v: string) =>
  v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Paged, searchable list of active sales users for the assignee pickers.
 *
 * The `userType`/`status`/`firstName` index bounds this to sales rows before the
 * name regex runs, so the regex only ever scans staff rather than every user.
 */
export const listAssignableSales = async (
  page = 1,
  limit = 20,
  search = "",
) => {
  const filter: mongoose.FilterQuery<{ userType: string }> = {
    userType: "sales",
    status: "active",
  };

  const term = search.trim();
  if (term) {
    const safe = escapeRegex(term);
    filter.$or = [
      { firstName: { $regex: safe, $options: "i" } },
      { lastName: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }

  const [rows, total] = await Promise.all([
    UserModel.find(filter, { firstName: 1, lastName: 1, email: 1 })
      .sort({ firstName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  return {
    assignees: rows.map((r) => ({
      userId: String(r._id),
      name:
        [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.email,
      email: r.email,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};
