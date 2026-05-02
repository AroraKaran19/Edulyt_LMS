import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
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
router.use(verifyAdmin);

/** POST /api/internship-questions — create (admin) */
router.post("/", createInternshipQuestionAdminController);

/** GET /api/internship-questions/admin — list */
router.get("/admin", listInternshipQuestionsAdminController);

/** POST /api/internship-questions/admin/bulk — must be before :questionId */
router.post("/admin/bulk", bulkCreateInternshipQuestionAdminController);

/** GET /api/internship-questions/admin/random — must be before :questionId */
router.get("/admin/random", randomInternshipQuestionsAdminController);

/** GET/PATCH/DELETE /api/internship-questions/admin/:questionId — single (admin) */
router.get("/admin/:questionId", getInternshipQuestionByIdAdminController);
router.patch("/admin/:questionId", updateInternshipQuestionAdminController);
router.delete("/admin/:questionId", deleteInternshipQuestionAdminController);

export default router;
