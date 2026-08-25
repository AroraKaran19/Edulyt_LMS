import { Router } from "express";
import { verifyUser, denyPartners } from "../middlewares/user.middleware";
import {
  verifyAdmin,
  requirePermission,
  requireAnyPermission,
} from "../middlewares/admin.middleware";
import {
  registerForExamController,
  switchInternshipBatchController,
  listMyInternshipEnrollmentsController,
  withdrawPaymentPendingEnrollmentController,
  getLearnerEntranceExamController,
  getLearnerProgramBySlugController,
  getLearnerProgramLiveMeetingsController,
  listInternshipEnrollmentsAdminController,
  getInternshipEnrollmentByIdAdminController,
  adminUpdateEnrollmentStatusController,
  adminChangeEnrollmentBatchController,
  adminUpdateEnrollmentDurationController,
  adminSetCertificateOverrideController,
  deleteInternshipEnrollmentAdminController,
  listEntranceExamCohortsController,
  listCertificationExamCohortsController,
  adminBulkApproveToEnrolledController,
  submitInternshipDocumentationController,
  adminUpdateInternshipDocumentationController,
  adminVerifyInternshipDocumentationController,
  getInternshipVerificationController,
  listInternshipsWithPendingDocReviewController,
  adminBulkApproveInternshipDocumentationController,
} from "../controllers/internshipEnrollment.controller";

const router = Router();

/**
 * Public — verify an issued offer letter by intern ID (scanned from the QR on
 * the letter). MUST be declared before the `verifyUser` middleware below so it
 * stays unauthenticated.
 */
router.get("/verify/:internId", getInternshipVerificationController);

router.use(verifyUser);

/** POST /api/internship-enrollments — learner registers for entrance exam */
router.post("/", denyPartners, registerForExamController);

/** GET /api/internship-enrollments/me — learner's enrollments (dashboard) */
router.get("/me", listMyInternshipEnrollmentsController);

/** POST /api/internship-enrollments/me/:enrollmentId/switch-batch — learner moves a pre-exam registration to another cohort */
router.post(
  "/me/:enrollmentId/switch-batch",
  denyPartners,
  switchInternshipBatchController,
);

/** DELETE /api/internship-enrollments/me/:enrollmentId — drop unpaid paid-path registration */
router.delete("/me/:enrollmentId", withdrawPaymentPendingEnrollmentController);

/** GET /api/internship-enrollments/me/entrance-exam?enrollmentId= — learner fetches exam */
router.get("/me/entrance-exam", getLearnerEntranceExamController);

/** POST /api/internship-enrollments/me/:enrollmentId/documentation — learner submits Aadhar + photo */
router.post(
  "/me/:enrollmentId/documentation",
  denyPartners,
  submitInternshipDocumentationController,
);

/** GET /api/internship-enrollments/me/program/:slug — learner program detail + tasks */
router.get("/me/program/:slug", getLearnerProgramBySlugController);

/** GET /api/internship-enrollments/me/program/:slug/live-meetings — paginated history */
router.get(
  "/me/program/:slug/live-meetings",
  getLearnerProgramLiveMeetingsController,
);

/** GET /api/internship-enrollments/admin/entrance-exam-cohorts (before :enrollmentId) */
router.get(
  "/admin/entrance-exam-cohorts",
  verifyAdmin,
  requirePermission("internships.entrance-exams"),
  listEntranceExamCohortsController,
);

/** GET /api/internship-enrollments/admin/certification-exam-cohorts */
router.get(
  "/admin/certification-exam-cohorts",
  verifyAdmin,
  requirePermission("internships.certification-exams"),
  listCertificationExamCohortsController,
);

/** GET /api/internship-enrollments/admin */
router.get(
  "/admin",
  verifyAdmin,
  // The doc-review queue and both exam cohort views are the same list under a
  // different filter, so each of those pages reads it.
  requireAnyPermission(
    "internships.enrollments",
    "internships.doc-review",
    "internships.entrance-exams",
    "internships.certification-exams",
  ),
  listInternshipEnrollmentsAdminController,
);

/** POST /api/internship-enrollments/admin/approve-to-enrolled (before :enrollmentId) */
router.post(
  "/admin/approve-to-enrolled",
  verifyAdmin,
  requireAnyPermission("internships.enrollments", "internships.entrance-exams"),
  adminBulkApproveToEnrolledController,
);

/**
 * GET /api/internship-enrollments/admin/documentation/pending-internships
 * — drives the internship filter on the doc-review queue.
 * Declared before the `/admin/:enrollmentId` catch-all so `documentation`
 * isn't captured as an enrollmentId.
 */
router.get(
  "/admin/documentation/pending-internships",
  verifyAdmin,
  requirePermission("internships.doc-review"),
  listInternshipsWithPendingDocReviewController,
);

/**
 * POST /api/internship-enrollments/admin/documentation/bulk-approve
 * Body: { enrollmentIds: string[] } — bulk-approve docs_under_review rows.
 */
router.post(
  "/admin/documentation/bulk-approve",
  verifyAdmin,
  requirePermission("internships.doc-review"),
  adminBulkApproveInternshipDocumentationController,
);

/** DELETE /api/internship-enrollments/admin/:enrollmentId */
router.delete(
  "/admin/:enrollmentId",
  verifyAdmin,
  requireAnyPermission("internships.enrollments", "internships.entrance-exams"),
  deleteInternshipEnrollmentAdminController,
);

/** GET /api/internship-enrollments/admin/:enrollmentId */
router.get(
  "/admin/:enrollmentId",
  verifyAdmin,
  // The shared submission modal reads the enrolment behind a submission, and
  // it opens from the certification-exam cohort and the task queue too.
  requireAnyPermission(
    "internships.enrollments",
    "internships.certification-exams",
    "internships.tasks",
  ),
  getInternshipEnrollmentByIdAdminController,
);

/** PATCH /api/internship-enrollments/admin/:enrollmentId/status */
router.patch(
  "/admin/:enrollmentId/status",
  verifyAdmin,
  requireAnyPermission("internships.enrollments", "internships.entrance-exams"),
  adminUpdateEnrollmentStatusController,
);

/** PATCH /api/internship-enrollments/admin/:enrollmentId/batch */
router.patch(
  "/admin/:enrollmentId/batch",
  verifyAdmin,
  requirePermission("internships.enrollments"),
  adminChangeEnrollmentBatchController,
);

/** PATCH /api/internship-enrollments/admin/:enrollmentId/duration */
router.patch(
  "/admin/:enrollmentId/duration",
  verifyAdmin,
  requirePermission("internships.enrollments"),
  adminUpdateEnrollmentDurationController,
);

/** PATCH /api/internship-enrollments/admin/:enrollmentId/certificate-override */
router.patch(
  "/admin/:enrollmentId/certificate-override",
  verifyAdmin,
  requireAnyPermission(
    "internships.enrollments",
    "internships.certification-exams",
    "internships.tasks",
  ),
  adminSetCertificateOverrideController,
);

/** PATCH /api/internship-enrollments/admin/:enrollmentId/documentation */
router.patch(
  "/admin/:enrollmentId/documentation",
  verifyAdmin,
  requireAnyPermission("internships.doc-review", "internships.enrollments"),
  adminUpdateInternshipDocumentationController,
);

/** POST /api/internship-enrollments/admin/:enrollmentId/documentation/verify */
router.post(
  "/admin/:enrollmentId/documentation/verify",
  verifyAdmin,
  requireAnyPermission("internships.doc-review", "internships.enrollments"),
  adminVerifyInternshipDocumentationController,
);

export default router;
