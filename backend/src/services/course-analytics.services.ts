import { CourseModel, EnrollmentModel, OrderModel } from "../models";
import mongoose from "mongoose";

export type CourseAnalyticsSortBy = "enrollments" | "revenue" | "rating";
export type EnrollmentStatusFilter = "all" | "in_progress" | "completed";

export interface CourseAnalyticsResponse {
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  totalAuthors: number;
  completionRate: number;
  completedCount: number;
  notCompletedCount: number;
  averageCompletionTimeMinutes: number;
  growthRateVsPreviousPeriod: number;
  popularCourses: Array<{
    _id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    enrollments: number;
    revenue: number;
    averageRating: number;
    totalReviews: number;
  }>;
}

export const getCourseAnalytics = async (
  sortBy: CourseAnalyticsSortBy = "enrollments",
  search?: string,
  enrollmentFilter: EnrollmentStatusFilter = "all",
  courseId?: string,
): Promise<CourseAnalyticsResponse> => {
  // When courseId or search is provided, restrict metrics to matching courses (courseId takes precedence)
  let courseIdFilter: { courseId?: { $in: mongoose.Types.ObjectId[] } } = {};
  if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
    courseIdFilter = {
      courseId: { $in: [new mongoose.Types.ObjectId(courseId)] },
    };
  } else if (search && search.trim()) {
    const matchingCourses = await CourseModel.find(
      { title: { $regex: search.trim(), $options: "i" } },
      { _id: 1 },
    ).lean();
    const courseIds: mongoose.Types.ObjectId[] = matchingCourses.map(
      (c) => new mongoose.Types.ObjectId(String(c._id)),
    );
    if (courseIds.length > 0) {
      courseIdFilter = { courseId: { $in: courseIds } };
    } else {
      courseIdFilter = { courseId: { $in: [] } };
    }
  }

  const enrollmentMatchFilter =
    enrollmentFilter === "completed"
      ? {
          ...courseIdFilter,
          $or: [{ status: "completed" }, { "progress.overallCompletion": 100 }],
        }
      : enrollmentFilter === "in_progress"
        ? {
            ...courseIdFilter,
            status: { $ne: "completed" },
            "progress.overallCompletion": { $lt: 100 },
          }
        : { ...courseIdFilter };

  // Total courses (all, by courseId, or matching search)
  const totalCoursesFilter = courseId && mongoose.Types.ObjectId.isValid(courseId)
    ? { _id: new mongoose.Types.ObjectId(courseId) }
    : search?.trim()
      ? { title: { $regex: search.trim(), $options: "i" } }
      : {};
  const totalCourses = await CourseModel.countDocuments(totalCoursesFilter);

  // Total enrollments (filtered by status and by course search)
  const totalEnrollments = await EnrollmentModel.countDocuments(
    enrollmentMatchFilter,
  );

  // Total revenue from successful orders (scoped by course search when applicable)
  const orderMatch: Record<string, unknown> = { paymentStatus: "success" };
  if (courseIdFilter.courseId) {
    orderMatch.courseId = { $in: courseIdFilter.courseId.$in };
  }
  const revenueResult = await OrderModel.aggregate([
    { $match: orderMatch },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const totalRevenue = revenueResult[0]?.total ?? 0;

  // Unique instructors (authors) - from all courses or matching courses when search is used
  const instructorsResult = await CourseModel.aggregate([
    { $match: totalCoursesFilter },
    { $unwind: "$instructor" },
    { $group: { _id: "$instructor" } },
    { $count: "count" },
  ]);
  const totalAuthors = instructorsResult[0]?.count ?? 0;

  // Completion stats: within filtered set, count how many are completed
  const completedCount =
    enrollmentFilter === "in_progress"
      ? 0
      : enrollmentFilter === "completed"
        ? totalEnrollments
        : await EnrollmentModel.countDocuments({
            ...courseIdFilter,
            $or: [
              { status: "completed" },
              { "progress.overallCompletion": 100 },
            ],
          });
  const notCompletedCount = Math.max(0, totalEnrollments - completedCount);
  const completionRate =
    totalEnrollments > 0
      ? Math.round((completedCount / totalEnrollments) * 100)
      : 0;

  // Average completion time (only from completed enrollments; N/A for in_progress)
  const avgTimeMatch =
    enrollmentFilter === "in_progress"
      ? { status: "___none___" }
      : {
          ...courseIdFilter,
          $or: [{ status: "completed" }, { "progress.overallCompletion": 100 }],
          totalTimeSpent: { $gt: 0 },
        };
  const avgTimeResult = await EnrollmentModel.aggregate([
    { $match: avgTimeMatch },
    { $group: { _id: null, avgSeconds: { $avg: "$totalTimeSpent" } } },
  ]);
  // totalTimeSpent is stored in seconds in the enrollment model; convert to minutes for display
  const averageCompletionTimeMinutes =
    Math.round((avgTimeResult[0]?.avgSeconds ?? 0) / 60) || 0;

  // Growth rate: compare last 30 days enrollments vs previous 30 days (within filter)
  const now = new Date();
  const last30Start = new Date(now);
  last30Start.setDate(last30Start.getDate() - 30);
  const prev30Start = new Date(last30Start);
  prev30Start.setDate(prev30Start.getDate() - 30);

  const last30Match = {
    ...enrollmentMatchFilter,
    enrolledAt: { $gte: last30Start, $lte: now },
  };
  const prev30Match = {
    ...enrollmentMatchFilter,
    enrolledAt: { $gte: prev30Start, $lt: last30Start },
  };
  const [last30Enrollments, prev30Enrollments] = await Promise.all([
    EnrollmentModel.countDocuments(last30Match),
    EnrollmentModel.countDocuments(prev30Match),
  ]);

  let growthRateVsPreviousPeriod = 0;
  if (prev30Enrollments > 0) {
    growthRateVsPreviousPeriod =
      ((last30Enrollments - prev30Enrollments) / prev30Enrollments) * 100;
  } else if (last30Enrollments > 0) {
    growthRateVsPreviousPeriod = 100;
  }

  // Popular courses - filter by courseId, search, or all
  const popularCoursesFilter = courseId && mongoose.Types.ObjectId.isValid(courseId)
    ? { _id: new mongoose.Types.ObjectId(courseId) }
    : search?.trim()
      ? { title: { $regex: search.trim(), $options: "i" } }
      : {};

  const sortByField: Record<string, 1 | -1> =
    sortBy === "revenue"
      ? { revenue: -1 }
      : sortBy === "rating"
        ? { averageRating: -1, totalReviews: -1 }
        : { enrollments: -1 };

  const popularCoursesRaw = await CourseModel.aggregate([
    { $match: popularCoursesFilter },
    {
      $lookup: {
        from: "orders",
        let: { courseId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$courseId", "$$courseId"] },
              paymentStatus: "success",
            },
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$amount" },
            },
          },
        ],
        as: "orderStats",
      },
    },
    {
      $addFields: {
        revenue: { $ifNull: [{ $arrayElemAt: ["$orderStats.revenue", 0] }, 0] },
        enrollments: { $ifNull: ["$analytics.totalEnrollments", 0] },
        averageRating: { $ifNull: ["$analytics.averageRating", 0] },
        totalReviews: { $ifNull: ["$analytics.totalReviews", 0] },
      },
    },
    { $sort: sortByField },
    { $limit: 5 },
    {
      $project: {
        title: 1,
        slug: 1,
        thumbnail: 1,
        enrollments: 1,
        revenue: 1,
        averageRating: 1,
        totalReviews: 1,
      },
    },
  ]);

  const popularCourses = popularCoursesRaw.map((c) => ({
    _id: c._id.toString(),
    title: c.title,
    slug: c.slug,
    thumbnail: c.thumbnail,
    enrollments: c.enrollments ?? 0,
    revenue: c.revenue ?? 0,
    averageRating: c.averageRating ?? 0,
    totalReviews: c.totalReviews ?? 0,
  }));

  return {
    totalCourses,
    totalEnrollments,
    totalRevenue,
    totalAuthors,
    completionRate,
    completedCount,
    notCompletedCount,
    averageCompletionTimeMinutes,
    growthRateVsPreviousPeriod: parseFloat(
      growthRateVsPreviousPeriod.toFixed(2),
    ),
    popularCourses,
  };
};

/**
 * Get enrollments per day for courses analytics (admin only).
 * @param fromDate - Start date (inclusive)
 * @param toDate - End date (inclusive)
 * @param courseId - Optional; restrict to a specific course
 * @returns Array of { date: string (YYYY-MM-DD), count: number }
 */
export const getEnrollmentsPerDayService = async (
  fromDate: Date,
  toDate: Date,
  courseId?: string
): Promise<{ date: string; count: number }[]> => {
  const match: Record<string, unknown> = {
    enrolledAt: { $gte: fromDate, $lte: toDate },
  };
  if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
    match.courseId = new mongoose.Types.ObjectId(courseId);
  }

  const result = await EnrollmentModel.aggregate([
    { $match: match },
    {
      $addFields: {
        dateStr: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$enrolledAt",
            timezone: "Asia/Kolkata",
          },
        },
      },
    },
    { $group: { _id: "$dateStr", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } },
  ]);

  return result as { date: string; count: number }[];
};
