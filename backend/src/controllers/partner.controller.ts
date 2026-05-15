import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  getPartnerCollegeContext,
  getPartnerDashboardStatsService,
  getPartnerDashboardTrendsService,
  getPartnerCoursesService,
  getPartnerCourseDetailService,
  getPartnerInternshipsService,
  getPartnerInternshipDetailService,
} from "../services/partner.services";

const parsePartnerTrendMonths = (raw: unknown): number => {
  const n = parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return 6;
  return Math.min(24, Math.max(3, n));
};

/** `YYYY-MM-DD` → UTC start/end of calendar day interval (Mongo matches BSON dates accordingly). */
const parseUtcDayRangeFromQuery = (
  fromRaw: unknown,
  toRaw: unknown,
): { startUtc: Date; endUtc: Date } | null => {
  const fs = typeof fromRaw === "string" ? fromRaw.trim() : "";
  const ts = typeof toRaw === "string" ? toRaw.trim() : "";
  if (!fs || !ts) return null;
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(fs) || !re.test(ts)) {
    throw new AppError("from and to must be YYYY-MM-DD", 400);
  }
  const startUtc = new Date(`${fs}T00:00:00.000Z`);
  const endUtc = new Date(`${ts}T23:59:59.999Z`);
  if (startUtc > endUtc) {
    throw new AppError("`from` must be on or before `to`", 400);
  }
  const maxMs = 1000 * 60 * 60 * 24 * 366 * 3;
  if (endUtc.getTime() - startUtc.getTime() > maxMs) {
    throw new AppError("Date range cannot exceed ~3 years", 400);
  }
  return { startUtc, endUtc };
};

/**
 * Pulls the partnerCollege ObjectId off the authenticated partner. Throws if
 * the user isn't a partner — the partner routes already chain
 * `verifyPartner`, so this is a defensive belt-and-braces check.
 */
const requirePartnerCollegeId = (req: Request): mongoose.Types.ObjectId => {
  const user = req.user as unknown as
    | { userType?: string; partnerCollege?: mongoose.Types.ObjectId | string }
    | undefined;
  if (!user || user.userType !== "partner" || !user.partnerCollege) {
    throw new AppError("Partner account context required", 403);
  }
  return new mongoose.Types.ObjectId(String(user.partnerCollege));
};

/**
 * Throws 403 unless the authenticated partner has the given analytics gate
 * enabled. Treats a missing flag as enabled (legacy docs / lean reads).
 */
const requirePartnerAnalyticsAccess = (
  req: Request,
  kind: "course" | "internship",
): void => {
  const user = req.user as unknown as
    | {
        courseAnalyticsEnabled?: boolean;
        internshipAnalyticsEnabled?: boolean;
      }
    | undefined;
  const enabled =
    kind === "course"
      ? user?.courseAnalyticsEnabled !== false
      : user?.internshipAnalyticsEnabled !== false;
  if (!enabled) {
    throw new AppError(
      `${
        kind === "course" ? "Course" : "Internship"
      } analytics is not enabled for your account.`,
      403,
    );
  }
};

export const getPartnerMe = asyncHandler(
  async (req: Request, res: Response) => {
    const collegeId = requirePartnerCollegeId(req);
    const college = await getPartnerCollegeContext(collegeId);
    if (!college) {
      throw new AppError(
        "Linked college not found. Contact admin to re-link your account.",
        404,
      );
    }
    const user = req.user as unknown as {
      courseAnalyticsEnabled?: boolean;
      internshipAnalyticsEnabled?: boolean;
    };
    sendSuccessResponse(
      res,
      {
        college,
        access: {
          courseAnalytics: user?.courseAnalyticsEnabled !== false,
          internshipAnalytics: user?.internshipAnalyticsEnabled !== false,
        },
      },
      "Partner context fetched",
    );
  },
);

export const getPartnerDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const collegeId = requirePartnerCollegeId(req);
    const trendMonths = parsePartnerTrendMonths(req.query.months);
    const dateRangeUtc = parseUtcDayRangeFromQuery(
      req.query.from,
      req.query.to,
    );
    const [college, stats, trends] = await Promise.all([
      getPartnerCollegeContext(collegeId),
      getPartnerDashboardStatsService(collegeId, dateRangeUtc),
      getPartnerDashboardTrendsService(
        collegeId,
        trendMonths,
        dateRangeUtc,
      ),
    ]);
    if (!college) {
      throw new AppError(
        "Linked college not found. Contact admin to re-link your account.",
        404,
      );
    }
    sendSuccessResponse(
      res,
      { college, stats, trends },
      "Dashboard fetched",
    );
  },
);

export const getPartnerCourses = asyncHandler(
  async (req: Request, res: Response) => {
    requirePartnerAnalyticsAccess(req, "course");
    const collegeId = requirePartnerCollegeId(req);
    const result = await getPartnerCoursesService(collegeId);
    sendSuccessResponse(res, result, "Partner courses fetched");
  },
);

export const getPartnerCourseDetail = asyncHandler(
  async (req: Request, res: Response) => {
    requirePartnerAnalyticsAccess(req, "course");
    const collegeId = requirePartnerCollegeId(req);
    const slug = String(req.params.slug ?? "").trim();
    if (!slug) throw new AppError("Course slug is required", 400);
    const result = await getPartnerCourseDetailService(collegeId, slug);
    if (!result) throw new AppError("Course not found", 404);
    sendSuccessResponse(res, result, "Partner course analytics fetched");
  },
);

export const getPartnerInternships = asyncHandler(
  async (req: Request, res: Response) => {
    requirePartnerAnalyticsAccess(req, "internship");
    const collegeId = requirePartnerCollegeId(req);
    const result = await getPartnerInternshipsService(collegeId);
    sendSuccessResponse(res, result, "Partner internships fetched");
  },
);

export const getPartnerInternshipDetail = asyncHandler(
  async (req: Request, res: Response) => {
    requirePartnerAnalyticsAccess(req, "internship");
    const collegeId = requirePartnerCollegeId(req);
    const slug = String(req.params.slug ?? "").trim();
    if (!slug) throw new AppError("Internship slug is required", 400);
    const result = await getPartnerInternshipDetailService(collegeId, slug);
    if (!result) throw new AppError("Internship not found", 404);
    sendSuccessResponse(res, result, "Partner internship analytics fetched");
  },
);
