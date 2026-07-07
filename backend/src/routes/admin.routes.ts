import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin, requirePermission } from "../middlewares/admin.middleware";
import {
  getDashboardStatsController,
  getCourseAnalyticsController,
  getEnrollmentsOverTimeController,
  getAdminOrdersController,
  getAdminEnrollmentsController,
  revokeEnrollmentController,
  getUserDetailsForAdminController,
  getTimeSpentPerDayController,
} from "../controllers/admin.controller";
import {
  getPointsSettingsController,
  patchPointsSettingsController,
} from "../controllers/pointsSettings.controller";
import {
  getHomePageSettingsController,
  patchHomePageSettingsController,
} from "../controllers/homePageSettings.controller";
import {
  getLegalSettingsController,
  patchLegalSettingsController,
} from "../controllers/legalSettings.controller";
import {
  getAllCertificateJobs,
  retryCertificateJob,
  getCertificatesByUserId,
} from "../controllers/certificate.controller";
import {
  getAllCollaborationJobs,
  retryCollaborationJob,
} from "../controllers/collaborationJob.controller";
import {
  getAllOfferLetterJobs,
  retryOfferLetterJob,
} from "../controllers/offerLetterJob.controller";
import { getTotalSpendByUserId } from "../controllers/order.controller";

const router = Router();

// Apply middleware to all routes
router.use(verifyUser);
router.use(verifyAdmin);

// Admin dashboard route
router.get("/dashboard-stats", requirePermission("dashboard"), getDashboardStatsController);

// Admin orders (enrollments)
router.get("/orders", requirePermission("orders"), getAdminOrdersController);

// Admin enrollments (paid, gift, trial) with type filter
router.get("/enrollments", requirePermission("courses.enrollments"), getAdminEnrollmentsController);
router.post("/enrollments/revoke", requirePermission("courses.enrollments"), revokeEnrollmentController);

// Course analytics routes (more specific first)
router.get("/courses-analytics/enrollments-over-time", requirePermission("courses.analytics"), getEnrollmentsOverTimeController);
router.get("/courses-analytics", requirePermission("courses.analytics"), getCourseAnalyticsController);

// Certificate jobs (admin settings)
router.get("/certificate-jobs", requirePermission("settings.certificate-jobs"), getAllCertificateJobs);
router.post("/certificate-jobs/:jobId/retry", requirePermission("settings.certificate-jobs"), retryCertificateJob);

// Offer letter jobs (admin settings)
router.get("/offer-letter-jobs", requirePermission("settings.offer-letter-jobs"), getAllOfferLetterJobs);
router.post("/offer-letter-jobs/:jobId/retry", requirePermission("settings.offer-letter-jobs"), retryOfferLetterJob);

// Collaboration allotment jobs (admin settings)
router.get("/collaboration-jobs", requirePermission("settings.collaboration-jobs"), getAllCollaborationJobs);
router.post("/collaboration-jobs/:jobId/retry", requirePermission("settings.collaboration-jobs"), retryCollaborationJob);

// User details (aggregated: user, enrollments, certificates, totalSpend)
router.get("/users/:userId/details", requirePermission("users.manage"), getUserDetailsForAdminController);

// User certificates (admin view)
router.get("/users/:userId/certificates", requirePermission("users.manage"), getCertificatesByUserId);

// User total spend (paid purchases only, excludes gift/trial)
router.get("/users/:userId/total-spend", requirePermission("users.manage"), getTotalSpendByUserId);

// User time spent per day (learning activity)
router.get("/users/:userId/time-spent", requirePermission("users.manage"), getTimeSpentPerDayController);

// Success points / internship success points — INR conversion (admin)
router.get("/points-settings", requirePermission("settings.points"), getPointsSettingsController);
router.patch("/points-settings", requirePermission("settings.points"), patchPointsSettingsController);

// Marketing home page CMS singleton (admin editor under /admin/settings/home-page)
router.get("/home-page-settings", requirePermission("settings.home-page"), getHomePageSettingsController);
router.patch("/home-page-settings", requirePermission("settings.home-page"), patchHomePageSettingsController);

// Legal documents singleton (course + internship T&C) — admin editor under
// /admin/settings/terms-and-conditions
router.get("/legal-settings", requirePermission("settings.terms-and-conditions"), getLegalSettingsController);
router.patch("/legal-settings", requirePermission("settings.terms-and-conditions"), patchLegalSettingsController);

export default router;
