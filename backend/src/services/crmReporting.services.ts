import mongoose from "mongoose";
import { LeadModel } from "../models/lead.schema";
import { UserModel } from "../models/user.schema";

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface LeaderRow {
  userId: string;
  name: string;
  role?: string;
  count: number;
}

/**
 * Returns `{}` when neither bound is set. Sending `{ $gte: undefined }` would
 * match nothing rather than everything.
 */
export const rangeFilter = (
  field: string,
  range: DateRange,
): Record<string, unknown> => {
  const bounds: Record<string, Date> = {};
  if (range.from) bounds.$gte = range.from;
  if (range.to) bounds.$lte = range.to;
  return Object.keys(bounds).length > 0 ? { [field]: bounds } : {};
};

export const getCrmStats = async (
  userId: mongoose.Types.ObjectId,
  range: DateRange,
) => {
  const created = rangeFilter("createdAt", range);
  const converted = rangeFilter("convertedAt", range);

  const [generated, teamGenerated, assigned, convertedCount] =
    await Promise.all([
      LeadModel.countDocuments({ "creator.userId": userId, ...created }),
      LeadModel.countDocuments({ "parent.userId": userId, ...created }),
      LeadModel.countDocuments({ "assignedTo.userId": userId }),
      LeadModel.countDocuments({ "convertedBy.userId": userId, ...converted }),
    ]);

  return { generated, teamGenerated, assigned, converted: convertedCount };
};

/**
 * Leaderboards are date-range-first, so they read the reversed indexes rather
 * than the per-user ones. Null actors are excluded: unattributed leads would
 * otherwise group into a phantom leader.
 */
export const buildLeaderboardPipeline = (
  kind: "generated" | "converted",
  range: DateRange,
  limit: number,
): Record<string, unknown>[] => {
  const dateField = kind === "generated" ? "createdAt" : "convertedAt";
  const actor = kind === "generated" ? "creator" : "convertedBy";

  return [
    {
      $match: {
        [`${actor}.userId`]: { $ne: null },
        ...rangeFilter(dateField, range),
      },
    },
    {
      $group: {
        _id: `$${actor}.userId`,
        name: { $first: `$${actor}.name` },
        ...(kind === "generated" ? { role: { $first: "$creator.role" } } : {}),
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ];
};

const toRows = (
  docs: { _id: unknown; name?: string; role?: string; count: number }[],
): LeaderRow[] =>
  docs.map((d) => ({
    userId: String(d._id),
    name: d.name || "Unnamed",
    role: d.role,
    count: d.count,
  }));

export const getLeaderboards = async (range: DateRange, limit = 50) => {
  const [generated, converted] = await Promise.all([
    LeadModel.aggregate(
      buildLeaderboardPipeline(
        "generated",
        range,
        limit,
      ) as unknown as mongoose.PipelineStage[],
    ),
    LeadModel.aggregate(
      buildLeaderboardPipeline(
        "converted",
        range,
        limit,
      ) as unknown as mongoose.PipelineStage[],
    ),
  ]);

  return { generated: toRows(generated), converted: toRows(converted) };
};

/**
 * Days are bucketed in IST, not UTC, so "today" on the dashboard matches the
 * business day the team actually worked.
 */
const IST = "Asia/Kolkata";

const dayBucket = (field: string) => ({
  $dateToString: { format: "%Y-%m-%d", date: `$${field}`, timezone: IST },
});

export interface AnalyticsPoint {
  day: string;
  leads: number;
  conversions: number;
}

export interface NamedCount {
  label: string;
  count: number;
}

/**
 * Everything the analytics page shows, in one round trip per shape. Each
 * aggregation is bounded by an index: the funnel and breakdowns by their
 * `{field, createdAt}` compound indexes, the series by `{createdAt}`.
 */
export const getCrmAnalytics = async (range: DateRange, topN = 8) => {
  const created = rangeFilter("createdAt", range);
  const converted = rangeFilter("convertedAt", range);

  const byDay = (
    match: Record<string, unknown>,
    field: string,
  ): mongoose.PipelineStage[] =>
    [
      { $match: match },
      { $group: { _id: dayBucket(field), n: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ] as unknown as mongoose.PipelineStage[];

  const topBy = (field: string): mongoose.PipelineStage[] =>
    [
      { $match: { ...created, [field]: { $nin: [null, ""] } } },
      { $group: { _id: `$${field}`, n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: topN },
    ] as unknown as mongoose.PipelineStage[];

  const [
    total,
    unassigned,
    statuses,
    createdSeries,
    convertedSeries,
    states,
    colleges,
  ] = await Promise.all([
    LeadModel.countDocuments(created),
    LeadModel.countDocuments({ ...created, "assignedTo.userId": null }),
    LeadModel.aggregate([
      { $match: created },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ] as unknown as mongoose.PipelineStage[]),
    LeadModel.aggregate(byDay(created, "createdAt")),
    LeadModel.aggregate(
      byDay({ ...converted, convertedAt: { $ne: null } }, "convertedAt"),
    ),
    LeadModel.aggregate(topBy("state")),
    LeadModel.aggregate(topBy("collegeName")),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of statuses) statusCounts[String(row._id)] = row.n;

  // Union of both day sets, so a day with conversions but no new leads still
  // appears on the axis rather than silently shifting the line.
  const days = new Set<string>([
    ...createdSeries.map((r) => String(r._id)),
    ...convertedSeries.map((r) => String(r._id)),
  ]);
  const createdBy = new Map(createdSeries.map((r) => [String(r._id), r.n]));
  const convertedBy = new Map(convertedSeries.map((r) => [String(r._id), r.n]));

  const series: AnalyticsPoint[] = [...days]
    .sort()
    .map((day) => ({
      day,
      leads: createdBy.get(day) ?? 0,
      conversions: convertedBy.get(day) ?? 0,
    }));

  const toNamed = (rows: { _id: unknown; n: number }[]): NamedCount[] =>
    rows.map((r) => ({ label: String(r._id), count: r.n }));

  const convertedTotal = statusCounts.converted ?? 0;

  return {
    totals: {
      leads: total,
      converted: convertedTotal,
      unassigned,
      // Rounded to one place; the raw ratio is noise at these volumes.
      conversionRate:
        total > 0 ? Math.round((convertedTotal / total) * 1000) / 10 : 0,
    },
    funnel: [
      { label: "New", count: statusCounts.new ?? 0 },
      { label: "Contacted", count: statusCounts.contacted ?? 0 },
      { label: "Qualified", count: statusCounts.qualified ?? 0 },
      { label: "Converted", count: convertedTotal },
    ],
    lost: statusCounts.lost ?? 0,
    series,
    states: toNamed(states),
    colleges: toNamed(colleges),
  };
};

export interface CrmPersonRow {
  userId: string;
  name: string;
  email: string;
  userType: "marketer" | "sales";
  code: string | null;
  active: boolean;
  ambassadors: number;
  generated: number;
  teamGenerated: number;
  converted: number;
}

/**
 * The staff roster with each person's counts.
 *
 * Four aggregations for the whole page rather than three per person: each
 * `$in`s the page's ids and groups, so the cost does not scale with headcount.
 */
export const listCrmPeople = async (
  page = 1,
  limit = 20,
  search = "",
): Promise<{ people: CrmPersonRow[]; total: number; totalPages: number }> => {
  const filter: mongoose.FilterQuery<{ userType: string }> = {
    userType: { $in: ["marketer", "sales"] },
  };
  const term = search.trim();
  if (term) {
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { firstName: { $regex: safe, $options: "i" } },
      { lastName: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { crmCode: { $regex: `^${safe}`, $options: "i" } },
    ];
  }

  const [rows, total] = await Promise.all([
    UserModel.find(filter, {
      firstName: 1,
      lastName: 1,
      email: 1,
      userType: 1,
      crmCode: 1,
      crmCodeActive: 1,
    })
      .sort({ firstName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  const ids = rows.map((r) => r._id as unknown as mongoose.Types.ObjectId);
  const countBy = async (
    field: string,
    extra: Record<string, unknown> = {},
  ): Promise<Map<string, number>> => {
    if (ids.length === 0) return new Map();
    const out = await LeadModel.aggregate([
      { $match: { [field]: { $in: ids }, ...extra } },
      { $group: { _id: `$${field}`, n: { $sum: 1 } } },
    ] as unknown as mongoose.PipelineStage[]);
    return new Map(out.map((r) => [String(r._id), r.n]));
  };

  const [generated, teamGenerated, converted, ambassadors] = await Promise.all([
    countBy("creator.userId"),
    countBy("parent.userId"),
    countBy("convertedBy.userId"),
    (async () => {
      if (ids.length === 0) return new Map<string, number>();
      const out = await UserModel.aggregate([
        { $match: { crmParentUserId: { $in: ids } } },
        { $group: { _id: "$crmParentUserId", n: { $sum: 1 } } },
      ] as unknown as mongoose.PipelineStage[]);
      return new Map(out.map((r) => [String(r._id), r.n]));
    })(),
  ]);

  return {
    people: rows.map((r) => {
      const id = String(r._id);
      return {
        userId: id,
        name:
          [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.email,
        email: r.email,
        userType: r.userType as "marketer" | "sales",
        code: r.crmCode ?? null,
        active: r.crmCodeActive !== false,
        ambassadors: ambassadors.get(id) ?? 0,
        generated: generated.get(id) ?? 0,
        teamGenerated: teamGenerated.get(id) ?? 0,
        converted: converted.get(id) ?? 0,
      };
    }),
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export type PersonLeadScope = "generated" | "team" | "assigned" | "converted";

/** One person's leads, in full detail. An admin surface, so nothing is hidden. */
export const listLeadsForPerson = async (
  userId: string,
  scope: PersonLeadScope,
  page = 1,
  limit = 20,
) => {
  if (!mongoose.isValidObjectId(userId)) {
    return { leads: [], total: 0, totalPages: 1 };
  }
  const id = new mongoose.Types.ObjectId(userId);

  const filters: Record<PersonLeadScope, mongoose.FilterQuery<unknown>> = {
    generated: { "creator.userId": id },
    team: { "parent.userId": id },
    assigned: { "assignedTo.userId": id },
    converted: { "convertedBy.userId": id },
  };
  const filter = filters[scope] ?? filters.generated;

  const [leads, total] = await Promise.all([
    LeadModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LeadModel.countDocuments(filter),
  ]);

  return { leads, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
};
