import mongoose from "mongoose";
import { UserModel, CourseModel, EnrollmentModel, OrderModel, CertificateModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { getUserByIdService } from "./user.services";
import { GetUserEnrollmentsService } from "./enrollment.services";
import { getUserCertificatesService } from "./certificate.services";
import { getTotalSpendByUserIdService } from "./order.services";
import { listMyInternshipEnrollments } from "./internshipEnrollment.services";

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

  // Today's enrollments: IST calendar day via MongoDB ($$NOW + Asia/Kolkata), no JS/UTC drift
  const todayEnrollmentsAgg = await EnrollmentModel.aggregate<{ count: number }>([
    {
      $match: {
        $expr: {
          $eq: [
            {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$enrolledAt",
                timezone: "Asia/Kolkata",
              },
            },
            {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$$NOW",
                timezone: "Asia/Kolkata",
              },
            },
          ],
        },
      },
    },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);
  const todayEnrollments = todayEnrollmentsAgg[0]?.count ?? 0;

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

  // Business & engagement stats (revenue, certificates, enrollments)
  const [revenueResult, totalCertificates, completedEnrollments, totalEnrollments, successfulOrdersCount] =
    await Promise.all([
      OrderModel.aggregate<{ total: number }>([
        { $match: { paymentStatus: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CertificateModel.countDocuments(),
      EnrollmentModel.countDocuments({ status: "completed" }),
      EnrollmentModel.countDocuments(),
      OrderModel.countDocuments({ paymentStatus: "success" }),
    ]);

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

    // Today's enrollments
    todayEnrollments,

    // Enrollments per month (for chart - course engagement)
    enrollmentsMonthlyBreakdown,

    // Business & engagement stats
    totalRevenue,
    totalCertificates,
    completedEnrollments,
    totalEnrollments,
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
export const getUserDetailsForAdmin = async (userId: string) => {
  const [user, enrollmentsResult, certificates, totalSpend, internshipResult] =
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
  };
};
