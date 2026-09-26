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
  getAdminEnquiryPageSettingsController,
  getEnquiryScholarshipOptionsController,
  patchEnquiryPageSettingsController,
} from "../controllers/enquiryPageSettings.controller";
import {
  getAdminCaPageSettingsController,
  patchCaPageSettingsController,
} from "../controllers/caPageSettings.controller";
import {
  getAdminLegalSettingsController,
  patchLegalSettingsController,
} from "../controllers/legalSettings.controller";
import {
  getAllCertificateJobs,
  retryCertificateJob,
  reclaimStuckCertificateJobs,
  getCertificatesByUserId,
} from "../controllers/certificate.controller";
import {
  getAllCollaborationJobs,
  retryCollaborationJob,
} from "../controllers/collaborationJob.controller";
import {
  getAllInvoiceJobs,
  retryInvoiceJob,
  reclaimStuckInvoiceJobs,
} from "../controllers/invoiceJob.controller";
import {
  getAllOfferLetterJobs,
  retryOfferLetterJob,
} from "../controllers/offerLetterJob.controller";
import { getTotalSpendByUserId } from "../controllers/order.controller";
import {
  activateCaMeetingLinkAdminController,
  createCaMeetingAdminController,
  deleteCaMeetingAdminController,
  getCaMeetingAdminController,
  getCaMeetingAttendanceAdminController,
  listCaMeetingsAdminController,
  setCaMeetingOverrideAdminController,
  updateCaMeetingAdminController,
} from "../controllers/caMeeting.controller";
import {
  createCaTaskAdminController,
  deleteCaTaskAdminController,
  getCaTaskAdminController,
  listCaTasksAdminController,
  updateCaTaskAdminController,
} from "../controllers/caTask.controller";
import {
  approveCaVoucherRequestController,
  declineCaVoucherRequestController,
  deleteCaVoucherRequestController,
  listCaVoucherEnrollmentsController,
  listCaVoucherRequestsController,
  revokeCaVoucherEnrollmentController,
} from "../controllers/caVoucherAdmin.controller";
import {
  createLeadImportJobController,
  downloadLeadImportTemplateController,
  getLeadImportJobController,
  listLeadImportJobsController,
  previewLeadImportController,
} from "../controllers/leadImport.controller";

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
// Manual only: the certificate worker never sweeps stuck `processing` rows itself.
router.post("/certificate-jobs/reclaim-stuck", requirePermission("settings.certificate-jobs"), reclaimStuckCertificateJobs);

// Invoice jobs (admin settings)
router.get("/invoice-jobs", requirePermission("settings.invoice-jobs"), getAllInvoiceJobs);
router.post("/invoice-jobs/:jobId/retry", requirePermission("settings.invoice-jobs"), retryInvoiceJob);
// Manual only: the invoice worker never sweeps stuck `processing` rows itself.
router.post("/invoice-jobs/reclaim-stuck", requirePermission("settings.invoice-jobs"), reclaimStuckInvoiceJobs);

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

router.get("/enquiry-page-settings", requirePermission("leads.enquiry-page"), getAdminEnquiryPageSettingsController);
// Hard-scoped to the caller's own campaigns inside, so this permission never
// becomes a back door onto the campaign list it does not otherwise grant.
router.get("/enquiry-page-settings/scholarship-options", requirePermission("leads.enquiry-page"), getEnquiryScholarshipOptionsController);
router.patch("/enquiry-page-settings", requirePermission("leads.enquiry-page"), patchEnquiryPageSettingsController);

router.get("/ca-page-settings", requirePermission("leads.ca-page"), getAdminCaPageSettingsController);
router.patch("/ca-page-settings", requirePermission("leads.ca-page"), patchCaPageSettingsController);

// Excel lead import: the browser parses, the server previews, the CA worker inserts.
router.get(
  "/leads/import/template",
  requirePermission("leads.import"),
  downloadLeadImportTemplateController,
);
router.post("/leads/import/preview", requirePermission("leads.import"), previewLeadImportController);
router.post("/leads/import/jobs", requirePermission("leads.import"), createLeadImportJobController);
router.get("/leads/import/jobs", requirePermission("leads.import"), listLeadImportJobsController);
router.get("/leads/import/jobs/:id", requirePermission("leads.import"), getLeadImportJobController);

// Legal documents per brand (course and internship T&C), edited under
// /admin/settings/terms-and-conditions
router.get("/legal-settings", requirePermission("settings.terms-and-conditions"), getAdminLegalSettingsController);
router.patch("/legal-settings", requirePermission("settings.terms-and-conditions"), patchLegalSettingsController);

router.post("/ca-meetings", requirePermission("crm.ca-meetings"), createCaMeetingAdminController);
router.get("/ca-meetings", requirePermission("crm.ca-meetings"), listCaMeetingsAdminController);
router.get("/ca-meetings/:id", requirePermission("crm.ca-meetings"), getCaMeetingAdminController);
router.patch("/ca-meetings/:id", requirePermission("crm.ca-meetings"), updateCaMeetingAdminController);
router.post("/ca-meetings/:id/activate/:slot", requirePermission("crm.ca-meetings"), activateCaMeetingLinkAdminController);
router.delete("/ca-meetings/:id", requirePermission("crm.ca-meetings"), deleteCaMeetingAdminController);
router.get("/ca-meetings/:id/attendance", requirePermission("crm.ca-meetings"), getCaMeetingAttendanceAdminController);
router.post(
  "/ca-meetings/:id/attendance/override",
  requirePermission("crm.ca-meetings"),
  setCaMeetingOverrideAdminController,
);

router.get("/ca-tasks", requirePermission("crm.ca-tasks"), listCaTasksAdminController);
router.post("/ca-tasks", requirePermission("crm.ca-tasks"), createCaTaskAdminController);
router.get("/ca-tasks/:id", requirePermission("crm.ca-tasks"), getCaTaskAdminController);
router.patch("/ca-tasks/:id", requirePermission("crm.ca-tasks"), updateCaTaskAdminController);
router.delete("/ca-tasks/:id", requirePermission("crm.ca-tasks"), deleteCaTaskAdminController);

router.get("/ca-vouchers/requests", requirePermission("ca.vouchers"), listCaVoucherRequestsController);
router.post(
  "/ca-vouchers/requests/:id/approve",
  requirePermission("ca.vouchers"),
  approveCaVoucherRequestController,
);
router.post(
  "/ca-vouchers/requests/:id/decline",
  requirePermission("ca.vouchers"),
  declineCaVoucherRequestController,
);
router.delete(
  "/ca-vouchers/requests/:id",
  requirePermission("ca.vouchers"),
  deleteCaVoucherRequestController,
);
router.get("/ca-vouchers/enrollments", requirePermission("ca.vouchers"), listCaVoucherEnrollmentsController);
router.post(
  "/ca-vouchers/enrollments/:id/revoke",
  requirePermission("ca.vouchers"),
  revokeCaVoucherEnrollmentController,
);

export default router;
