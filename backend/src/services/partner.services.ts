import mongoose from "mongoose";
import { UserModel } from "../models";
import { EnrollmentModel } from "../models/enrollment.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { CollegeModel } from "../models/college.schema";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Students without a canonical `college` ObjectId (legacy signup / incomplete profile). */
const studentHasNoCollegeRef = (): Record<string, unknown> => ({
  $or: [{ college: { $exists: false } }, { college: null }],
});

/**
 * Display strings commonly stored in {@link Student.collegeName} relative to the
 * main College directory `{ name, location }`.
 */
const collegeDirectoryNameVariants = (nameRaw: string, locationRaw: string): string[] => {
  const name = String(nameRaw ?? "").trim();
  const location = String(locationRaw ?? "").trim();
  const out = new Set<string>();
  if (name) out.add(name);
  if (name && location) {
    out.add(`${name}, ${location}`);
    out.add(`${name},${location}`);
  }
  return [...out];
};

/**
 * Stable roster of learner `_id`s a partner dashboard may see:
 *
 * - `student.college` equals the linked college (canonical), or
 * - no linked ref (`college` unset/null) AND `collegeName` equals one of the
 *   directory-derived labels above (legacy data before backfill runs).
 *
 * Students with another non-null {@link Student.college} are excluded from the
 * name fallback to avoid leaking rosters across institutions.
 */
async function getPartnerScopedStudentIds(
  partnerCollegeId: mongoose.Types.ObjectId,
): Promise<mongoose.Types.ObjectId[]> {
  const collegeDoc = await CollegeModel.findById(partnerCollegeId)
    .select("name location")
    .lean();
  if (!collegeDoc) return [];

  const variants = collegeDirectoryNameVariants(
    String((collegeDoc as { name?: string }).name ?? ""),
    String((collegeDoc as { location?: string }).location ?? ""),
  );

  const byRefPromise = UserModel.find({
    userType: "student",
    college: partnerCollegeId,
  })
    .select("_id")
    .lean();

  const legacyName =
    variants.length > 0
      ? UserModel.find({
          userType: "student",
          $and: [
            studentHasNoCollegeRef(),
            {
              $or: variants.map((v) => ({
                collegeName: {
                  $regex: `^${escapeRegex(v)}\\s*$`,
                  $options: "i",
                },
              })),
            },
          ],
        })
          .select("_id")
          .lean()
      : Promise.resolve([] as { _id: mongoose.Types.ObjectId }[]);

  const [byRef, byLegacy] = await Promise.all([byRefPromise, legacyName]);
  const set = new Set<string>();
  for (const d of [...byRef, ...byLegacy]) {
    set.add(String(d._id));
  }
  return [...set].map((id) => new mongoose.Types.ObjectId(id));
}

/**
 * Resolve a partner's college info. Throws if the partner has a dangling
 * `partnerCollege` ref (rare — covered by the schema's async validator on
 * write — but still possible if the college is deleted before the cascade
 * runs).
 */
export const getPartnerCollegeContext = async (
  partnerCollegeId: mongoose.Types.ObjectId | string,
) => {
  const college = await CollegeModel.findById(partnerCollegeId)
    .select("_id name location website image isActive")
    .lean();
  if (!college) return null;
  return {
    _id: String(college._id),
    name: String((college as { name?: string }).name ?? ""),
    location: String((college as { location?: string }).location ?? ""),
    website: (college as { website?: string }).website,
    image: (college as { image?: string }).image,
  };
};

export type PartnerDashboardDateRangeUtc = {
  startUtc: Date;
  endUtc: Date;
};

export interface PartnerDashboardStats {
  totalStudents: number;
  studentsEnrolledInCourses: number;
  studentsEnrolledInInternships: number;
  totalCourseEnrollments: number;
  totalInternshipEnrollments: number;
  /** Present when dashboard stats are restricted by `from`/`to`; full roster size. */
  rosterAllTimeCount?: number;
}

export interface PartnerMonthlyTrendPoint {
  year: number;
  month: number;
  newStudents: number;
  courseEnrollments: number;
  internshipEnrollments: number;
}

const INTERN_TREND_EXCLUDED_STATUSES = [
  "admin_rejected",
  "dropped",
  "revoked",
] as const;

function ymKey(year: number, month: number) {
  return `${year}-${month}`;
}

/**
 * Calendar months (exactly {@link durationMonths} buckets, ending at current
 * UTC month). Used to align Mongo monthly aggregates so charts render a
 * continuous series with zeros filled in.
 */
function buildMonthlyTrendSkeleton(
  durationMonths: number,
): PartnerMonthlyTrendPoint[] {
  const capped = Math.min(24, Math.max(3, Math.floor(durationMonths)));
  const endDate = new Date();
  const anchor = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const out: PartnerMonthlyTrendPoint[] = [];
  for (let i = capped - 1; i >= 0; i--) {
    const d = new Date(anchor);
    d.setMonth(anchor.getMonth() - i);
    out.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      newStudents: 0,
      courseEnrollments: 0,
      internshipEnrollments: 0,
    });
  }
  return out;
}

const MAX_TREND_RANGE_MONTHS = 36;

/**
 * Monthly buckets from the first UTC calendar month overlapping `startUtc`
 * through the UTC month containing `endUtc`, capped at
 * {@link MAX_TREND_RANGE_MONTHS}.
 */
function buildMonthlyTrendSkeletonFromRange(
  startUtc: Date,
  endUtc: Date,
): PartnerMonthlyTrendPoint[] {
  const startCap = Date.UTC(startUtc.getUTCFullYear(), startUtc.getUTCMonth(), 1);
  const endCap = Date.UTC(endUtc.getUTCFullYear(), endUtc.getUTCMonth(), 1);
  const out: PartnerMonthlyTrendPoint[] = [];
  for (
    let t = startCap;
    t <= endCap && out.length < MAX_TREND_RANGE_MONTHS;
    t = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth() + 1, 1)
  ) {
    const d = new Date(t);
    out.push({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      newStudents: 0,
      courseEnrollments: 0,
      internshipEnrollments: 0,
    });
  }
  return out;
}

export interface PartnerDashboardTrendsResult {
  durationMonths: number;
  monthlyTrend: PartnerMonthlyTrendPoint[];
}

/**
 * Month-by-month signup and enrollment starts for learners in the partner's
 * roster (canonical `student.college` match, plus legacy {@link Student.collegeName}
 * aligned to the directory row when `college` is unset — see {@link getPartnerScopedStudentIds}).
 *
 * Course counts use `enrollment.enrolledAt` (fallback `createdAt`).
 * Internship counts use `enrolledAt` (fallback `createdAt`).
 */
export const getPartnerDashboardTrendsService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  requestedMonths: number,
  dateRangeUtc: PartnerDashboardDateRangeUtc | null = null,
): Promise<PartnerDashboardTrendsResult> => {
  const monthlyTrend = dateRangeUtc
    ? buildMonthlyTrendSkeletonFromRange(
        dateRangeUtc.startUtc,
        dateRangeUtc.endUtc,
      )
    : buildMonthlyTrendSkeleton(requestedMonths);
  if (monthlyTrend.length === 0) {
    return { durationMonths: 0, monthlyTrend: [] };
  }

  const rosterIds = await getPartnerScopedStudentIds(partnerCollegeId);

  const rangeStart = dateRangeUtc
    ? dateRangeUtc.startUtc
    : new Date(
        monthlyTrend[0].year,
        monthlyTrend[0].month - 1,
        1,
      );
  const rangeEnd = dateRangeUtc ? dateRangeUtc.endUtc : new Date();

  const [newSignupRows, courseRows, internRows] = await Promise.all([
    rosterIds.length === 0
      ? Promise.resolve([])
      : UserModel.aggregate<{ _id: { year: number; month: number }; count: number }>([
          {
            $match: {
              userType: "student",
              _id: { $in: rosterIds },
              createdAt: { $gte: rangeStart, $lte: rangeEnd },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
        ]),
    rosterIds.length === 0
      ? Promise.resolve([])
      : EnrollmentModel.aggregate<{
          _id: { year: number; month: number };
          count: number;
        }>([
          {
            $addFields: {
              enrolledAtEffective: {
                $ifNull: ["$enrolledAt", "$createdAt"],
              },
            },
          },
          {
            $match: {
              enrolledAtEffective: { $gte: rangeStart, $lte: rangeEnd },
              status: { $in: ["active", "completed"] },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "u",
            },
          },
          { $unwind: "$u" },
          {
            $match: {
              "u.userType": "student",
              "u._id": { $in: rosterIds },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$enrolledAtEffective" },
                month: { $month: "$enrolledAtEffective" },
              },
              count: { $sum: 1 },
            },
          },
        ]),
    rosterIds.length === 0
      ? Promise.resolve([])
      : InternshipEnrollmentModel.aggregate<{
          _id: { year: number; month: number };
          count: number;
        }>([
          {
            $addFields: {
              trendAt: { $ifNull: ["$enrolledAt", "$createdAt"] },
            },
          },
          {
            $match: {
              trendAt: { $gte: rangeStart, $lte: rangeEnd },
              status: { $nin: [...INTERN_TREND_EXCLUDED_STATUSES] },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "u",
            },
          },
          { $unwind: "$u" },
          {
            $match: {
              "u.userType": "student",
              "u._id": { $in: rosterIds },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$trendAt" },
                month: { $month: "$trendAt" },
              },
              count: { $sum: 1 },
            },
          },
        ]),
  ]);

  const newMap = new Map(
    newSignupRows.map((r) => [
      ymKey(r._id.year, r._id.month),
      r.count,
    ] as const),
  );
  const courseMap = new Map(
    courseRows.map((r) => [ymKey(r._id.year, r._id.month), r.count] as const),
  );
  const internMap = new Map(
    internRows.map((r) => [ymKey(r._id.year, r._id.month), r.count] as const),
  );

  monthlyTrend.forEach((row) => {
    const k = ymKey(row.year, row.month);
    row.newStudents = newMap.get(k) ?? 0;
    row.courseEnrollments = courseMap.get(k) ?? 0;
    row.internshipEnrollments = internMap.get(k) ?? 0;
  });

  return {
    durationMonths: monthlyTrend.length,
    monthlyTrend,
  };
};

/**
 * Stats for the partner dashboard hero strip scoped to learners in {@link getPartnerScopedStudentIds}.
 *
 * Canonical `student.college` refs are preferred long-term (`backfill-student-college-ids.ts`).
 * Until backfill completes, roster also includes unmatched students whose {@link Student.collegeName}
 * equals the directory-derived labels for the linked college row.
 */
export const getPartnerDashboardStatsService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  dateRangeUtc: PartnerDashboardDateRangeUtc | null = null,
): Promise<PartnerDashboardStats> => {
  const ids = await getPartnerScopedStudentIds(partnerCollegeId);
  const rosterSize = ids.length;

  if (rosterSize === 0) {
    return {
      totalStudents: 0,
      studentsEnrolledInCourses: 0,
      studentsEnrolledInInternships: 0,
      totalCourseEnrollments: 0,
      totalInternshipEnrollments: 0,
    };
  }

  if (!dateRangeUtc) {
    const [
      courseEnrollmentTotal,
      distinctCourseLearners,
      internshipEnrollmentTotal,
      distinctInternshipLearners,
    ] = await Promise.all([
      EnrollmentModel.countDocuments({
        userId: { $in: ids },
        status: { $in: ["active", "completed"] },
      }),
      EnrollmentModel.distinct("userId", {
        userId: { $in: ids },
        status: { $in: ["active", "completed"] },
      }),
      InternshipEnrollmentModel.countDocuments({
        user: { $in: ids },
        status: { $nin: ["admin_rejected", "dropped", "revoked"] },
      }),
      InternshipEnrollmentModel.distinct("user", {
        user: { $in: ids },
        status: { $nin: ["admin_rejected", "dropped", "revoked"] },
      }),
    ]);

    return {
      totalStudents: rosterSize,
      studentsEnrolledInCourses: distinctCourseLearners.length,
      studentsEnrolledInInternships: distinctInternshipLearners.length,
      totalCourseEnrollments: courseEnrollmentTotal,
      totalInternshipEnrollments: internshipEnrollmentTotal,
    };
  }

  const { startUtc, endUtc } = dateRangeUtc;

  const courseMatchStages: mongoose.PipelineStage[] = [
    {
      $addFields: {
        enrolledAtEffective: { $ifNull: ["$enrolledAt", "$createdAt"] },
      },
    },
    {
      $match: {
        userId: { $in: ids },
        status: { $in: ["active", "completed"] },
        enrolledAtEffective: { $gte: startUtc, $lte: endUtc },
      },
    },
  ];

  const internMatchStages: mongoose.PipelineStage[] = [
    {
      $addFields: {
        enrolledAtEffective: { $ifNull: ["$enrolledAt", "$createdAt"] },
      },
    },
    {
      $match: {
        user: { $in: ids },
        status: { $nin: ["admin_rejected", "dropped", "revoked"] },
        enrolledAtEffective: { $gte: startUtc, $lte: endUtc },
      },
    },
  ];

  const [
    newSignups,
    courseTotalAgg,
    courseDistinctAgg,
    internTotalAgg,
    internDistinctAgg,
  ] = await Promise.all([
    UserModel.countDocuments({
      userType: "student",
      _id: { $in: ids },
      createdAt: { $gte: startUtc, $lte: endUtc },
    }),
    EnrollmentModel.aggregate<{ n: number }>([
      ...courseMatchStages,
      { $count: "n" },
    ]),
    EnrollmentModel.aggregate<{ n: number }>([
      ...courseMatchStages,
      { $group: { _id: "$userId" } },
      { $count: "n" },
    ]),
    InternshipEnrollmentModel.aggregate<{ n: number }>([
      ...internMatchStages,
      { $count: "n" },
    ]),
    InternshipEnrollmentModel.aggregate<{ n: number }>([
      ...internMatchStages,
      { $group: { _id: "$user" } },
      { $count: "n" },
    ]),
  ]);

  return {
    totalStudents: newSignups,
    rosterAllTimeCount: rosterSize,
    studentsEnrolledInCourses: courseDistinctAgg[0]?.n ?? 0,
    studentsEnrolledInInternships: internDistinctAgg[0]?.n ?? 0,
    totalCourseEnrollments: courseTotalAgg[0]?.n ?? 0,
    totalInternshipEnrollments: internTotalAgg[0]?.n ?? 0,
  };
};

export interface PartnerStudentRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  collegeName?: string;
  createdAt?: Date;
  enrolledCourses: number;
  enrolledInternships: number;
}

export interface ListPartnerStudentsResult {
  students: PartnerStudentRow[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Paginated student list scoped to the partner's college. Includes per-student
 * enrollment counts so the table can show "X courses / Y internships" without
 * a follow-up call per row.
 */
export const listPartnerStudentsService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  filters: { page?: number; limit?: number; search?: string } = {},
): Promise<ListPartnerStudentsResult> => {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const search = filters.search?.trim();

  const rosterIds = await getPartnerScopedStudentIds(partnerCollegeId);
  if (rosterIds.length === 0) {
    return {
      students: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }

  const scope = {
    userType: "student" as const,
    _id: { $in: rosterIds },
  };

  const query =
    typeof search === "string" && search.length > 0
      ? {
          ...scope,
          $or: [
            {
              firstName: {
                $regex: escapeRegex(search),
                $options: "i",
              },
            },
            {
              lastName: {
                $regex: escapeRegex(search),
                $options: "i",
              },
            },
            {
              email: {
                $regex: escapeRegex(search),
                $options: "i",
              },
            },
          ],
        }
      : scope;

  const [total, rawStudents] = await Promise.all([
    UserModel.countDocuments(query),
    UserModel.find(query)
      .select("_id firstName lastName email phone status collegeName createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  if (rawStudents.length === 0) {
    return {
      students: [],
      total,
      page,
      totalPages: Math.max(0, Math.ceil(total / limit)),
    };
  }

  const studentIds = rawStudents.map((s) => s._id);

  // Aggregate enrollment counts per user in a single round-trip each.
  const [courseCounts, internshipCounts] = await Promise.all([
    EnrollmentModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      {
        $match: {
          userId: { $in: studentIds },
          status: { $in: ["active", "completed"] },
        },
      },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    InternshipEnrollmentModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          user: { $in: studentIds },
          status: { $nin: ["admin_rejected", "dropped", "revoked"] },
        },
      },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]),
  ]);

  const courseMap = new Map(
    courseCounts.map((c) => [String(c._id), c.count] as const),
  );
  const internshipMap = new Map(
    internshipCounts.map((c) => [String(c._id), c.count] as const),
  );

  const students: PartnerStudentRow[] = rawStudents.map((s) => {
    const id = String(s._id);
    const sr = s as Record<string, unknown>;
    return {
      _id: id,
      firstName: String(sr.firstName ?? ""),
      lastName: String(sr.lastName ?? ""),
      email: String(sr.email ?? ""),
      phone:
        typeof sr.phone === "string" && sr.phone.trim().length > 0
          ? (sr.phone as string)
          : undefined,
      status: String(sr.status ?? ""),
      collegeName:
        typeof sr.collegeName === "string" ? (sr.collegeName as string) : undefined,
      createdAt: sr.createdAt as Date | undefined,
      enrolledCourses: courseMap.get(id) ?? 0,
      enrolledInternships: internshipMap.get(id) ?? 0,
    };
  });

  return {
    students,
    total,
    page,
    totalPages: Math.max(0, Math.ceil(total / limit)),
  };
};
