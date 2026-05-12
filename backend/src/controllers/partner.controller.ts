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
  listPartnerStudentsService,
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
    sendSuccessResponse(res, { college }, "Partner context fetched");
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

export const listPartnerStudents = asyncHandler(
  async (req: Request, res: Response) => {
    const collegeId = requirePartnerCollegeId(req);
    const page = parseInt(String(req.query.page ?? "1"), 10) || 1;
    const limit = parseInt(String(req.query.limit ?? "20"), 10) || 20;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const result = await listPartnerStudentsService(collegeId, {
      page,
      limit,
      search,
    });
    sendSuccessResponse(res, result, "Students fetched");
  },
);
