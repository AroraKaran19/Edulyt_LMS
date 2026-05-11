import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
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
router.get("/dashboard-stats", getDashboardStatsController);

// Admin orders (enrollments)
router.get("/orders", getAdminOrdersController);

// Admin enrollments (paid, gift, trial) with type filter
router.get("/enrollments", getAdminEnrollmentsController);
router.post("/enrollments/revoke", revokeEnrollmentController);

// Course analytics routes (more specific first)
router.get("/courses-analytics/enrollments-over-time", getEnrollmentsOverTimeController);
router.get("/courses-analytics", getCourseAnalyticsController);

// Certificate jobs (admin settings)
router.get("/certificate-jobs", getAllCertificateJobs);
router.post("/certificate-jobs/:jobId/retry", retryCertificateJob);

// Offer letter jobs (admin settings)
router.get("/offer-letter-jobs", getAllOfferLetterJobs);
router.post("/offer-letter-jobs/:jobId/retry", retryOfferLetterJob);

// Collaboration allotment jobs (admin settings)
router.get("/collaboration-jobs", getAllCollaborationJobs);
router.post("/collaboration-jobs/:jobId/retry", retryCollaborationJob);

// User details (aggregated: user, enrollments, certificates, totalSpend)
router.get("/users/:userId/details", getUserDetailsForAdminController);

// User certificates (admin view)
router.get("/users/:userId/certificates", getCertificatesByUserId);

// User total spend (paid purchases only, excludes gift/trial)
router.get("/users/:userId/total-spend", getTotalSpendByUserId);

// User time spent per day (learning activity)
router.get("/users/:userId/time-spent", getTimeSpentPerDayController);

// Success points / internship success points — INR conversion (admin)
router.get("/points-settings", getPointsSettingsController);
router.patch("/points-settings", patchPointsSettingsController);

// Marketing home page CMS singleton (admin editor under /admin/settings/home-page)
router.get("/home-page-settings", getHomePageSettingsController);
router.patch("/home-page-settings", patchHomePageSettingsController);

export default router;
