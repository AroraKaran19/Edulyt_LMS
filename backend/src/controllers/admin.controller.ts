import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { Request, Response } from "express";
import { getDashboardStats } from "../services/admin.services";
import { getCourseAnalytics } from "../services/course-analytics.services";

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

    const userType = (req.user as { userType?: string })?.userType;
    const dashboardStats = await getDashboardStats(durationMonths, userType);

    sendSuccessResponse(
      res,
      dashboardStats,
      "Dashboard statistics retrieved successfully"
    );
  }
);

/**
 * @route   GET /api/admin/courses-analytics
 * @desc    Get course analytics for admin (completion rate, enrollments, popular courses, etc.)
 * @access  Admin
 * @query   sortBy - "enrollments" | "revenue" | "rating"
 * @query   search - optional search for popular courses
 */
export const getCourseAnalyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { sortBy = "enrollments", search, filter, courseId } = req.query;
    const validSort =
      sortBy === "revenue" || sortBy === "rating" ? sortBy : "enrollments";
    const searchStr = typeof search === "string" ? search.trim() || undefined : undefined;
    const validFilter =
      filter === "in_progress" || filter === "completed"
        ? filter
        : "all";
    const validCourseId =
      typeof courseId === "string" && courseId.trim()
        ? courseId.trim()
        : undefined;

    const analytics = await getCourseAnalytics(
      validSort,
      searchStr,
      validFilter,
      validCourseId
    );

    sendSuccessResponse(
      res,
      analytics,
      "Course analytics retrieved successfully"
    );
  }
);
