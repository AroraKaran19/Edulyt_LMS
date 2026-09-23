import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import {
  getCaTaskAttemptController,
  listCaTasksMineController,
  submitCaTaskAnswersController,
} from "../controllers/caTask.controller";

const router = Router();
router.use(verifyUser);

/** @route GET /api/ca-tasks/mine */
router.get("/mine", listCaTasksMineController);
/** @route GET /api/ca-tasks/:taskId */
router.get("/:taskId", getCaTaskAttemptController);
/** @route POST /api/ca-tasks/:taskId/submit */
router.post("/:taskId/submit", submitCaTaskAnswersController);

export default router;
