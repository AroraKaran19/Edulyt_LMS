/**
 * Admin reporting aggregations.
 *
 * Three reports, all shaped the same way: a paginated list of per-user rows
 * plus a `totals` block covering the ENTIRE filtered set (not just the page),
 * so the summary strip never contradicts the table.
 *
 *  1. Platform success points — the student wallet (`successPointsHistory`).
 *     A real dated ledger, so earned / spent split cleanly.
 *  2. Internship success points — reconstructed from the three dated sources
 *     that feed `InternshipEnrollment.internshipSuccessPoints`, because that
 *     field is a bare counter with no history of its own. See the note on
 *     `getInternshipSuccessPointsReport` for what that costs us.
 *  3. Referrals — commission earned vs. withdrawals actually paid out.
 *
 * Every report accepts the same window/search/paging options and can be run
 * unpaginated (`exportAll`) to back the CSV date-range export.
 */

import { PipelineStage } from "mongoose";
import { OrderModel, StudentModel, UserModel } from "../models";
import { InternshipModel } from "../models/internship.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { InternshipLiveMeetingModel } from "../models/liveMeeting.schema";
import { InternshipLiveMeetingAttendanceModel } from "../models/liveMeetingAttendance.schema";
import { ReferralProfileModel } from "../models/referralProfile.schema";
import { ReferralSaleModel } from "../models/referralSale.schema";
import { ReferralWithdrawalModel } from "../models/referralWithdrawal.schema";
import { asBrand, type Brand } from "../constants/brands";

/** Enrollment statuses that count as "on the roster" — mirrors liveMeeting.services. */
const ENROLLED_STATUSES = ["enrolled", "completed"] as const;

/** Hard ceiling on an unpaginated CSV export, so one click can't pin the box. */
export const REPORT_EXPORT_MAX_ROWS = 50_000;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export interface ReportQuery {
  /** Inclusive lower bound on the activity date. Omit for "all time". */
  from?: Date;
  /** Inclusive upper bound on the activity date. Omit for "all time". */
  to?: Date;
  /** Free-text match against name / email. */
  q?: string;
  page: number;
  limit: number;
  /** Ignore paging and return every matching row (capped). For CSV export. */
  exportAll?: boolean;
}

export interface ReportPage<TRow, TTotals> {
  items: TRow[];
  total: number;
  page: number;
  totalPages: number;
  totals: TTotals;
  /** Echoes the window actually applied, so the CSV filename can name it. */
  range: { from: string | null; to: string | null };
}

/** `null` when the caller gave no window at all. */
function dateRangeMatch(from?: Date, to?: Date): Record<string, Date> | null {
  const clause: Record<string, Date> = {};
  if (from) clause.$gte = from;
  if (to) clause.$lte = to;
  return Object.keys(clause).length > 0 ? clause : null;
}

/** Paging stages, or a bare cap when running an export. */
function pagingStages(opts: ReportQuery): PipelineStage.FacetPipelineStage[] {
  if (opts.exportAll) {
    return [{ $limit: REPORT_EXPORT_MAX_ROWS }];
  }
  const page = Math.max(1, Math.floor(opts.page) || 1);
  const limit = Math.min(200, Math.max(1, Math.floor(opts.limit) || 20));
  return [{ $skip: (page - 1) * limit }, { $limit: limit }];
}

function pageMeta(
  opts: ReportQuery,
  total: number,
): { page: number; totalPages: number } {
  if (opts.exportAll) return { page: 1, totalPages: 1 };
  const page = Math.max(1, Math.floor(opts.page) || 1);
  const limit = Math.min(200, Math.max(1, Math.floor(opts.limit) || 20));
  return { page, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

function rangeEcho(opts: ReportQuery) {
  return {
    from: opts.from ? opts.from.toISOString() : null,
    to: opts.to ? opts.to.toISOString() : null,
  };
}

/**
 * Stages that attach `name` / `email` from the users collection and apply the
 * free-text filter. `localField` is where the user id lives on the incoming
 * docs — `_id` when they are grouped by user, `userId` when the grain is wider.
 */
function userJoinStages(
  q?: string,
  localField = "_id",
): PipelineStage.FacetPipelineStage[] {
  const stages: PipelineStage.FacetPipelineStage[] = [
    {
      $lookup: {
        from: UserModel.collection.name,
        localField,
        foreignField: "_id",
        pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
        as: "userDoc",
      },
    },
    { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        email: { $ifNull: ["$userDoc.email", ""] },
        name: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ["$userDoc.firstName", ""] },
                " ",
                { $ifNull: ["$userDoc.lastName", ""] },
              ],
            },
          },
        },
      },
    },
    { $project: { userDoc: 0 } },
  ];

  const term = (q ?? "").trim();
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    stages.push({ $match: { $or: [{ email: rx }, { name: rx }] } });
  }
  return stages;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Platform success points (student wallet)
// ═══════════════════════════════════════════════════════════════════════════

export interface PlatformPointsRow {
  userId: string;
  name: string;
  email: string;
  /** Credits: completion + plan purchase + milestone rewards + transfers in. */
  earned: number;
  /** Debits: checkout redemptions + transfers out + negative admin adjustments. */
  spent: number;
  /** Live wallet balance — always all-time, never scoped to the date range. */
  balance: number;
  earnedBreakdown: {
    courses: number;
    rewards: number;
    transfersIn: number;
    adminGrants: number;
  };
  spentBreakdown: {
    redeemed: number;
    transfersOut: number;
    adminDeductions: number;
    expired: number;
  };
}

export interface PlatformPointsTotals {
  users: number;
  earned: number;
  spent: number;
  net: number;
}

/**
 * Credit / debit classification for one `successPointsHistory` entry.
 *
 * `redeemed` and `transferred_out` store a positive magnitude and are debits by
 * type. `admin_adjustment` is the only signed type, so its sign decides the
 * side it lands on.
 */
const CREDIT_EXPR = {
  $switch: {
    branches: [
      {
        case: { $in: ["$tx.type", ["earned", "reward", "transferred_in"]] },
        then: "$tx.points",
      },
      {
        case: {
          $and: [
            { $eq: ["$tx.type", "admin_adjustment"] },
            { $gt: ["$tx.points", 0] },
          ],
        },
        then: "$tx.points",
      },
    ],
    default: 0,
  },
};

const DEBIT_EXPR = {
  $switch: {
    branches: [
      {
        case: { $in: ["$tx.type", ["redeemed", "transferred_out", "expired"]] },
        then: { $abs: "$tx.points" },
      },
      {
        case: {
          $and: [
            { $eq: ["$tx.type", "admin_adjustment"] },
            { $lt: ["$tx.points", 0] },
          ],
        },
        then: { $abs: "$tx.points" },
      },
    ],
    default: 0,
  },
};

/** Sums `$tx.points` only for the listed transaction types. */
const sumForTypes = (types: string[]) => ({
  $sum: {
    $cond: [{ $in: ["$tx.type", types] }, { $abs: "$tx.points" }, 0],
  },
});

/** Sums signed `admin_adjustment` entries on one side of zero. */
const sumAdminAdjustments = (side: "grant" | "deduction") => ({
  $sum: {
    $cond: [
      {
        $and: [
          { $eq: ["$tx.type", "admin_adjustment"] },
          side === "grant"
            ? { $gt: ["$tx.points", 0] }
            : { $lt: ["$tx.points", 0] },
        ],
      },
      { $abs: "$tx.points" },
      0,
    ],
  },
});

export async function getPlatformSuccessPointsReport(
  opts: ReportQuery,
): Promise<ReportPage<PlatformPointsRow, PlatformPointsTotals>> {
  const range = dateRangeMatch(opts.from, opts.to);

  const pipeline: PipelineStage[] = [];

  // Pre-filter on the multikey `successPointsHistory.earnedAt` index so only
  // students with at least one in-window transaction get unwound. Without a
  // window this is unavoidably a scan of the student discriminator — a
  // lifetime report has no narrower access path.
  if (range) {
    pipeline.push({ $match: { "successPointsHistory.earnedAt": range } });
  } else {
    pipeline.push({ $match: { successPointsHistory: { $ne: [] } } });
  }

  pipeline.push(
    { $project: { successPoints: 1, tx: "$successPointsHistory" } },
    { $unwind: "$tx" },
  );

  // Second, exact filter: the pre-filter above only proved the *document* has
  // some entry in range, not that this particular entry does.
  if (range) {
    pipeline.push({ $match: { "tx.earnedAt": range } });
  }

  pipeline.push(
    {
      $group: {
        _id: "$_id",
        balance: { $first: "$successPoints" },
        earned: { $sum: CREDIT_EXPR },
        spent: { $sum: DEBIT_EXPR },
        earnedCourses: sumForTypes(["earned"]),
        earnedRewards: sumForTypes(["reward"]),
        earnedTransfersIn: sumForTypes(["transferred_in"]),
        earnedAdminGrants: sumAdminAdjustments("grant"),
        spentRedeemed: sumForTypes(["redeemed"]),
        spentTransfersOut: sumForTypes(["transferred_out"]),
        spentAdminDeductions: sumAdminAdjustments("deduction"),
        spentExpired: sumForTypes(["expired"]),
      },
    },
    // Drop users whose in-window entries all netted to nothing.
    { $match: { $or: [{ earned: { $gt: 0 } }, { spent: { $gt: 0 } }] } },
    ...userJoinStages(opts.q),
    {
      $facet: {
        rows: [
          { $sort: { earned: -1, spent: -1, _id: 1 } },
          ...pagingStages(opts),
        ],
        meta: [
          {
            $group: {
              _id: null,
              users: { $sum: 1 },
              earned: { $sum: "$earned" },
              spent: { $sum: "$spent" },
            },
          },
        ],
      },
    },
  );

  const [facet] = await StudentModel.aggregate<{
    rows: Record<string, unknown>[];
    meta: { users: number; earned: number; spent: number }[];
  }>(pipeline).allowDiskUse(true);

  const rawRows = facet?.rows ?? [];
  const meta = facet?.meta?.[0];
  const total = Number(meta?.users ?? 0);

  const items: PlatformPointsRow[] = rawRows.map((r) => ({
    userId: String(r._id),
    name: String(r.name ?? ""),
    email: String(r.email ?? ""),
    earned: Number(r.earned ?? 0),
    spent: Number(r.spent ?? 0),
    balance: Number(r.balance ?? 0),
    earnedBreakdown: {
      courses: Number(r.earnedCourses ?? 0),
      rewards: Number(r.earnedRewards ?? 0),
      transfersIn: Number(r.earnedTransfersIn ?? 0),
      adminGrants: Number(r.earnedAdminGrants ?? 0),
    },
    spentBreakdown: {
      redeemed: Number(r.spentRedeemed ?? 0),
      transfersOut: Number(r.spentTransfersOut ?? 0),
      adminDeductions: Number(r.spentAdminDeductions ?? 0),
      expired: Number(r.spentExpired ?? 0),
    },
  }));

  const earned = Number(meta?.earned ?? 0);
  const spent = Number(meta?.spent ?? 0);

  return {
    items,
    total,
    ...pageMeta(opts, total),
    totals: { users: total, earned, spent, net: earned - spent },
    range: rangeEcho(opts),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Internship success points
// ═══════════════════════════════════════════════════════════════════════════

/** One internship's slice of a learner's internship success points. */
export interface InternshipPointsSlice {
  internshipId: string;
  /** Title snapshotted on the enrollment, so it survives an internship rename. */
  internshipTitle: string;
  /** Batch name(s) the learner holds for this internship. */
  batches: string[];
  /** tasks + meetings + purchased, for this internship. */
  earned: number;
  /**
   * Live `internshipSuccessPoints` counter across the learner's enrollments in
   * this internship. Always all-time — a reconciliation check against `earned`,
   * which is window-scoped.
   */
  currentPoints: number;
  tasks: number;
  meetings: number;
  purchased: number;
}

export interface InternshipPointsRow {
  userId: string;
  name: string;
  email: string;
  /** Total across every internship — tasks + meetings + purchased. */
  earned: number;
  currentPoints: number;
  earnedBreakdown: {
    /** Graded task / exam submissions (`creditedSuccessPoints`). */
    tasks: number;
    /** Live-meeting attendance awards. */
    meetings: number;
    /** Points bought outright via an `internship_success_points` order. */
    purchased: number;
  };
  /** The learner's points divided by internship, highest earning first. */
  internships: InternshipPointsSlice[];
}

export interface InternshipPointsTotals {
  /** Row count — one per learner. */
  learners: number;
  /** Distinct internships represented across the filtered rows. */
  internships: number;
  earned: number;
  tasks: number;
  meetings: number;
  purchased: number;
}

/**
 * Internship success points per learner **per internship**, rebuilt from the
 * three dated sources that credit `InternshipEnrollment.internshipSuccessPoints`:
 *
 *  - graded submissions  → `creditedSuccessPoints`, dated by `updatedAt`
 *    (the field is a per-submission ledger reconciled on every review, so
 *    re-grades and clawbacks are already folded in);
 *  - live meetings       → `successPoints` per finalized meeting, credited to
 *    every learner on the batch roster who has no absence row, dated by
 *    `finalizedAt`;
 *  - purchases           → `internshipSuccessPointsQuantity` on fulfilled
 *    `internship_success_points` orders, dated by `createdAt`.
 *
 * All three sources carry the internship id, so the aggregation first groups by
 * (learner × internship) and then rolls those slices up into one row per
 * learner, keeping the per-internship division in `internships[]` for the
 * drill-down. Batches collapse into their internship: a learner enrolled in two
 * batches of the same programme gets one slice listing both batch names.
 *
 * There is no `spent` figure. Internship points are a certification score, not
 * a wallet, and nothing in the codebase debits them; the decrements that exist
 * (re-grades, revoked attendance) are corrections already folded into the
 * sources above.
 *
 * Caveat: a post-finalize attendance override credits points on the day the
 * admin flips the verdict, but this attributes them to the meeting's
 * `finalizedAt`. Lifetime totals are exact; a narrow window can misplace such a
 * correction.
 */
export async function getInternshipSuccessPointsReport(
  opts: ReportQuery,
): Promise<ReportPage<InternshipPointsRow, InternshipPointsTotals>> {
  const range = dateRangeMatch(opts.from, opts.to);

  // ── Source A: graded task / exam submissions ──
  const submissionMatch: Record<string, unknown> = {
    creditedSuccessPoints: { $gt: 0 },
  };
  if (range) submissionMatch.updatedAt = range;

  // ── Source B: purchased points ──
  const orderMatch: Record<string, unknown> = {
    orderKind: "internship_success_points",
    paymentStatus: "success",
    internshipSuccessPointsFulfillmentApplied: true,
    internshipSuccessPointsQuantity: { $gt: 0 },
  };
  if (range) orderMatch.createdAt = range;

  // ── Source C: live-meeting attendance ──
  // Present = batch roster minus absence rows (only absentees get a row).
  const meetingMatch: Record<string, unknown> = {
    finalizedAt: { $ne: null },
    successPoints: { $gt: 0 },
  };
  if (range) meetingMatch.finalizedAt = { $ne: null, ...range };

  const meetingPipeline: Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[] = [
    { $match: meetingMatch },
    {
      $lookup: {
        from: InternshipEnrollmentModel.collection.name,
        let: { mi: "$internship", mb: "$batchId" },
        pipeline: [
          {
            $match: {
              status: { $in: [...ENROLLED_STATUSES] },
              $expr: {
                $and: [
                  { $eq: ["$internship", "$$mi"] },
                  { $eq: ["$batchSnapshot.batchId", "$$mb"] },
                ],
              },
            },
          },
          { $project: { user: 1 } },
        ],
        as: "roster",
      },
    },
    {
      $lookup: {
        from: InternshipLiveMeetingAttendanceModel.collection.name,
        localField: "_id",
        foreignField: "meeting",
        pipeline: [{ $project: { user: 1 } }],
        as: "absentees",
      },
    },
    {
      $project: {
        successPoints: 1,
        internship: 1,
        present: {
          $setDifference: [
            { $map: { input: "$roster", as: "r", in: "$$r.user" } },
            { $map: { input: "$absentees", as: "a", in: "$$a.user" } },
          ],
        },
      },
    },
    { $unwind: "$present" },
    {
      $group: {
        _id: { user: "$present", internship: "$internship" },
        tasks: { $sum: 0 },
        meetings: { $sum: "$successPoints" },
        purchased: { $sum: 0 },
      },
    },
  ];

  const pipeline: PipelineStage[] = [
    { $match: submissionMatch },
    {
      $group: {
        _id: { user: "$userId", internship: "$internshipId" },
        tasks: { $sum: "$creditedSuccessPoints" },
        meetings: { $sum: 0 },
        purchased: { $sum: 0 },
      },
    },
    {
      $unionWith: {
        coll: OrderModel.collection.name,
        pipeline: [
          { $match: orderMatch },
          {
            $group: {
              _id: { user: "$userId", internship: "$internshipId" },
              tasks: { $sum: 0 },
              meetings: { $sum: 0 },
              purchased: { $sum: "$internshipSuccessPointsQuantity" },
            },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: InternshipLiveMeetingModel.collection.name,
        pipeline: meetingPipeline,
      },
    },
    // Collapse the three source streams into one row per (learner, internship).
    {
      $group: {
        _id: "$_id",
        tasks: { $sum: "$tasks" },
        meetings: { $sum: "$meetings" },
        purchased: { $sum: "$purchased" },
      },
    },
    {
      $addFields: {
        userId: "$_id.user",
        internshipId: "$_id.internship",
        earned: { $add: ["$tasks", "$meetings", "$purchased"] },
      },
    },
    { $match: { earned: { $gt: 0 } } },
    ...userJoinStages(opts.q, "userId"),
    // The learner's enrollments in this internship carry the title/batch
    // snapshots and the live points counter. Multiple rows = multiple batches.
    {
      $lookup: {
        from: InternshipEnrollmentModel.collection.name,
        let: { u: "$userId", i: "$internshipId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", "$$u"] },
                  { $eq: ["$internship", "$$i"] },
                ],
              },
            },
          },
          {
            $project: {
              title: "$internshipSnapshot.title",
              batchName: "$batchSnapshot.name",
              internshipSuccessPoints: 1,
            },
          },
        ],
        as: "enrollments",
      },
    },
    // Fallback title for the (rare) row whose enrollment snapshot is empty.
    {
      $lookup: {
        from: InternshipModel.collection.name,
        localField: "internshipId",
        foreignField: "_id",
        pipeline: [{ $project: { title: 1 } }],
        as: "internshipDoc",
      },
    },
    {
      $addFields: {
        internshipTitle: {
          $ifNull: [
            {
              $first: {
                $filter: {
                  input: {
                    $map: { input: "$enrollments", as: "e", in: "$$e.title" },
                  },
                  as: "t",
                  cond: { $and: [{ $ne: ["$$t", null] }, { $ne: ["$$t", ""] }] },
                },
              },
            },
            { $ifNull: [{ $first: "$internshipDoc.title" }, ""] },
          ],
        },
        batches: {
          $setDifference: [
            {
              $map: { input: "$enrollments", as: "e", in: "$$e.batchName" },
            },
            [null, ""],
          ],
        },
        currentPoints: {
          $sum: {
            $map: {
              input: "$enrollments",
              as: "e",
              in: { $ifNull: ["$$e.internshipSuccessPoints", 0] },
            },
          },
        },
      },
    },
    { $project: { enrollments: 0, internshipDoc: 0 } },
    // Highest-earning internship first — `$push` below preserves this order, so
    // the drill-down list arrives pre-sorted.
    { $sort: { earned: -1, internshipId: 1 } },
    {
      $group: {
        _id: "$userId",
        name: { $first: "$name" },
        email: { $first: "$email" },
        earned: { $sum: "$earned" },
        tasks: { $sum: "$tasks" },
        meetings: { $sum: "$meetings" },
        purchased: { $sum: "$purchased" },
        currentPoints: { $sum: "$currentPoints" },
        internships: {
          $push: {
            internshipId: "$internshipId",
            internshipTitle: "$internshipTitle",
            batches: "$batches",
            earned: "$earned",
            currentPoints: "$currentPoints",
            tasks: "$tasks",
            meetings: "$meetings",
            purchased: "$purchased",
          },
        },
      },
    },
    {
      $facet: {
        rows: [{ $sort: { earned: -1, _id: 1 } }, ...pagingStages(opts)],
        meta: [
          {
            $group: {
              _id: null,
              learners: { $sum: 1 },
              earned: { $sum: "$earned" },
              tasks: { $sum: "$tasks" },
              meetings: { $sum: "$meetings" },
              purchased: { $sum: "$purchased" },
            },
          },
        ],
        // Distinct internships across the whole filtered set, which the
        // per-learner rows above can't yield directly.
        internshipCount: [
          { $unwind: "$internships" },
          { $group: { _id: "$internships.internshipId" } },
          { $count: "count" },
        ],
      },
    },
  ];

  const [facet] = await InternshipSubmissionModel.aggregate<{
    rows: Record<string, unknown>[];
    meta: {
      learners: number;
      earned: number;
      tasks: number;
      meetings: number;
      purchased: number;
    }[];
    internshipCount: { count: number }[];
  }>(pipeline).allowDiskUse(true);

  const rawRows = facet?.rows ?? [];
  const meta = facet?.meta?.[0];
  const total = Number(meta?.learners ?? 0);

  const toSlice = (s: Record<string, unknown>): InternshipPointsSlice => ({
    internshipId: String(s.internshipId ?? ""),
    internshipTitle: String(s.internshipTitle ?? ""),
    batches: Array.isArray(s.batches) ? s.batches.map(String) : [],
    earned: Number(s.earned ?? 0),
    currentPoints: Number(s.currentPoints ?? 0),
    tasks: Number(s.tasks ?? 0),
    meetings: Number(s.meetings ?? 0),
    purchased: Number(s.purchased ?? 0),
  });

  const items: InternshipPointsRow[] = rawRows.map((r) => ({
    userId: String(r._id),
    name: String(r.name ?? ""),
    email: String(r.email ?? ""),
    earned: Number(r.earned ?? 0),
    currentPoints: Number(r.currentPoints ?? 0),
    earnedBreakdown: {
      tasks: Number(r.tasks ?? 0),
      meetings: Number(r.meetings ?? 0),
      purchased: Number(r.purchased ?? 0),
    },
    internships: Array.isArray(r.internships)
      ? (r.internships as Record<string, unknown>[]).map(toSlice)
      : [],
  }));

  return {
    items,
    total,
    ...pageMeta(opts, total),
    totals: {
      learners: total,
      internships: Number(facet?.internshipCount?.[0]?.count ?? 0),
      earned: Number(meta?.earned ?? 0),
      tasks: Number(meta?.tasks ?? 0),
      meetings: Number(meta?.meetings ?? 0),
      purchased: Number(meta?.purchased ?? 0),
    },
    range: rangeEcho(opts),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Referrals
// ═══════════════════════════════════════════════════════════════════════════

export interface ReferralReportRow {
  userId: string;
  brand: Brand;
  name: string;
  email: string;
  /** Referral code, when the user has a profile. */
  code: string;
  /** Count of `active` referral sales. Reversed (refunded) sales excluded. */
  totalReferrals: number;
  /** Σ frozen `commissionAmount` over active sales. */
  totalEarned: number;
  /** Σ withdrawals that reached `success`. */
  totalPaid: number;
  /** Withdrawals requested but not yet settled (pending + processing). */
  pendingPayout: number;
  /** earned − paid − pending. What the learner can still withdraw. */
  balance: number;
}

export interface ReferralReportTotals {
  users: number;
  totalReferrals: number;
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
}

/**
 * Per-referrer commission vs. payout, one row per referrer per brand: each brand
 * keeps its own code and balance, so adding them up would overstate what either
 * one can pay out.
 *
 * Row set is the union of referrers with sales and referrers with withdrawals,
 * so someone who has been paid out but whose only sale was later reversed still
 * appears rather than silently vanishing.
 *
 * Date semantics: sales are windowed on `createdAt` (when the sale was earned),
 * withdrawals on `decidedAt` (when the money actually moved), falling back to
 * `createdAt` for rows still awaiting a decision.
 */
export async function getReferralReport(
  opts: ReportQuery & { brand?: Brand },
): Promise<ReportPage<ReferralReportRow, ReferralReportTotals>> {
  const range = dateRangeMatch(opts.from, opts.to);
  const brandMatch = opts.brand ? { brand: opts.brand } : {};

  const saleMatch: Record<string, unknown> = { status: "active", ...brandMatch };
  if (range) saleMatch.createdAt = range;

  const pipeline: PipelineStage[] = [
    { $match: saleMatch },
    {
      $group: {
        _id: { userId: "$referrerUserId", brand: "$brand" },
        totalReferrals: { $sum: 1 },
        totalEarned: { $sum: "$commissionAmount" },
        totalPaid: { $sum: 0 },
        pendingPayout: { $sum: 0 },
      },
    },
    {
      $unionWith: {
        coll: ReferralWithdrawalModel.collection.name,
        pipeline: [
          // `status` is indexed; the effective-date filter below runs on the
          // (small) surviving set.
          {
            $match: {
              status: { $in: ["pending", "processing", "success"] },
              ...brandMatch,
            },
          },
          {
            $addFields: {
              effectiveDate: { $ifNull: ["$decidedAt", "$createdAt"] },
            },
          },
          ...(range
            ? [{ $match: { effectiveDate: range } } as PipelineStage.Match]
            : []),
          {
            $group: {
              _id: { userId: "$referrerUserId", brand: "$brand" },
              totalReferrals: { $sum: 0 },
              totalEarned: { $sum: 0 },
              totalPaid: {
                $sum: {
                  $cond: [{ $eq: ["$status", "success"] }, "$amount", 0],
                },
              },
              pendingPayout: {
                $sum: {
                  $cond: [{ $ne: ["$status", "success"] }, "$amount", 0],
                },
              },
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: "$_id",
        totalReferrals: { $sum: "$totalReferrals" },
        totalEarned: { $sum: "$totalEarned" },
        totalPaid: { $sum: "$totalPaid" },
        pendingPayout: { $sum: "$pendingPayout" },
      },
    },
    {
      $addFields: {
        balance: {
          $subtract: [
            "$totalEarned",
            { $add: ["$totalPaid", "$pendingPayout"] },
          ],
        },
      },
    },
    ...userJoinStages(opts.q, "_id.userId"),
    // Referral code for display / CSV, from the profile on the row's brand.
    // Profiles are lazy-created, so a referrer with sales always has one, but
    // keep it optional.
    {
      $lookup: {
        from: ReferralProfileModel.collection.name,
        let: { userId: "$_id.userId", brand: "$_id.brand" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", "$$userId"] },
                  { $eq: ["$brand", "$$brand"] },
                ],
              },
            },
          },
          { $project: { code: 1 } },
        ],
        as: "profile",
      },
    },
    {
      $addFields: {
        code: { $ifNull: [{ $first: "$profile.code" }, ""] },
      },
    },
    { $project: { profile: 0 } },
    {
      $facet: {
        rows: [
          { $sort: { totalEarned: -1, totalReferrals: -1, _id: 1 } },
          ...pagingStages(opts),
        ],
        meta: [
          {
            $group: {
              _id: null,
              users: { $sum: 1 },
              totalReferrals: { $sum: "$totalReferrals" },
              totalEarned: { $sum: "$totalEarned" },
              totalPaid: { $sum: "$totalPaid" },
              pendingPayout: { $sum: "$pendingPayout" },
            },
          },
        ],
      },
    },
  ];

  const [facet] = await ReferralSaleModel.aggregate<{
    rows: Record<string, unknown>[];
    meta: {
      users: number;
      totalReferrals: number;
      totalEarned: number;
      totalPaid: number;
      pendingPayout: number;
    }[];
  }>(pipeline).allowDiskUse(true);

  const rawRows = facet?.rows ?? [];
  const meta = facet?.meta?.[0];
  const total = Number(meta?.users ?? 0);

  const items: ReferralReportRow[] = rawRows.map((r) => ({
    userId: String((r._id as { userId: unknown }).userId),
    brand: asBrand((r._id as { brand: unknown }).brand),
    name: String(r.name ?? ""),
    email: String(r.email ?? ""),
    code: String(r.code ?? ""),
    totalReferrals: Number(r.totalReferrals ?? 0),
    totalEarned: round2(Number(r.totalEarned ?? 0)),
    totalPaid: round2(Number(r.totalPaid ?? 0)),
    pendingPayout: round2(Number(r.pendingPayout ?? 0)),
    balance: round2(Number(r.balance ?? 0)),
  }));

  return {
    items,
    total,
    ...pageMeta(opts, total),
    totals: {
      users: total,
      totalReferrals: Number(meta?.totalReferrals ?? 0),
      totalEarned: round2(Number(meta?.totalEarned ?? 0)),
      totalPaid: round2(Number(meta?.totalPaid ?? 0)),
      pendingPayout: round2(Number(meta?.pendingPayout ?? 0)),
    },
    range: rangeEcho(opts),
  };
}
