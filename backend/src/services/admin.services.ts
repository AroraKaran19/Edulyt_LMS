import mongoose from "mongoose";
import { UserModel, CourseModel, EnrollmentModel, OrderModel, CertificateModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { getUserByIdService } from "./user.services";
import { GetUserEnrollmentsService } from "./enrollment.services";
import { getUserCertificatesService } from "./certificate.services";
import { getTotalSpendByUserIdService } from "./order.services";
import { listMyInternshipEnrollments } from "./internshipEnrollment.services";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { CaApplicationModel } from "../models/caApplication.schema";
import { parseIstDateOnly, todayIst, ymdIst } from "../utils/ist";
import type { AmbassadorKind } from "../types/crm";

// User types to include in analytics (exclude admin, super-admin)
const ANALYTICS_USER_TYPES = ["student", "instructor", "collaborator"];

export const getDashboardStats = async (
  durationMonths: number,
  userType?: string
) => {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - durationMonths);

  const userTypeFilter = { userType: { $in: ANALYTICS_USER_TYPES } };

  // Get total users and status breakdown (exclude admin/super-admin)
  const totalUsers = await UserModel.countDocuments(userTypeFilter);
  const activeUsers = await UserModel.countDocuments({
    ...userTypeFilter,
    status: "active",
  });
  const inactiveUsers = await UserModel.countDocuments({
    ...userTypeFilter,
    status: "inactive",
  });
  const blockedUsers = await UserModel.countDocuments({
    ...userTypeFilter,
    status: "blocked",
  });

  // Get users by type (instructors and students - only analytics types)
  const usersByType = await UserModel.aggregate([
    { $match: userTypeFilter },
    {
      $group: {
        _id: "$userType",
        count: { $sum: 1 },
      },
    },
  ]);

  const createdAtFilter = {
    createdAt: { $gte: startDate, $lte: endDate },
  };

  // Get new users in the time period (exclude admin/super-admin)
  const newUsersInDuration = await UserModel.countDocuments({
    ...userTypeFilter,
    ...createdAtFilter,
  });

  // Get new users by type in the time period
  const newUsersByType = await UserModel.aggregate([
    {
      $match: {
        ...userTypeFilter,
        ...createdAtFilter,
      },
    },
    {
      $group: {
        _id: "$userType",
        count: { $sum: 1 },
      },
    },
  ]);

  // Calculate growth rate - compare with previous period of same duration
  const previousStartDate = new Date(startDate);
  previousStartDate.setMonth(previousStartDate.getMonth() - durationMonths);

  const previousPeriodUsers = await UserModel.countDocuments({
    ...userTypeFilter,
    createdAt: {
      $gte: previousStartDate,
      $lt: startDate,
    },
  });

  // Calculate growth rate
  let growthRate = 0;
  if (previousPeriodUsers > 0) {
    // If previous period had users, calculate percentage growth
    growthRate =
      ((newUsersInDuration - previousPeriodUsers) / previousPeriodUsers) * 100;
  } else if (newUsersInDuration > 0) {
    // If previous period had 0 users but current period has users, it's 100% growth
    growthRate = 100;
  }
  // If both periods have 0 users, growth rate remains 0

  // Get monthly breakdown for the duration (exclude admin/super-admin)
  const monthlyBreakdown = await UserModel.aggregate([
    {
      $match: {
        ...userTypeFilter,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
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
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Get monthly active/inactive breakdown for chart data (filtered by duration)
  const monthlyStatusBreakdown = await UserModel.aggregate([
    {
      $match: {
        ...userTypeFilter,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  const MONTH_LABELS = [
    "", "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];

  // Format chart data for active/inactive users by month
  const chartDataMap = new Map<string, { month: string; year: number; monthNum: number; Active: number; Inactive: number }>();
  monthlyStatusBreakdown.forEach((item) => {
    const year = item._id.year;
    const monthNum = item._id.month;
    const status = item._id.status;
    const count = item.count;
    const key = `${year}-${monthNum}`;

    if (!chartDataMap.has(key)) {
      chartDataMap.set(key, {
        month: MONTH_LABELS[monthNum],
        year,
        monthNum,
        Active: 0,
        Inactive: 0,
      });
    }

    const monthData = chartDataMap.get(key)!;
    if (status === "active") {
      monthData.Active = count;
    } else if (status === "inactive") {
      monthData.Inactive = count;
    }
  });

  // Convert map to array and sort by year, month
  const chartData = Array.from(chartDataMap.values()).sort(
    (a, b) => a.year - b.year || a.monthNum - b.monthNum
  );

  // Today's enrollments — the IST calendar day expressed as a UTC [start, end)
  // range so both counts hit the `enrolledAt` index (course + internship)
  // instead of scanning the whole collection. The previous $expr/$dateToString
  // comparison against $$NOW could not use any index. IST is a fixed UTC+5:30
  // offset (no DST), derived from the app-server clock.
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  const istMidnightLabelledUtc = Date.UTC(
    nowIst.getUTCFullYear(),
    nowIst.getUTCMonth(),
    nowIst.getUTCDate(),
  );
  const todayStart = new Date(istMidnightLabelledUtc - IST_OFFSET_MS);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const enrolledTodayFilter = {
    enrolledAt: { $gte: todayStart, $lt: todayEnd },
  };
  const [todayEnrollmentsCourse, todayEnrollmentsInternship] = await Promise.all(
    [
      EnrollmentModel.countDocuments(enrolledTodayFilter),
      InternshipEnrollmentModel.countDocuments(enrolledTodayFilter),
    ],
  );
  const todayEnrollments = todayEnrollmentsCourse + todayEnrollmentsInternship;

  // Enrollments per month (for distinct chart - shows course engagement)
  const enrolledAtFilter = {
    enrolledAt: { $gte: startDate, $lte: endDate },
  };
  const enrollmentsMonthlyBreakdown = await EnrollmentModel.aggregate([
    { $match: enrolledAtFilter },
    {
      $group: {
        _id: {
          year: { $year: "$enrolledAt" },
          month: { $month: "$enrolledAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Business & engagement stats (revenue, certificates, enrollments).
  // Total enrollments are scoped to the selected duration window via the
  // indexed `enrolledAt` range (course `{ enrolledAt: -1 }` + sparse internship
  // `{ enrolledAt: 1 }`). Internship docs with no `enrolledAt` (pre-selection
  // pipeline states) are naturally excluded by the range.
  const enrolledInPeriodFilter = {
    enrolledAt: { $gte: startDate, $lte: endDate },
  };
  const [
    revenueResult,
    totalCertificates,
    completedEnrollments,
    totalEnrollmentsCourse,
    totalEnrollmentsInternship,
    successfulOrdersCount,
  ] = await Promise.all([
    OrderModel.aggregate<{ total: number }>([
      { $match: { paymentStatus: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    CertificateModel.countDocuments(),
    EnrollmentModel.countDocuments({ status: "completed" }),
    EnrollmentModel.countDocuments(enrolledInPeriodFilter),
    InternshipEnrollmentModel.countDocuments(enrolledInPeriodFilter),
    OrderModel.countDocuments({ paymentStatus: "success" }),
  ]);

  const totalEnrollments = totalEnrollmentsCourse + totalEnrollmentsInternship;
  const totalRevenue = revenueResult[0]?.total ?? 0;

  // Platform-wide stats (super-admin only)
  let platformStats: {
    totalCourses: number;
    adminCount: number;
    superAdminCount: number;
  } | undefined;

  if (userType === "super-admin") {
    const [totalCourses, adminCount, superAdminCount] = await Promise.all([
      CourseModel.countDocuments({}),
      UserModel.countDocuments({ userType: "admin" }),
      UserModel.countDocuments({ userType: "super-admin" }),
    ]);
    platformStats = { totalCourses, adminCount, superAdminCount };
  }

  // Format the response
  const response = {
    // Total user statistics
    totalUsers,
    activeUsers,
    inactiveUsers,
    blockedUsers,

    // User type breakdown (all time)
    usersByType: usersByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>),

    // Chart data for active/inactive users by year (filtered by duration)
    chartData,

    // Today's enrollments (combined + course/internship breakdown)
    todayEnrollments,
    todayEnrollmentsCourse,
    todayEnrollmentsInternship,

    // Enrollments per month (for chart - course engagement)
    enrollmentsMonthlyBreakdown,

    // Business & engagement stats
    totalRevenue,
    totalCertificates,
    completedEnrollments,
    totalEnrollments,
    totalEnrollmentsCourse,
    totalEnrollmentsInternship,
    successfulOrdersCount,

    // Time period specific data
    timePeriod: {
      duration: durationMonths,
      startDate,
      endDate,
      newUsers: newUsersInDuration,
      newUsersByType: newUsersByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      growthRate: parseFloat(growthRate.toFixed(2)),
      monthlyBreakdown,
    },

    // Platform stats (super-admin only)
    ...(platformStats && { platformStats }),
  };

  return response;
};

/**
 * Get aggregated user details for admin modal (user, enrollments, certificates, totalSpend).
 * Single API call instead of 4 separate calls.
 */
export interface CampusAmbassadorSummary {
  kind: AmbassadorKind | null;
  ownerName: string;
  internId: string | null;
  joiningDate: string | null;
  endDate: string | null;
  active: boolean;
}

const getCampusAmbassadorSummary = async (
  userId: string,
): Promise<CampusAmbassadorSummary | null> => {
  const doc = await CaApplicationModel.findOne(
    { userId, status: { $in: ["approved", "attached"] } },
    { kind: 1, ownerName: 1, internId: 1, joiningDate: 1, endDate: 1, status: 1 },
  )
    .sort({ createdAt: -1 })
    .lean();
  if (!doc) return null;

  const startOfTodayIst = parseIstDateOnly(todayIst()) as Date;
  const active =
    doc.status === "attached" &&
    (doc.endDate == null || new Date(doc.endDate).getTime() >= startOfTodayIst.getTime());

  return {
    kind: doc.kind ?? null,
    ownerName: doc.ownerName ?? "",
    internId: doc.internId ?? null,
    joiningDate: ymdIst(doc.joiningDate),
    endDate: ymdIst(doc.endDate),
    active,
  };
};

export const getUserDetailsForAdmin = async (userId: string) => {
  const [user, enrollmentsResult, certificates, totalSpend, internshipResult, campusAmbassador] =
    await Promise.all([
      getUserByIdService(userId),
      GetUserEnrollmentsService(userId, undefined, 1, 1000),
      getUserCertificatesService(userId, { page: 1, limit: 100 }).then((r) =>
        Array.isArray(r) ? r : r.certificates
      ),
      getTotalSpendByUserIdService(userId),
      listMyInternshipEnrollments(
        new mongoose.Types.ObjectId(userId),
        1,
        50,
      ).catch(() => null),
      getCampusAmbassadorSummary(userId).catch(() => null),
    ]);

  const enrollments = enrollmentsResult?.enrollments ?? [];
  const completedEnrollments = enrollments.filter(
    (e: { status?: string }) => e.status === "completed"
  );
  let averageTimeToCompleteSeconds: number | null = null;
  if (completedEnrollments.length > 0) {
    const totalSeconds = completedEnrollments.reduce(
      (sum: number, e: { totalTimeSpent?: number }) =>
        sum + (e.totalTimeSpent ?? 0),
      0
    );
    averageTimeToCompleteSeconds = Math.round(
      totalSeconds / completedEnrollments.length
    );
  }

  return {
    user,
    enrollments,
    certificates: certificates ?? [],
    totalSpend: totalSpend ?? 0,
    averageTimeToCompleteSeconds,
    internshipEnrollments: internshipResult?.enrollments ?? [],
    campusAmbassador,
  };
};
