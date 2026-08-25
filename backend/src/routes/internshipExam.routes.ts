import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import {
  verifyAdmin,
  requirePermission,
  requireAnyPermission,
} from "../middlewares/admin.middleware";
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

/** Owning the templates themselves. */
const OWNER = requirePermission("internships.exams");

/** POST /api/internship-exams — create template */
router.post("/", OWNER, createInternshipExamAdminController);

/**
 * GET /api/internship-exams/admin?page=&limit=&search=&internshipId=&batchId=&includeInactive=&status=
 * `status=all|active|inactive` for exam bank; optional ids pin batch-linked rows first.
 */
// The batch editor on Manage Internships picks templates from this list, so
// that page must be able to read it without owning the templates.
router.get(
  "/admin",
  requireAnyPermission("internships.exams", "internships.manage"),
  listInternshipExamTemplatesAdminController,
);

/** GET/PATCH/DELETE /api/internship-exams/admin/:examId */
router.get("/admin/:examId", OWNER, getInternshipExamByIdAdminController);
router.patch("/admin/:examId", OWNER, updateInternshipExamAdminController);
router.delete("/admin/:examId", OWNER, deleteInternshipExamAdminController);

export default router;
