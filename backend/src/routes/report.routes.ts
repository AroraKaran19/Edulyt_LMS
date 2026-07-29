import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin, requirePermission } from "../middlewares/admin.middleware";
import {
  getInternshipSuccessPointsReportController,
  getPlatformSuccessPointsReportController,
  getReferralReportController,
} from "../controllers/report.controller";

const router = Router();

// Admin-only module: every route below is gated by the catalog page key.
router.use(verifyUser, verifyAdmin);

/**
 * Shared query params on all three:
 *   from, to   — YYYY-MM-DD (inclusive; `to` snaps to end-of-day UTC)
 *   q          — free text over name / email
 *   page, limit
 *   format=csv — respond with a CSV attachment covering the whole window
 *                instead of a single page
 */

/** GET /api/reports/success-points/platform — student wallet earned vs spent. */
router.get(
  "/success-points/platform",
  requirePermission("reports.success-points"),
  getPlatformSuccessPointsReportController,
);

/** GET /api/reports/success-points/internship — internship points earned. */
router.get(
  "/success-points/internship",
  requirePermission("reports.success-points"),
  getInternshipSuccessPointsReportController,
);

/** GET /api/reports/referrals — per-referrer referrals, earned, paid. */
router.get(
  "/referrals",
  requirePermission("reports.referrals"),
  getReferralReportController,
);

export default router;
