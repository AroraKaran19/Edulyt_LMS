import { UserModel, CourseModel } from "../models";
import { AppError } from "../middlewares/error.middleware";

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
