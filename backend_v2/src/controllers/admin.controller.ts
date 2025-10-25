import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { Request, Response } from "express";
import { getDashboardStats } from "../services/admin.services";

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Get comprehensive dashboard statistics (admin only)
 * @access  Admin
 * @query   duration - Duration in months (e.g., 1, 3, 6, 12)
 * @returns {
 *   totalUsers: number,
 *   activeUsers: number,
 *   inactiveUsers: number,
 *   blockedUsers: number,
 *   usersByType: { [userType: string]: number },
 *   chartData: Array<{ year: number, Active: number, Inactive: number }>, // Filtered by duration
 *   timePeriod: {
 *     duration: number,
 *     startDate: Date,
 *     endDate: Date,
 *     newUsers: number,
 *     newUsersByType: { [userType: string]: number },
 *     growthRate: number,
 *     monthlyBreakdown: Array<{ _id: { year: number, month: number }, count: number }>
 *   }
 * }
 * 
 * @example
 * GET /api/admin/dashboard-stats?duration=12
 * Returns statistics for the last 12 months
 */
export const getDashboardStatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { duration = 12 } = req.query;
    const durationMonths = parseInt(duration as string);

    if (isNaN(durationMonths) || durationMonths <= 0) {
      throw new AppError(
        "Invalid duration. Must be a positive number of months",
        400
      );
    }

    const dashboardStats = await getDashboardStats(durationMonths);

    sendSuccessResponse(
      res,
      dashboardStats,
      "Dashboard statistics retrieved successfully"
    );
  }
);
