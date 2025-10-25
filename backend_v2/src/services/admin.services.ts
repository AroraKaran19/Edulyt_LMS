import { UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";

export const getDashboardStats = async (durationMonths: number) => {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - durationMonths);

  // Get total users and status breakdown
  const totalUsers = await UserModel.countDocuments();
  const activeUsers = await UserModel.countDocuments({ status: "active" });
  const inactiveUsers = await UserModel.countDocuments({ status: "inactive" });
  const blockedUsers = await UserModel.countDocuments({ status: "blocked" });

  // Get users by type (instructors and students)
  const usersByType = await UserModel.aggregate([
    {
      $group: {
        _id: "$userType",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get new users in the time period
  const newUsersInDuration = await UserModel.countDocuments({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  // Get new users by type in the time period
  const newUsersByType = await UserModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
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

  // Get monthly breakdown for the duration
  const monthlyBreakdown = await UserModel.aggregate([
    {
      $match: {
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

  // Get yearly active/inactive breakdown for chart data (filtered by duration)
  const yearlyStatusBreakdown = await UserModel.aggregate([
    {
      $match: {
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
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1 },
    },
  ]);

  // Format chart data for active/inactive users by year
  const chartDataMap = new Map();
  yearlyStatusBreakdown.forEach((item) => {
    const year = item._id.year;
    const status = item._id.status;
    const count = item.count;

    if (!chartDataMap.has(year)) {
      chartDataMap.set(year, { year, Active: 0, Inactive: 0 });
    }

    const yearData = chartDataMap.get(year);
    if (status === "active") {
      yearData.Active = count;
    } else if (status === "inactive") {
      yearData.Inactive = count;
    }
  });

  // Convert map to array and sort by year
  const chartData = Array.from(chartDataMap.values()).sort(
    (a, b) => a.year - b.year
  );

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
  };

  return response;
};
