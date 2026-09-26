import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { Request, Response } from "express";
import {
  getDashboardStats,
  getUserDetailsForAdmin,
} from "../services/admin.services";
import {
  getCourseAnalytics,
  getEnrollmentsPerDayService,
  getFirstEnrollmentDateService,
} from "../services/course-analytics.services";
import { getAdminOrdersService } from "../services/order.services";
import { isBrand } from "../constants/brands";
import {
  getAdminEnrollmentsService,
  EnrollmentTypeFilter,
  ADMIN_ENROLLMENT_STATUSES,
  type AdminEnrollmentStatus,
} from "../services/admin-enrollments.services";
import { revokeEnrollmentAdminService } from "../services/enrollment.services";
import { getTimeSpentPerDayService } from "../services/enrollment.services";
import {
  CSV_EXPORT_MAX_ROWS,
  csvRangeFilename,
  isFullExport,
  sendCsvResponse,
  wantsCsv,
  type CsvColumn,
} from "../utils/lib/csv";
import { parseDateRange, rangeEcho } from "../utils/lib/dateRange";

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

/**
 * @route   GET /api/admin/users/:userId/details
 * @desc    Get aggregated user details for admin modal (user, enrollments, certificates, totalSpend)
 * @access  Admin
 */
export const getUserDetailsForAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }
    const details = await getUserDetailsForAdmin(userId);
    sendSuccessResponse(
      res,
      details,
      "User details retrieved successfully",
      200
    );
  }
);

/**
 * @route   GET /api/admin/users/:userId/time-spent
 * @desc    Get time spent per day for a user (from completedContents)
 * @access  Admin
 * @query   from - Start date ISO string (YYYY-MM-DD)
 * @query   to - End date ISO string (YYYY-MM-DD)
 */
export const getTimeSpentPerDayController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { from, to } = req.query;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }
    if (!from || !to || typeof from !== "string" || typeof to !== "string") {
      throw new AppError("from and to date parameters are required", 400);
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new AppError("Invalid date format for from or to", 400);
    }
    if (fromDate > toDate) {
      throw new AppError("from date must be before or equal to to date", 400);
    }

    // Set to end of day for toDate
    toDate.setHours(23, 59, 59, 999);
    fromDate.setHours(0, 0, 0, 0);

    const data = await getTimeSpentPerDayService(userId, fromDate, toDate);
    sendSuccessResponse(res, data, "Time spent per day retrieved", 200);
  }
);

/**
 * One CSV line per order. Discounts are broken out individually because
 * `amount` is already net of all of them, so a finance export needs both sides
 * to reconcile against an invoice.
 */
const ORDER_CSV_COLUMNS: CsvColumn<Record<string, any>>[] = [
  { header: "Order ID", pick: (o) => String(o._id ?? "") },
  { header: "Txn ID", pick: (o) => o.txnId },
  { header: "Date", pick: (o) => o.createdAt },
  {
    header: "User",
    pick: (o) =>
      [o.userId?.firstName, o.userId?.lastName].filter(Boolean).join(" ") ||
      o.userName ||
      "",
  },
  { header: "Email", pick: (o) => o.userId?.email ?? "" },
  { header: "Order Type", pick: (o) => o.orderKind ?? "course" },
  {
    header: "Product",
    pick: (o) =>
      o.courseId?.title || o.courseName || o.internshipTitle || "",
  },
  { header: "Plan", pick: (o) => o.planType ?? "" },
  { header: "Batch ID", pick: (o) => o.batchId ?? "" },
  {
    header: "Success Points Qty",
    pick: (o) => o.internshipSuccessPointsQuantity ?? "",
  },
  { header: "Amount Paid", pick: (o) => o.amount ?? 0 },
  { header: "Currency", pick: (o) => o.currency ?? "INR" },
  { header: "Payment Status", pick: (o) => o.paymentStatus },
  { header: "Payment Mode", pick: (o) => o.paymentMode ?? "" },
  { header: "Payment Method", pick: (o) => o.paymentMethod ?? "" },
  { header: "Failure Reason", pick: (o) => o.paymentErrorReason ?? "" },
  { header: "Coupon Code", pick: (o) => o.couponCode ?? "" },
  { header: "Coupon Discount", pick: (o) => o.couponDiscount ?? 0 },
  {
    header: "Collaboration Discount",
    pick: (o) => o.collaborationDiscount ?? 0,
  },
  { header: "Referral Code", pick: (o) => o.referralCode ?? "" },
  { header: "Referral Discount", pick: (o) => o.referralDiscount ?? 0 },
  { header: "Success Points Applied", pick: (o) => o.successPointsApplied ?? 0 },
  {
    header: "Success Points Discount",
    pick: (o) => o.successPointsDiscount ?? 0,
  },
];

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders (enrollments) for admin
 * @access  Admin
 * @query   page, limit, search, paymentStatus, from, to, format=csv
 */
export const getAdminOrdersController = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, paymentStatus } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const range = parseDateRange(req.query.from, req.query.to);
    const exportAll = isFullExport(req.query);

    const result = await getAdminOrdersService({
      page: Number(page),
      limit: Number(limit),
      search: typeof search === "string" ? search : undefined,
      paymentStatus:
        typeof paymentStatus === "string" ? paymentStatus : undefined,
      brand: isBrand(req.query.brand) ? req.query.brand : undefined,
      from: range.from,
      to: range.to,
      exportAll,
      maxRows: CSV_EXPORT_MAX_ROWS,
    });

    if (wantsCsv(req.query)) {
      sendCsvResponse(
        res,
        result.orders,
        ORDER_CSV_COLUMNS,
        csvRangeFilename("orders", rangeEcho(range)),
      );
      return;
    }

    sendSuccessResponse(res, result, "Orders fetched successfully", 200);
  }
);

/**
 * @route   GET /api/admin/enrollments
 * @desc    Get all enrollments (paid, gift, trial) for admin with type filter
 * @access  Admin
 * @query   page, limit, search, enrollmentType, paymentStatus, enrollmentStatus,
 *          statuses (comma-separated), enrolledFrom, enrolledTo
 */
export const getAdminEnrollmentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      enrollmentType = "paid",
      paymentStatus,
      enrollmentStatus,
      statuses: statusesQ,
      enrolledFrom,
      enrolledTo,
    } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const validTypes: EnrollmentTypeFilter[] = ["all", "paid", "gift", "trial"];
    const type =
      validTypes.includes(enrollmentType as EnrollmentTypeFilter) ?
        (enrollmentType as EnrollmentTypeFilter)
      : "paid";

    const validEnrollmentStatus = ["all", "active", "revoked"];
    const statusFilter =
      validEnrollmentStatus.includes(enrollmentStatus as string) ?
        (enrollmentStatus as "all" | "active" | "revoked")
      : undefined;

    const statuses =
      typeof statusesQ === "string" ?
        statusesQ
          .split(",")
          .map((s) => s.trim())
          .filter((s): s is AdminEnrollmentStatus =>
            (ADMIN_ENROLLMENT_STATUSES as readonly string[]).includes(s)
          )
      : [];
    const range = parseDateRange(enrolledFrom, enrolledTo);

    const result = await getAdminEnrollmentsService(
      Number(page),
      Number(limit),
      type,
      typeof search === "string" ? search : undefined,
      typeof paymentStatus === "string" ? paymentStatus : undefined,
      statusFilter,
      isBrand(req.query.brand) ? req.query.brand : undefined,
      { statuses, enrolledFrom: range.from, enrolledTo: range.to }
    );

    sendSuccessResponse(res, result, "Enrollments fetched successfully", 200);
  }
);

/**
 * @route   POST /api/admin/enrollments/revoke
 * @desc    Force revoke an enrollment (admin only). Accepts enrollmentId or orderId.
 * @access  Admin
 * @body    { enrollmentId?: string, orderId?: string }
 */
export const revokeEnrollmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId, orderId } = req.body ?? {};

    const enrollmentIdVal =
      typeof enrollmentId === "string" && enrollmentId.trim()
        ? enrollmentId.trim()
        : undefined;
    const orderIdVal =
      typeof orderId === "string" && orderId.trim() ? orderId.trim() : undefined;

    const result = await revokeEnrollmentAdminService(
      enrollmentIdVal,
      orderIdVal
    );

    sendSuccessResponse(
      res,
      result,
      "Enrollment revoked successfully",
      200
    );
  }
);

// Enrollments are bucketed per IST day, so the query window has to be anchored
// to IST midnight too. Anchoring to server-local midnight instead would clip
// the first ~5.5 hours of the opening day and bleed into the next one.
const IST_OFFSET = "+05:30";

const toIstDateStr = (d: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

const startOfIstDay = (dateStr: string): Date =>
  new Date(`${dateStr}T00:00:00.000${IST_OFFSET}`);

const endOfIstDay = (dateStr: string): Date =>
  new Date(`${dateStr}T23:59:59.999${IST_OFFSET}`);

/**
 * @route   GET /api/admin/courses-analytics/enrollments-over-time
 * @desc    Get enrollments per day for courses analytics
 * @access  Admin
 * @query   from - Start date (YYYY-MM-DD). Omit for "All Time": the range then
 *                 starts on the day the first enrollment was created.
 * @query   to - End date (YYYY-MM-DD)
 * @query   courseId - Optional; restrict to a specific course
 */
export const getEnrollmentsOverTimeController = asyncHandler(
  async (req: Request, res: Response) => {
    const { from, to, courseId } = req.query;

    if (!to || typeof to !== "string") {
      throw new AppError("to date parameter is required", 400);
    }

    const parsedTo = new Date(to);
    if (isNaN(parsedTo.getTime())) {
      throw new AppError("Invalid date format for to", 400);
    }

    const validCourseId =
      typeof courseId === "string" && courseId.trim() ? courseId.trim() : undefined;

    let fromStr: string;
    if (typeof from === "string" && from.trim()) {
      const parsedFrom = new Date(from);
      if (isNaN(parsedFrom.getTime())) {
        throw new AppError("Invalid date format for from", 400);
      }
      fromStr = toIstDateStr(parsedFrom);
    } else {
      // "All Time": resolve the start server-side from the earliest enrollment
      // (of this course, when one is selected).
      const firstEnrolledAt = await getFirstEnrollmentDateService(validCourseId);
      if (!firstEnrolledAt) {
        return sendSuccessResponse(
          res,
          { from: null, to: toIstDateStr(parsedTo), data: [] },
          "Enrollments over time retrieved",
          200
        );
      }
      fromStr = toIstDateStr(firstEnrolledAt);
    }

    const toStr = toIstDateStr(parsedTo);
    if (fromStr > toStr) {
      throw new AppError("from date must be before or equal to to date", 400);
    }

    const data = await getEnrollmentsPerDayService(
      startOfIstDay(fromStr),
      endOfIstDay(toStr),
      validCourseId
    );

    sendSuccessResponse(
      res,
      { from: fromStr, to: toStr, data },
      "Enrollments over time retrieved",
      200
    );
  }
);
