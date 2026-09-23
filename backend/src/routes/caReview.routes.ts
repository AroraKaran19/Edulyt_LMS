import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { requireStaffPageAccess } from "../middlewares/staffAccess.middleware";
import { listCaReviewQueueController, reviewCaTaskAnswerController } from "../controllers/caReview.controller";

const router = Router();
const staff = [verifyUser, requireStaffPageAccess("crm.ca-leads")];

/** @route GET /api/ca-reviews */
router.get("/", ...staff, listCaReviewQueueController);
/** @route POST /api/ca-reviews/:submissionId/answers/:questionId */
router.post("/:submissionId/answers/:questionId", ...staff, reviewCaTaskAnswerController);

export default router;
