import mongoose from "mongoose";
import { LeadModel } from "../models/lead.schema";
import { UserModel } from "../models/user.schema";
import { CrmProfileModel } from "../models/crmProfile.schema";
import { toAmbassadorKind, type AmbassadorKind } from "./crmProfile.services";
import { toAmbassadorLeadRow, type AmbassadorLeadDoc } from "../lib/leadPrivacy";

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

/** Groups leads by one actor field for a batch of people, in a single pass. */
const countLeadsBy = async (
  field: string,
  ids: mongoose.Types.ObjectId[],
): Promise<Map<string, number>> => {
  if (ids.length === 0) return new Map();
  const out = await LeadModel.aggregate([
    { $match: { [field]: { $in: ids } } },
    { $group: { _id: `$${field}`, n: { $sum: 1 } } },
  ] as unknown as mongoose.PipelineStage[]);
  return new Map(out.map((r) => [String(r._id), r.n]));
};

/** Every count the roster shows, for however many people are on the page. */
const countsForPeople = async (ids: mongoose.Types.ObjectId[]) => {
  const [generated, teamGenerated, converted, ambassadors] = await Promise.all([
    countLeadsBy("creator.userId", ids),
    countLeadsBy("parent.userId", ids),
    countLeadsBy("convertedBy.userId", ids),
    (async () => {
      if (ids.length === 0) return new Map<string, number>();
      const out = await CrmProfileModel.aggregate([
        { $match: { parentUserId: { $in: ids } } },
        { $group: { _id: "$parentUserId", n: { $sum: 1 } } },
      ] as unknown as mongoose.PipelineStage[]);
      return new Map(out.map((r) => [String(r._id), r.n]));
    })(),
  ]);
  return { generated, teamGenerated, converted, ambassadors };
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
    // The code lives on the profile now, so it is resolved to ids first and
    // joined in as a fourth branch. That keeps this one paginated, sorted
    // query on User instead of a post-join match that would scan.
    const codeMatches = await CrmProfileModel.find(
      { code: { $regex: `^${safe}`, $options: "i" } },
      { userId: 1 },
    ).lean();
    filter.$or = [
      { firstName: { $regex: safe, $options: "i" } },
      { lastName: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { _id: { $in: codeMatches.map((m) => m.userId) } },
    ];
  }

  const [rows, total] = await Promise.all([
    UserModel.find(filter, {
      firstName: 1,
      lastName: 1,
      email: 1,
      userType: 1,
    })
      .sort({ firstName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  const ids = rows.map((r) => r._id as unknown as mongoose.Types.ObjectId);

  // The page's codes, keyed by user, so the row shape is unchanged.
  const profiles = await CrmProfileModel.find(
    { userId: { $in: ids } },
    { userId: 1, code: 1, codeActive: 1 },
  ).lean();
  const profileByUser = new Map(profiles.map((p) => [String(p.userId), p]));

  const { generated, teamGenerated, converted, ambassadors } =
    await countsForPeople(ids);

  return {
    people: rows.map((r) => {
      const id = String(r._id);
      const profile = profileByUser.get(id);
      return {
        userId: id,
        name:
          [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.email,
        email: r.email,
        userType: r.userType as "marketer" | "sales",
        code: profile?.code ?? null,
        active: profile?.codeActive !== false,
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

export interface CrmAmbassadorRow {
  userId: string;
  name: string;
  email: string;
  code: string | null;
  kind: AmbassadorKind | null;
  active: boolean;
  addedAt: Date | null;
  generated: number;
  converted: number;
}

/** One staff member's header row, so a detail page need not fetch the list. */
export const getCrmPerson = async (
  userId: string,
): Promise<CrmPersonRow | null> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  const id = new mongoose.Types.ObjectId(userId);

  const row = await UserModel.findOne(
    { _id: id, userType: { $in: ["marketer", "sales"] } },
    {
      firstName: 1,
      lastName: 1,
      email: 1,
      userType: 1,
    },
  ).lean();
  if (!row) return null;

  const profile = await CrmProfileModel.findOne(
    { userId: id },
    { code: 1, codeActive: 1 },
  ).lean();

  const { generated, teamGenerated, converted, ambassadors } =
    await countsForPeople([id]);
  const key = String(id);

  return {
    userId: key,
    name:
      [row.firstName, row.lastName].filter(Boolean).join(" ").trim() ||
      row.email,
    email: row.email,
    userType: row.userType as "marketer" | "sales",
    code: profile?.code ?? null,
    active: profile?.codeActive !== false,
    ambassadors: ambassadors.get(key) ?? 0,
    generated: generated.get(key) ?? 0,
    teamGenerated: teamGenerated.get(key) ?? 0,
    converted: converted.get(key) ?? 0,
  };
};

/**
 * The ambassadors one staff member has recruited, with what each has brought in.
 *
 * Ambassadors never close a lead themselves, so `converted` here is how many of
 * the leads they generated were later closed by whoever worked them. That is the
 * number an incentive decision actually turns on.
 */
export const listAmbassadorsForPerson = async (
  userId: string,
  page = 1,
  limit = 20,
): Promise<{
  ambassadors: CrmAmbassadorRow[];
  total: number;
  totalPages: number;
}> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { ambassadors: [], total: 0, totalPages: 1 };
  }
  const ownerId = new mongoose.Types.ObjectId(userId);
  const filter = { parentUserId: ownerId };

  // Paginated on the profile, which owns the roster relationship and the sort,
  // then joined back to User for the identity fields.
  const [profiles, total] = await Promise.all([
    CrmProfileModel.find(filter, {
      userId: 1,
      code: 1,
      codeActive: 1,
      ambassadorKind: 1,
      createdAt: 1,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CrmProfileModel.countDocuments(filter),
  ]);

  const ids = profiles.map(
    (p) => p.userId as unknown as mongoose.Types.ObjectId,
  );
  const people = await UserModel.find(
    { _id: { $in: ids } },
    { firstName: 1, lastName: 1, email: 1 },
  ).lean();
  const personById = new Map(people.map((u) => [String(u._id), u]));
  // One pass keyed on `creator.userId`, splitting out the closed ones inline,
  // rather than a second aggregation filtered by status.
  const tally =
    ids.length === 0
      ? []
      : await LeadModel.aggregate([
          { $match: { "creator.userId": { $in: ids } } },
          {
            $group: {
              _id: "$creator.userId",
              n: { $sum: 1 },
              closed: {
                $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
              },
            },
          },
        ] as unknown as mongoose.PipelineStage[]);

  const byId = new Map(
    tally.map((t) => [String(t._id), { n: t.n as number, closed: t.closed as number }]),
  );

  return {
    ambassadors: profiles.map((p) => {
      const key = String(p.userId);
      const stat = byId.get(key);
      const u = personById.get(key);
      return {
        userId: key,
        name:
          [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() ||
          (u?.email ?? ""),
        email: u?.email ?? "",
        code: p.code ?? null,
        kind: toAmbassadorKind(p.ambassadorKind),
        active: p.codeActive !== false,
        addedAt: (p as { createdAt?: Date }).createdAt ?? null,
        generated: stat?.n ?? 0,
        converted: stat?.closed ?? 0,
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

// Projection only: contact fields, status and notes must never be read here,
// let alone returned, since this powers the ambassador's own leads page.
const MY_LEAD_PROJECTION = {
  name: 1,
  "source.title": 1,
  "source.program.title": 1,
  collegeName: 1,
  createdAt: 1,
} as const;

/** The leads attributed to this user's own ambassador code, privacy-masked. */
export const listMyLeads = async (userId: mongoose.Types.ObjectId, page = 1, limit = 20) => {
  const filter = { "creator.userId": userId };

  const [docs, total] = await Promise.all([
    LeadModel.find(filter, MY_LEAD_PROJECTION)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LeadModel.countDocuments(filter),
  ]);

  return {
    leads: docs.map((doc) => toAmbassadorLeadRow(doc as unknown as AmbassadorLeadDoc)),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};
