import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import {
  registerForExamController,
  listMyInternshipEnrollmentsController,
  getLearnerEntranceExamController,
  getLearnerProgramBySlugController,
  listInternshipEnrollmentsAdminController,
  getInternshipEnrollmentByIdAdminController,
  adminUpdateEnrollmentStatusController,
  deleteInternshipEnrollmentAdminController,
  listEntranceExamCohortsController,
  adminBulkApproveToEnrolledController,
} from "../controllers/internshipEnrollment.controller";

const router = Router();

router.use(verifyUser);

/** POST /api/internship-enrollments — learner registers for entrance exam */
router.post("/", registerForExamController);

/** GET /api/internship-enrollments/me — learner's enrollments (dashboard) */
router.get("/me", listMyInternshipEnrollmentsController);

/** GET /api/internship-enrollments/me/entrance-exam?enrollmentId= — learner fetches exam */
router.get("/me/entrance-exam", getLearnerEntranceExamController);

/** GET /api/internship-enrollments/me/program/:slug — learner program detail + tasks */
router.get("/me/program/:slug", getLearnerProgramBySlugController);

/** GET /api/internship-enrollments/admin/entrance-exam-cohorts (before :enrollmentId) */
router.get(
  "/admin/entrance-exam-cohorts",
  verifyAdmin,
  listEntranceExamCohortsController,
);

/** GET /api/internship-enrollments/admin */
router.get("/admin", verifyAdmin, listInternshipEnrollmentsAdminController);

/** POST /api/internship-enrollments/admin/approve-to-enrolled (before :enrollmentId) */
router.post(
  "/admin/approve-to-enrolled",
  verifyAdmin,
  adminBulkApproveToEnrolledController,
);

/** DELETE /api/internship-enrollments/admin/:enrollmentId */
router.delete(
  "/admin/:enrollmentId",
  verifyAdmin,
  deleteInternshipEnrollmentAdminController,
);

/** GET /api/internship-enrollments/admin/:enrollmentId */
router.get(
  "/admin/:enrollmentId",
  verifyAdmin,
  getInternshipEnrollmentByIdAdminController,
);

/** PATCH /api/internship-enrollments/admin/:enrollmentId/status */
router.patch(
  "/admin/:enrollmentId/status",
  verifyAdmin,
  adminUpdateEnrollmentStatusController,
);

export default router;
