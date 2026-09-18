import mongoose from "mongoose";
import { LeadModel } from "../models/lead.schema";
import { UserModel } from "../models/user.schema";
import { AppError } from "../middlewares/error.middleware";
import type { Lead } from "../types/lead";
import {
  isConverted,
  isLeadStage,
  isLeadSubStatus,
  LEAD_STAGE_LABEL,
  leadSubStatusLabel,
  type LeadStage,
} from "../constants/leadPipeline";

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
  to: LeadStage,
  toSubStatus: string,
  actor: TransitionActor,
  at: Date,
  note?: string,
): Record<string, unknown>[] => {
  const entry: Record<string, unknown> = {
    from: "$status",
    fromSubStatus: "$subStatus",
    to,
    toSubStatus,
    changedByUserId: actor.userId,
    changedByName: actor.name,
    changedAt: at,
    note: note ?? "",
  };

  const converting = isConverted(to, toSubStatus);

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

/** The pair is the unit of meaning, so it is checked as one. */
export const assertLeadPipelinePair = (
  stage: unknown,
  subStatus: unknown,
): { stage: LeadStage; subStatus: string } => {
  if (!isLeadStage(stage)) {
    throw new AppError("Invalid status", 400);
  }
  if (!isLeadSubStatus(stage, subStatus)) {
    throw new AppError(
      `Choose a sub-status that belongs to ${LEAD_STAGE_LABEL[stage]}`,
      400,
    );
  }
  return { stage, subStatus: String(subStatus) };
};

export const transitionLeadStatus = async (
  leadId: string,
  to: LeadStage,
  toSubStatus: string,
  actor: TransitionActor,
  note?: string,
  /**
   * Extra match terms ANDed into the write, so a caller who may only touch
   * their own leads is checked by the same operation that moves the lead.
   * Reading the owner first and updating second leaves that gap open.
   */
  scope: mongoose.FilterQuery<Lead> = {},
): Promise<Lead> => {
  if (!mongoose.isValidObjectId(leadId)) {
    throw new AppError("Invalid lead id", 400);
  }

  const updated = await LeadModel.findOneAndUpdate(
    // The pair is what changes, so a lead may move within its own stage.
    {
      _id: leadId,
      $nor: [{ status: to, subStatus: toSubStatus }],
      ...scope,
    },
    buildStatusTransitionPipeline(to, toSubStatus, actor, new Date(), note),
    { new: true },
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
  throw new AppError(
    `This lead is already marked ${LEAD_STAGE_LABEL[to]} / ${leadSubStatusLabel(to, toSubStatus)}`,
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

export const assignLeads = async (
  leadIds: string[],
  to: AssignTarget | null,
  by: TransitionActor,
): Promise<number> => {
  const ids = leadIds
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  if (ids.length === 0) throw new AppError("No valid lead ids", 400);

  const res = await LeadModel.updateMany(
    { _id: { $in: ids } },
    buildAssignmentUpdate(to, by, new Date()),
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
