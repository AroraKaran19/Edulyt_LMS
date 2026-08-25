import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import {
  verifyAdmin,
  requireAnyPermission,
} from "../middlewares/admin.middleware";
import {
  createSubmissionController,
  getSubmissionController,
  getSubmissionAdminController,
  saveMCQAnswerController,
  saveFileAnswerController,
  submitController,
  reviewFileResponseController,
  finalizeCertificationReviewController,
  listSubmissionsAdminController,
} from "../controllers/internshipSubmission.controller";

const router = Router();

router.use(verifyUser);

/** POST /api/internship-submissions — start a submission (writes snapshot) */
router.post("/", createSubmissionController);

/** GET /api/internship-submissions/admin — admin list */
router.get("/admin", verifyAdmin, requireAnyPermission("internships.certification-exams", "internships.tasks", "internships.entrance-exams"), listSubmissionsAdminController);

/** GET /api/internship-submissions/admin/:submissionId — full detail for admin */
router.get("/admin/:submissionId", verifyAdmin, requireAnyPermission("internships.certification-exams", "internships.tasks", "internships.entrance-exams"), getSubmissionAdminController);

/**
 * POST /api/internship-submissions/admin/:submissionId/finalize-certification
 * Required final step for certification exam submissions (MCQ-only or after file scoring).
 */
router.post(
  "/admin/:submissionId/finalize-certification",
  verifyAdmin, requireAnyPermission("internships.certification-exams", "internships.tasks"),
  finalizeCertificationReviewController,
);

/** GET /api/internship-submissions/:submissionId */
router.get("/:submissionId", getSubmissionController);

/** PATCH /api/internship-submissions/:submissionId/answers/mcq */
router.patch("/:submissionId/answers/mcq", saveMCQAnswerController);

/** PATCH /api/internship-submissions/:submissionId/answers/file */
router.patch("/:submissionId/answers/file", saveFileAnswerController);

/** POST /api/internship-submissions/:submissionId/submit — finalize + auto-grade */
router.post("/:submissionId/submit", submitController);

/**
 * PATCH /api/internship-submissions/admin/:submissionId/review/:questionId
 * Reviewer scores a file-upload response
 */
router.patch(
  "/admin/:submissionId/review/:questionId",
  verifyAdmin, requireAnyPermission("internships.certification-exams", "internships.tasks"),
  reviewFileResponseController,
);

export default router;
