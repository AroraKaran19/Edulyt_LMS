import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import {
  listInternshipExamTemplatesAdminController,
  createInternshipExamAdminController,
  getInternshipExamByIdAdminController,
  updateInternshipExamAdminController,
  deleteInternshipExamAdminController,
} from "../controllers/internshipExam.controller";

const router = Router();

router.use(verifyUser);
router.use(verifyAdmin);

/** POST /api/internship-exams — create template */
router.post("/", createInternshipExamAdminController);

/**
 * GET /api/internship-exams/admin?page=&limit=&search=&internshipId=&batchId=&includeInactive=&status=
 * `status=all|active|inactive` for exam bank; optional ids pin batch-linked rows first.
 */
router.get("/admin", listInternshipExamTemplatesAdminController);

/** GET/PATCH/DELETE /api/internship-exams/admin/:examId */
router.get("/admin/:examId", getInternshipExamByIdAdminController);
router.patch("/admin/:examId", updateInternshipExamAdminController);
router.delete("/admin/:examId", deleteInternshipExamAdminController);

export default router;
