import mongoose from "mongoose";
import { UserModel } from "../models";
import { EnrollmentModel } from "../models/enrollment.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { CollegeModel } from "../models/college.schema";
import { CourseModel } from "../models/course.schema";
import { CategoryModel } from "../models/category.schema";
import { CertificateModel } from "../models/certificate.schema";
import { InternshipModel } from "../models/internship.schema";

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

// ── Course analytics ────────────────────────────────────────────────────────

export interface PartnerCourseCategorySlice {
  categoryId: string;
  categoryName: string;
  audience: "college-students" | "professionals";
  enrollments: number;
  completions: number;
}

export interface PartnerCourseListItem {
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string;
  categories: string[];
  studentsEnrolled: number;
}

export interface PartnerCoursesResult {
  stats: {
    totalCourses: number;
    totalEnrollments: number;
    distinctLearners: number;
    certificatesIssued: number;
    /** % of enrollments that have reached `completed` status (0–100). */
    avgCompletion: number;
  };
  categoryBreakdown: PartnerCourseCategorySlice[];
  courses: PartnerCourseListItem[];
}

const EMPTY_COURSES_RESULT: PartnerCoursesResult = {
  stats: {
    totalCourses: 0,
    totalEnrollments: 0,
    distinctLearners: 0,
    certificatesIssued: 0,
    avgCompletion: 0,
  },
  categoryBreakdown: [],
  courses: [],
};

/**
 * Courses the partner's college students have enrolled in, with top-line stats
 * and a category breakdown for the pie chart. Course enrollments count
 * `status ∈ {active, completed}` only, consistent with the dashboard stats.
 */
export const getPartnerCoursesService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
): Promise<PartnerCoursesResult> => {
  const roster = await getPartnerScopedStudentIds(partnerCollegeId);

  const allCategories = await CategoryModel.find({ isActive: true })
    .select("_id name audience sortOrder")
    .lean();
  const categoryMeta = new Map<
    string,
    {
      name: string;
      audience: "college-students" | "professionals";
      sortOrder: number;
    }
  >(
    allCategories.map((c) => [
      String(c._id),
      {
        name: String((c as { name?: string }).name ?? "Uncategorised"),
        audience:
          ((c as { audience?: "college-students" | "professionals" }).audience ??
            "college-students"),
        sortOrder: Number((c as { sortOrder?: number }).sortOrder ?? 999),
      },
    ]),
  );

  const buildEmptyBreakdown = (): PartnerCourseCategorySlice[] =>
    allCategories
      .map((c) => {
        const meta = categoryMeta.get(String(c._id))!;
        return {
          categoryId: String(c._id),
          categoryName: meta.name,
          audience: meta.audience,
          enrollments: 0,
          completions: 0,
        };
      })
      .sort(
        (a, b) =>
          categoryMeta.get(a.categoryId)!.sortOrder -
          categoryMeta.get(b.categoryId)!.sortOrder,
      );

  if (roster.length === 0) {
    return { ...EMPTY_COURSES_RESULT, categoryBreakdown: buildEmptyBreakdown() };
  }

  const enrollments = await EnrollmentModel.find({
    userId: { $in: roster },
    status: { $in: ["active", "completed"] },
  })
    .select("userId courseId status")
    .lean();
  if (enrollments.length === 0) {
    return { ...EMPTY_COURSES_RESULT, categoryBreakdown: buildEmptyBreakdown() };
  }

  const perCourseLearners = new Map<string, Set<string>>();
  const distinctLearners = new Set<string>();
  for (const e of enrollments) {
    const courseId = String(e.courseId);
    const userId = String(e.userId);
    distinctLearners.add(userId);
    if (!perCourseLearners.has(courseId)) {
      perCourseLearners.set(courseId, new Set());
    }
    perCourseLearners.get(courseId)!.add(userId);
  }

  const courseIds = [...perCourseLearners.keys()].map(
    (id) => new mongoose.Types.ObjectId(id),
  );

  const courses = await CourseModel.find({ _id: { $in: courseIds } })
    .select("_id title slug thumbnail category")
    .lean();

  const courseCategoryIds = new Map<string, string[]>();
  for (const c of courses) {
    const cats = (
      (c as unknown as { category?: mongoose.Types.ObjectId[] }).category ?? []
    ).map((x) => String(x));
    courseCategoryIds.set(String(c._id), cats);
  }

  const courseList: PartnerCourseListItem[] = courses
    .map((c) => {
      const courseId = String(c._id);
      const catIds = courseCategoryIds.get(courseId) ?? [];
      return {
        courseId,
        title: String((c as { title?: string }).title ?? ""),
        slug: String((c as { slug?: string }).slug ?? ""),
        thumbnail: String((c as { thumbnail?: string }).thumbnail ?? ""),
        categories: catIds.map(
          (id) => categoryMeta.get(id)?.name ?? "Uncategorised",
        ),
        studentsEnrolled: perCourseLearners.get(courseId)?.size ?? 0,
      };
    })
    .sort((a, b) => b.studentsEnrolled - a.studentsEnrolled);

  const categoryEnrollments = new Map<string, number>();
  const categoryCompletions = new Map<string, number>();
  for (const e of enrollments) {
    const cats = courseCategoryIds.get(String(e.courseId)) ?? [];
    const isCompleted = (e as { status?: string }).status === "completed";
    for (const catId of cats) {
      categoryEnrollments.set(
        catId,
        (categoryEnrollments.get(catId) ?? 0) + 1,
      );
      if (isCompleted) {
        categoryCompletions.set(
          catId,
          (categoryCompletions.get(catId) ?? 0) + 1,
        );
      }
    }
  }

  const categoryBreakdown: PartnerCourseCategorySlice[] = allCategories
    .map((c) => {
      const id = String(c._id);
      const meta = categoryMeta.get(id)!;
      return {
        categoryId: id,
        categoryName: meta.name,
        audience: meta.audience,
        enrollments: categoryEnrollments.get(id) ?? 0,
        completions: categoryCompletions.get(id) ?? 0,
      };
    })
    .sort(
      (a, b) =>
        categoryMeta.get(a.categoryId)!.sortOrder -
        categoryMeta.get(b.categoryId)!.sortOrder,
    );

  const certificatesIssued = await CertificateModel.countDocuments({
    certificateType: "course",
    userId: { $in: roster },
    courseId: { $in: courseIds },
    isLatest: true,
    isActive: true,
  });

  const completedCount = enrollments.filter(
    (e) => (e as { status?: string }).status === "completed",
  ).length;
  const avgCompletion = enrollments.length
    ? Math.round((completedCount / enrollments.length) * 100)
    : 0;

  return {
    stats: {
      totalCourses: courseList.length,
      totalEnrollments: enrollments.length,
      distinctLearners: distinctLearners.size,
      certificatesIssued,
      avgCompletion,
    },
    categoryBreakdown,
    courses: courseList,
  };
};

export interface PartnerCoursesStudentRow {
  userId: string;
  name: string;
  email: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesIssued: number;
}

export interface PartnerCoursesStudentsResult {
  items: PartnerCoursesStudentRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated list of the partner's students with their course-enrollment
 * aggregates. Sorted by student name. Optional `q` matches name/email
 * case-insensitively.
 */
export const getPartnerCoursesStudentsService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  opts: { page: number; pageSize: number; q?: string },
): Promise<PartnerCoursesStudentsResult> => {
  const page = Math.max(1, Math.floor(opts.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize)));
  const q = (opts.q ?? "").trim();

  const roster = await getPartnerScopedStudentIds(partnerCollegeId);
  if (roster.length === 0) {
    return { items: [], total: 0, page, pageSize };
  }

  const userFilter: Record<string, unknown> = { _id: { $in: roster } };
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    userFilter.$or = [
      { firstName: re },
      { lastName: re },
      { email: re },
    ];
  }

  const total = await UserModel.countDocuments(userFilter);
  if (total === 0) {
    return { items: [], total: 0, page, pageSize };
  }

  const users = await UserModel.find(userFilter)
    .select("_id firstName lastName email")
    .collation({ locale: "en", strength: 2 })
    .sort({ firstName: 1, lastName: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  const pageUserIds = users.map((u) => u._id);

  const enrollments = await EnrollmentModel.find({
    userId: { $in: pageUserIds },
    status: { $in: ["active", "completed"] },
  })
    .select("userId status")
    .lean();

  const enrolledByUser = new Map<string, number>();
  const completedByUser = new Map<string, number>();
  for (const e of enrollments) {
    const uid = String(e.userId);
    enrolledByUser.set(uid, (enrolledByUser.get(uid) ?? 0) + 1);
    if ((e as { status?: string }).status === "completed") {
      completedByUser.set(uid, (completedByUser.get(uid) ?? 0) + 1);
    }
  }

  const certs = await CertificateModel.find({
    certificateType: "course",
    userId: { $in: pageUserIds },
    isLatest: true,
    isActive: true,
  })
    .select("userId")
    .lean();
  const certsByUser = new Map<string, number>();
  for (const c of certs) {
    const uid = String((c as { userId?: unknown }).userId);
    certsByUser.set(uid, (certsByUser.get(uid) ?? 0) + 1);
  }

  const items: PartnerCoursesStudentRow[] = users.map((u) => {
    const uid = String(u._id);
    const name =
      `${(u as { firstName?: string }).firstName ?? ""} ${
        (u as { lastName?: string }).lastName ?? ""
      }`.trim() || "—";
    return {
      userId: uid,
      name,
      email: String((u as { email?: string }).email ?? ""),
      coursesEnrolled: enrolledByUser.get(uid) ?? 0,
      coursesCompleted: completedByUser.get(uid) ?? 0,
      certificatesIssued: certsByUser.get(uid) ?? 0,
    };
  });

  return { items, total, page, pageSize };
};

export type PartnerAudience = "college-students" | "professionals";

export interface PartnerEnrollmentRow {
  enrollmentId: string;
  userId: string;
  studentName: string;
  email: string;
  courseId: string;
  courseTitle: string;
  domains: string[];
  audiences: PartnerAudience[];
  status: "active" | "completed";
  /** Overall course completion, 0–100. */
  completion: number;
  certified: boolean;
  /** Direct download URL for the course certificate, when issued. */
  certificateUrl?: string;
}

export interface PartnerEnrollmentFilterOptions {
  courses: { courseId: string; title: string }[];
  domains: { categoryId: string; name: string; audience: PartnerAudience }[];
}

export interface PartnerCoursesEnrollmentsResult {
  items: PartnerEnrollmentRow[];
  total: number;
  page: number;
  pageSize: number;
  filters: PartnerEnrollmentFilterOptions;
}

/**
 * One row per (student × course) enrollment for the partner's roster, with
 * the course's domains/audiences attached. Supports search + filtering by
 * audience / domain / course. Includes the filter option lists (drawn from
 * the partner's own enrollment data so dropdowns never show empty results).
 */
export const getPartnerCoursesEnrollmentsService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  opts: {
    page: number;
    pageSize: number;
    q?: string;
    audience?: PartnerAudience;
    categoryId?: string;
    courseId?: string;
  },
): Promise<PartnerCoursesEnrollmentsResult> => {
  const page = Math.max(1, Math.floor(opts.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize)));
  const q = (opts.q ?? "").trim().toLowerCase();
  const audienceFilter = opts.audience;
  const categoryFilter = (opts.categoryId ?? "").trim();
  const courseFilter = (opts.courseId ?? "").trim();

  const emptyResult: PartnerCoursesEnrollmentsResult = {
    items: [],
    total: 0,
    page,
    pageSize,
    filters: { courses: [], domains: [] },
  };

  const roster = await getPartnerScopedStudentIds(partnerCollegeId);
  if (roster.length === 0) return emptyResult;

  const enrollments = await EnrollmentModel.find({
    userId: { $in: roster },
    status: { $in: ["active", "completed"] },
  })
    .select("_id userId courseId status progress.overallCompletion")
    .lean();
  if (enrollments.length === 0) return emptyResult;

  const userIdSet = new Set<string>();
  const courseIdSet = new Set<string>();
  for (const e of enrollments) {
    userIdSet.add(String(e.userId));
    courseIdSet.add(String(e.courseId));
  }

  const [users, courses, certs] = await Promise.all([
    UserModel.find({ _id: { $in: [...userIdSet] } })
      .select("_id firstName lastName email")
      .lean(),
    CourseModel.find({ _id: { $in: [...courseIdSet] } })
      .select("_id title category")
      .lean(),
    CertificateModel.find({
      certificateType: "course",
      userId: { $in: [...userIdSet] },
      courseId: { $in: [...courseIdSet] },
      isLatest: true,
      isActive: true,
    })
      .select("userId courseId fileUrl")
      .lean(),
  ]);

  const userById = new Map(
    users.map((u) => [
      String(u._id),
      {
        name:
          `${(u as { firstName?: string }).firstName ?? ""} ${
            (u as { lastName?: string }).lastName ?? ""
          }`.trim() || "—",
        email: String((u as { email?: string }).email ?? ""),
      },
    ]),
  );

  const courseCategoryIds = new Map<string, string[]>();
  const courseTitleById = new Map<string, string>();
  const allCategoryIds = new Set<string>();
  for (const c of courses) {
    const cid = String(c._id);
    courseTitleById.set(cid, String((c as { title?: string }).title ?? ""));
    const cats = (
      (c as unknown as { category?: mongoose.Types.ObjectId[] }).category ?? []
    ).map((x) => String(x));
    courseCategoryIds.set(cid, cats);
    cats.forEach((id) => allCategoryIds.add(id));
  }

  const categoryDocs = await CategoryModel.find({
    _id: {
      $in: [...allCategoryIds].map((id) => new mongoose.Types.ObjectId(id)),
    },
  })
    .select("_id name audience sortOrder")
    .lean();
  const categoryById = new Map<
    string,
    { name: string; audience: PartnerAudience; sortOrder: number }
  >(
    categoryDocs.map((c) => [
      String(c._id),
      {
        name: String((c as { name?: string }).name ?? "Uncategorised"),
        audience:
          ((c as { audience?: PartnerAudience }).audience ??
            "college-students"),
        sortOrder: Number((c as { sortOrder?: number }).sortOrder ?? 999),
      },
    ]),
  );

  const certUrlByPair = new Map<string, string>();
  for (const c of certs) {
    const key = `${String((c as { userId?: unknown }).userId)}:${String(
      (c as { courseId?: unknown }).courseId,
    )}`;
    const url = (c as { fileUrl?: unknown }).fileUrl;
    if (typeof url === "string" && url) certUrlByPair.set(key, url);
  }
  const certPairs = new Set(
    certs.map(
      (c) =>
        `${String((c as { userId?: unknown }).userId)}:${String(
          (c as { courseId?: unknown }).courseId,
        )}`,
    ),
  );

  const allRows: PartnerEnrollmentRow[] = enrollments.map((e) => {
    const uid = String(e.userId);
    const cid = String(e.courseId);
    const user = userById.get(uid);
    const catIds = courseCategoryIds.get(cid) ?? [];
    const domains: string[] = [];
    const audienceSet = new Set<PartnerAudience>();
    for (const id of catIds) {
      const meta = categoryById.get(id);
      if (meta) {
        domains.push(meta.name);
        audienceSet.add(meta.audience);
      }
    }
    return {
      enrollmentId: String(e._id),
      userId: uid,
      studentName: user?.name ?? "—",
      email: user?.email ?? "",
      courseId: cid,
      courseTitle: courseTitleById.get(cid) ?? "",
      domains,
      audiences: [...audienceSet],
      status:
        (e as { status?: string }).status === "completed"
          ? "completed"
          : "active",
      completion: Math.round(
        Number(
          (e as { progress?: { overallCompletion?: number } }).progress
            ?.overallCompletion ?? 0,
        ),
      ),
      certified: certPairs.has(`${uid}:${cid}`),
      certificateUrl: certUrlByPair.get(`${uid}:${cid}`),
    };
  });

  let filtered = allRows;
  if (q) {
    filtered = filtered.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q),
    );
  }
  if (audienceFilter) {
    filtered = filtered.filter((r) => r.audiences.includes(audienceFilter));
  }
  if (categoryFilter) {
    const catName = categoryById.get(categoryFilter)?.name;
    if (catName) {
      filtered = filtered.filter((r) => r.domains.includes(catName));
    } else {
      filtered = [];
    }
  }
  if (courseFilter) {
    filtered = filtered.filter((r) => r.courseId === courseFilter);
  }

  filtered.sort((a, b) => {
    const n = a.studentName.localeCompare(b.studentName);
    return n !== 0 ? n : a.courseTitle.localeCompare(b.courseTitle);
  });

  const total = filtered.length;
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  const filterCourses = [...courseIdSet]
    .map((id) => ({ courseId: id, title: courseTitleById.get(id) ?? "" }))
    .filter((c) => c.title)
    .sort((a, b) => a.title.localeCompare(b.title));

  const filterDomains = [...allCategoryIds]
    .map((id) => {
      const meta = categoryById.get(id);
      if (!meta) return null;
      return { categoryId: id, name: meta.name, audience: meta.audience };
    })
    .filter(
      (x): x is { categoryId: string; name: string; audience: PartnerAudience } =>
        x !== null,
    )
    .sort(
      (a, b) =>
        (categoryById.get(a.categoryId)?.sortOrder ?? 999) -
          (categoryById.get(b.categoryId)?.sortOrder ?? 999) ||
        a.name.localeCompare(b.name),
    );

  return {
    items,
    total,
    page,
    pageSize,
    filters: { courses: filterCourses, domains: filterDomains },
  };
};

/** Course IDs the partner's roster has active/completed enrollments in. */
const getPartnerEnrolledCourseIds = async (
  partnerCollegeId: mongoose.Types.ObjectId,
): Promise<mongoose.Types.ObjectId[]> => {
  const roster = await getPartnerScopedStudentIds(partnerCollegeId);
  if (roster.length === 0) return [];
  const ids = await EnrollmentModel.distinct("courseId", {
    userId: { $in: roster },
    status: { $in: ["active", "completed"] },
  });
  return ids.map((id) => new mongoose.Types.ObjectId(String(id)));
};

export interface PartnerFilterCoursesResult {
  items: { courseId: string; title: string }[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Paginated, searchable list of the courses the partner's roster has
 * enrollments in. Used as the option source for the Course filter combobox.
 */
export const getPartnerFilterCoursesService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  opts: { page: number; pageSize: number; q?: string },
): Promise<PartnerFilterCoursesResult> => {
  const page = Math.max(1, Math.floor(opts.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize)));
  const q = (opts.q ?? "").trim();

  const courseIds = await getPartnerEnrolledCourseIds(partnerCollegeId);
  if (courseIds.length === 0) {
    return { items: [], total: 0, page, pageSize, hasMore: false };
  }

  const filter: Record<string, unknown> = { _id: { $in: courseIds } };
  if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };

  const total = await CourseModel.countDocuments(filter);
  if (total === 0) {
    return { items: [], total: 0, page, pageSize, hasMore: false };
  }

  const docs = await CourseModel.find(filter)
    .select("_id title")
    .collation({ locale: "en", strength: 2 })
    .sort({ title: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  const items = docs.map((c) => ({
    courseId: String(c._id),
    title: String((c as { title?: string }).title ?? ""),
  }));

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
};

export interface PartnerFilterDomainsResult {
  items: { categoryId: string; name: string; audience: PartnerAudience }[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Paginated, searchable list of domains (categories) attached to the courses
 * the partner's roster has enrollments in. Used as the option source for the
 * Domain filter combobox; optional `audience` narrows the list.
 */
export const getPartnerFilterDomainsService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  opts: {
    page: number;
    pageSize: number;
    q?: string;
    audience?: PartnerAudience;
  },
): Promise<PartnerFilterDomainsResult> => {
  const page = Math.max(1, Math.floor(opts.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize)));
  const q = (opts.q ?? "").trim();
  const audience = opts.audience;

  const courseIds = await getPartnerEnrolledCourseIds(partnerCollegeId);
  if (courseIds.length === 0) {
    return { items: [], total: 0, page, pageSize, hasMore: false };
  }

  const categoryIds = await CourseModel.distinct("category", {
    _id: { $in: courseIds },
  });
  if (categoryIds.length === 0) {
    return { items: [], total: 0, page, pageSize, hasMore: false };
  }

  const filter: Record<string, unknown> = {
    _id: { $in: categoryIds.map((id) => new mongoose.Types.ObjectId(String(id))) },
    isActive: true,
  };
  if (audience) filter.audience = audience;
  if (q) filter.name = { $regex: escapeRegex(q), $options: "i" };

  const total = await CategoryModel.countDocuments(filter);
  if (total === 0) {
    return { items: [], total: 0, page, pageSize, hasMore: false };
  }

  const docs = await CategoryModel.find(filter)
    .select("_id name audience sortOrder")
    .collation({ locale: "en", strength: 2 })
    .sort({ sortOrder: 1, name: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  const items = docs.map((c) => ({
    categoryId: String(c._id),
    name: String((c as { name?: string }).name ?? "Uncategorised"),
    audience:
      ((c as { audience?: PartnerAudience }).audience ?? "college-students"),
  }));

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
};

export interface PartnerCourseStudentRow {
  userId: string;
  name: string;
  email: string;
  completion: number;
  certified: boolean;
}

export interface PartnerCourseDetailResult {
  course: {
    courseId: string;
    title: string;
    slug: string;
    thumbnail: string;
    categories: string[];
  };
  stats: {
    studentsEnrolled: number;
    certificatesIssued: number;
    averageCompletion: number;
  };
  students: PartnerCourseStudentRow[];
}

/**
 * Per-course analytics for the partner's roster: completion %, certificate
 * status, and the student name/email list. Returns `null` if the slug matches
 * no course.
 */
export const getPartnerCourseDetailService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  slug: string,
): Promise<PartnerCourseDetailResult | null> => {
  const course = await CourseModel.findOne({ slug })
    .select("_id title slug thumbnail category")
    .lean();
  if (!course) return null;

  const categoryDocs = await CategoryModel.find({
    _id: {
      $in:
        (course as unknown as { category?: mongoose.Types.ObjectId[] })
          .category ?? [],
    },
  })
    .select("name")
    .lean();
  const categoryNames = categoryDocs.map(
    (c) => String((c as { name?: string }).name ?? ""),
  );

  const courseInfo = {
    courseId: String(course._id),
    title: String((course as { title?: string }).title ?? ""),
    slug: String((course as { slug?: string }).slug ?? ""),
    thumbnail: String((course as { thumbnail?: string }).thumbnail ?? ""),
    categories: categoryNames,
  };

  const buildResult = (
    students: PartnerCourseStudentRow[],
    averageCompletion: number,
    certificatesIssued: number,
  ): PartnerCourseDetailResult => ({
    course: courseInfo,
    stats: {
      studentsEnrolled: students.length,
      certificatesIssued,
      averageCompletion,
    },
    students,
  });

  const roster = await getPartnerScopedStudentIds(partnerCollegeId);
  if (roster.length === 0) return buildResult([], 0, 0);

  const enrollments = await EnrollmentModel.find({
    courseId: course._id,
    userId: { $in: roster },
    status: { $in: ["active", "completed"] },
  })
    .select("userId progress.overallCompletion")
    .lean();
  if (enrollments.length === 0) return buildResult([], 0, 0);

  const enrolledUserIds = enrollments.map((e) => e.userId);

  const users = await UserModel.find({ _id: { $in: enrolledUserIds } })
    .select("_id firstName lastName email")
    .lean();
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const certs = await CertificateModel.find({
    certificateType: "course",
    courseId: course._id,
    userId: { $in: enrolledUserIds },
    isLatest: true,
    isActive: true,
  })
    .select("userId")
    .lean();
  const certifiedUserIds = new Set(certs.map((c) => String(c.userId)));

  let completionSum = 0;
  const students: PartnerCourseStudentRow[] = enrollments
    .map((e) => {
      const userId = String(e.userId);
      const u = userById.get(userId) as
        | { firstName?: string; lastName?: string; email?: string }
        | undefined;
      const completion = Number(
        (e as { progress?: { overallCompletion?: number } }).progress
          ?.overallCompletion ?? 0,
      );
      completionSum += completion;
      return {
        userId,
        name: u
          ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—"
          : "—",
        email: u ? String(u.email ?? "") : "",
        completion,
        certified: certifiedUserIds.has(userId),
      };
    })
    .sort((a, b) => b.completion - a.completion);

  const averageCompletion = Math.round(completionSum / enrollments.length);
  return buildResult(students, averageCompletion, certifiedUserIds.size);
};

// ── Internship analytics ────────────────────────────────────────────────────

export interface PartnerInternshipListItem {
  internshipId: string;
  title: string;
  slug: string;
  thumbnail: string;
  studentsEnrolled: number;
}

export interface PartnerInternshipsResult {
  stats: {
    totalInternships: number;
    totalEnrolled: number;
    appearedInExam: number;
    offerLettersReceived: number;
    certificatesIssued: number;
    /** % of enrollments that have reached `completed` status (0–100). */
    avgCompletion: number;
  };
  internships: PartnerInternshipListItem[];
}

const EMPTY_INTERNSHIPS_RESULT: PartnerInternshipsResult = {
  stats: {
    totalInternships: 0,
    totalEnrolled: 0,
    appearedInExam: 0,
    offerLettersReceived: 0,
    certificatesIssued: 0,
    avgCompletion: 0,
  },
  internships: [],
};

/** Internship enrollments of the partner's roster, excluding `revoked`. */
export const getPartnerInternshipsService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
): Promise<PartnerInternshipsResult> => {
  const roster = await getPartnerScopedStudentIds(partnerCollegeId);
  if (roster.length === 0) return EMPTY_INTERNSHIPS_RESULT;

  const enrollments = await InternshipEnrollmentModel.find({
    user: { $in: roster },
    status: { $ne: "revoked" },
  })
    .select("internship user examAttemptedAt offerLetterGeneratedAt status")
    .lean();
  if (enrollments.length === 0) return EMPTY_INTERNSHIPS_RESULT;

  const perInternshipLearners = new Map<string, Set<string>>();
  let appearedInExam = 0;
  let offerLettersReceived = 0;
  let completedCount = 0;
  for (const e of enrollments) {
    const internshipId = String((e as { internship?: unknown }).internship);
    if (!perInternshipLearners.has(internshipId)) {
      perInternshipLearners.set(internshipId, new Set());
    }
    perInternshipLearners
      .get(internshipId)!
      .add(String((e as { user?: unknown }).user));
    if ((e as { examAttemptedAt?: unknown }).examAttemptedAt) appearedInExam++;
    if ((e as { offerLetterGeneratedAt?: unknown }).offerLetterGeneratedAt) {
      offerLettersReceived++;
    }
    if ((e as { status?: string }).status === "completed") completedCount++;
  }
  const avgCompletion = enrollments.length
    ? Math.round((completedCount / enrollments.length) * 100)
    : 0;

  const internshipIds = [...perInternshipLearners.keys()].map(
    (id) => new mongoose.Types.ObjectId(id),
  );
  const internships = await InternshipModel.find({
    _id: { $in: internshipIds },
  })
    .select("_id title slug thumbnail")
    .lean();

  const list: PartnerInternshipListItem[] = internships
    .map((i) => ({
      internshipId: String(i._id),
      title: String((i as { title?: string }).title ?? ""),
      slug: String((i as { slug?: string }).slug ?? ""),
      thumbnail: String((i as { thumbnail?: string }).thumbnail ?? ""),
      studentsEnrolled: perInternshipLearners.get(String(i._id))?.size ?? 0,
    }))
    .sort((a, b) => b.studentsEnrolled - a.studentsEnrolled);

  const certificatesIssued = await CertificateModel.countDocuments({
    certificateType: "internship",
    userId: { $in: roster },
    isLatest: true,
    isActive: true,
  });

  return {
    stats: {
      totalInternships: list.length,
      totalEnrolled: enrollments.length,
      appearedInExam,
      offerLettersReceived,
      certificatesIssued,
      avgCompletion,
    },
    internships: list,
  };
};

export interface PartnerInternshipFunnel {
  enrolled: number;
  appearedInExam: number;
  selected: number;
  certified: number;
}

/** One enrolled student in a batch, with the funnel stages they reached. */
export interface PartnerInternshipBatchStudent {
  name: string;
  email: string;
  appearedInExam: boolean;
  selected: boolean;
  certified: boolean;
  /** Direct download URL for the offer letter, when generated. */
  offerLetterUrl?: string;
  /** Direct download URL for the internship certificate, when issued. */
  certificateUrl?: string;
}

/** Batch summary for the analytics header — counts only, no student rows.
 *  Student rows are served separately and paginated. */
export interface PartnerInternshipBatchBreakdown {
  batchId: string;
  name: string;
  counts: PartnerInternshipFunnel;
}

export interface PartnerInternshipDetailResult {
  internship: {
    internshipId: string;
    title: string;
    slug: string;
    thumbnail: string;
  };
  totals: PartnerInternshipFunnel;
  batches: PartnerInternshipBatchBreakdown[];
}

/** A flat student row tagged with the batch it belongs to. */
export interface PartnerInternshipStudentRow extends PartnerInternshipBatchStudent {
  batchId: string;
  batchName: string;
}

const UNBATCHED_BATCH_ID = "__unbatched__";

const zeroFunnel = (): PartnerInternshipFunnel => ({
  enrolled: 0,
  appearedInExam: 0,
  selected: 0,
  certified: 0,
});

interface PartnerInternshipFlat {
  internship: PartnerInternshipDetailResult["internship"];
  students: PartnerInternshipStudentRow[];
}

/**
 * Loads every (non-revoked) internship enrollment for the partner's roster and
 * flattens it into per-student rows carrying funnel flags, batch info, and the
 * offer-letter / certificate download URLs. Shared by the detail (counts) and
 * students (paginated list) services. Returns `null` if the slug matches no
 * internship.
 */
const buildPartnerInternshipFlatStudents = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  slug: string,
): Promise<PartnerInternshipFlat | null> => {
  const internship = await InternshipModel.findOne({ slug })
    .select("_id title slug thumbnail")
    .lean();
  if (!internship) return null;

  const internshipInfo = {
    internshipId: String(internship._id),
    title: String((internship as { title?: string }).title ?? ""),
    slug: String((internship as { slug?: string }).slug ?? ""),
    thumbnail: String((internship as { thumbnail?: string }).thumbnail ?? ""),
  };

  const roster = await getPartnerScopedStudentIds(partnerCollegeId);
  if (roster.length === 0) {
    return { internship: internshipInfo, students: [] };
  }

  const enrollments = await InternshipEnrollmentModel.find({
    internship: internship._id,
    user: { $in: roster },
    status: { $ne: "revoked" },
  })
    .select(
      "_id user examAttemptedAt offerLetterGeneratedAt offerLetterUrl batchSnapshot",
    )
    .lean();
  if (enrollments.length === 0) {
    return { internship: internshipInfo, students: [] };
  }

  const userIds = enrollments.map((e) => (e as { user: unknown }).user);
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select("_id firstName lastName email")
    .lean();
  const studentById = new Map<string, { name: string; email: string }>(
    users.map((u) => [
      String(u._id),
      {
        name:
          `${(u as { firstName?: string }).firstName ?? ""} ${
            (u as { lastName?: string }).lastName ?? ""
          }`.trim() || "—",
        email: String((u as { email?: string }).email ?? ""),
      },
    ]),
  );

  const certs = await CertificateModel.find({
    enrollmentModel: "InternshipEnrollment",
    enrollmentId: { $in: enrollments.map((e) => e._id) },
    isLatest: true,
    isActive: true,
  })
    .select("enrollmentId fileUrl")
    .lean();
  const certUrlByEnrollmentId = new Map<string, string>();
  for (const c of certs) {
    const eid = String((c as { enrollmentId?: unknown }).enrollmentId);
    const url = (c as { fileUrl?: unknown }).fileUrl;
    if (typeof url === "string" && url) certUrlByEnrollmentId.set(eid, url);
  }
  const certifiedEnrollmentIds = new Set(
    certs.map((c) => String((c as { enrollmentId?: unknown }).enrollmentId)),
  );

  const students: PartnerInternshipStudentRow[] = enrollments.map((e) => {
    const snap = (e as {
      batchSnapshot?: { batchId?: string; name?: string };
    }).batchSnapshot;
    const batchId = snap?.batchId ? String(snap.batchId) : UNBATCHED_BATCH_ID;
    const batchName = snap?.name ? String(snap.name) : "Unassigned batch";
    const student = studentById.get(String((e as { user: unknown }).user)) ?? {
      name: "—",
      email: "",
    };
    const appearedInExam = Boolean(
      (e as { examAttemptedAt?: unknown }).examAttemptedAt,
    );
    const selected = Boolean(
      (e as { offerLetterGeneratedAt?: unknown }).offerLetterGeneratedAt,
    );
    const certified = certifiedEnrollmentIds.has(String(e._id));
    const offerLetterUrl = (e as { offerLetterUrl?: unknown }).offerLetterUrl;
    return {
      batchId,
      batchName,
      name: student.name,
      email: student.email,
      appearedInExam,
      selected,
      certified,
      offerLetterUrl:
        typeof offerLetterUrl === "string" && offerLetterUrl
          ? offerLetterUrl
          : undefined,
      certificateUrl: certUrlByEnrollmentId.get(String(e._id)),
    };
  });

  return { internship: internshipInfo, students };
};

/**
 * Per-internship funnel (enrolled → appeared in exam → selected → certified)
 * for the partner's roster: totals across all batches plus a per-batch count
 * breakdown for the chips/filters. Student rows are paginated separately via
 * `getPartnerInternshipStudentsService`. Returns `null` for an unknown slug.
 */
export const getPartnerInternshipDetailService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  slug: string,
): Promise<PartnerInternshipDetailResult | null> => {
  const flat = await buildPartnerInternshipFlatStudents(partnerCollegeId, slug);
  if (!flat) return null;

  const totals = zeroFunnel();
  const batchMap = new Map<string, PartnerInternshipBatchBreakdown>();
  const ensureBatch = (batchId: string, name: string) => {
    let batch = batchMap.get(batchId);
    if (!batch) {
      batch = { batchId, name, counts: zeroFunnel() };
      batchMap.set(batchId, batch);
    }
    return batch;
  };

  for (const s of flat.students) {
    const batch = ensureBatch(s.batchId, s.batchName);
    batch.counts.enrolled++;
    totals.enrolled++;
    if (s.appearedInExam) {
      batch.counts.appearedInExam++;
      totals.appearedInExam++;
    }
    if (s.selected) {
      batch.counts.selected++;
      totals.selected++;
    }
    if (s.certified) {
      batch.counts.certified++;
      totals.certified++;
    }
  }

  const batches = [...batchMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  return { internship: flat.internship, totals, batches };
};

export type PartnerInternshipStudentStatusFilter =
  | "all"
  | "enrolled"
  | "exam"
  | "selected"
  | "certified";

export interface PartnerInternshipStudentsResult {
  items: PartnerInternshipStudentRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated, filterable student list for a single internship's partner-roster
 * enrollments. Filters by batch (subset of batch ids; omit for all), funnel
 * status, and a name/email search. Returns `null` for an unknown slug.
 */
export const getPartnerInternshipStudentsService = async (
  partnerCollegeId: mongoose.Types.ObjectId,
  slug: string,
  opts: {
    page: number;
    pageSize: number;
    q?: string;
    status?: PartnerInternshipStudentStatusFilter;
    batchIds?: string[];
  },
): Promise<PartnerInternshipStudentsResult | null> => {
  const flat = await buildPartnerInternshipFlatStudents(partnerCollegeId, slug);
  if (!flat) return null;

  const page = Math.max(1, Math.floor(opts.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize) || 10));
  const status = opts.status ?? "all";
  const q = (opts.q ?? "").trim().toLowerCase();
  const batchIdSet =
    opts.batchIds && opts.batchIds.length ? new Set(opts.batchIds) : null;

  let rows = flat.students;
  if (batchIdSet) rows = rows.filter((s) => batchIdSet.has(s.batchId));
  if (status === "exam") {
    rows = rows.filter((s) => s.appearedInExam);
  } else if (status === "selected") {
    rows = rows.filter((s) => s.selected);
  } else if (status === "certified") {
    rows = rows.filter((s) => s.certified);
  } else if (status === "enrolled") {
    rows = rows.filter(
      (s) => !s.appearedInExam && !s.selected && !s.certified,
    );
  }
  if (q) {
    rows = rows.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }

  // Stable order so page boundaries don't shift between requests.
  const sorted = [...rows].sort(
    (a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email),
  );

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);
  return { items, total, page, pageSize };
};
