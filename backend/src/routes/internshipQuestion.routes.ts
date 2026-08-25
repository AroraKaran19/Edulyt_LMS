import { Router, RequestHandler } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin, requirePermission } from "../middlewares/admin.middleware";
import { requireStaffAnyPageAccess } from "../middlewares/staffAccess.middleware";
import {
  listInternshipQuestionsAdminController,
  createInternshipQuestionAdminController,
  bulkCreateInternshipQuestionAdminController,
  getInternshipQuestionByIdAdminController,
  updateInternshipQuestionAdminController,
  deleteInternshipQuestionAdminController,
  randomInternshipQuestionsAdminController,
} from "../controllers/internshipQuestion.controller";

const router = Router();

router.use(verifyUser);

/**
 * Every page that embeds the question picker browses the bank through these two
 * endpoints, so each has to pass without owning it. `scholarship.tests` is the
 * role-bearing one: marketer and sales hold no permissions array at all, which
 * is why this is the staff check rather than `requireAnyPermission`.
 */
const browseAccess: RequestHandler = requireStaffAnyPageAccess([
  "internships.questions",
  "internships.exams",
  "internships.tasks",
  "scholarship.tests",
]);

/** Owning the bank itself: every write, plus reading a single question. */
const bankAccess: RequestHandler[] = [
  verifyAdmin,
  requirePermission("internships.questions"),
];

/** POST /api/internship-questions — create (admin) */
router.post("/", ...bankAccess, createInternshipQuestionAdminController);

/** GET /api/internship-questions/admin — list */
router.get("/admin", browseAccess, listInternshipQuestionsAdminController);

/** POST /api/internship-questions/admin/bulk — must be before :questionId */
router.post(
  "/admin/bulk",
  ...bankAccess,
  bulkCreateInternshipQuestionAdminController,
);

/** GET /api/internship-questions/admin/random — must be before :questionId */
router.get(
  "/admin/random",
  browseAccess,
  randomInternshipQuestionsAdminController,
);

/** GET/PATCH/DELETE /api/internship-questions/admin/:questionId — single (admin) */
router.get(
  "/admin/:questionId",
  ...bankAccess,
  getInternshipQuestionByIdAdminController,
);
router.patch(
  "/admin/:questionId",
  ...bankAccess,
  updateInternshipQuestionAdminController,
);
router.delete(
  "/admin/:questionId",
  ...bankAccess,
  deleteInternshipQuestionAdminController,
);

export default router;
