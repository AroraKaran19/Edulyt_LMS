import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { attendCaMeetingController, listCaMeetingsMineController } from "../controllers/caMeeting.controller";

const router = Router();
router.use(verifyUser);

/** @route GET /api/ca-meetings/mine */
router.get("/mine", listCaMeetingsMineController);
/** @route POST /api/ca-meetings/attend/:token */
router.post("/attend/:token", attendCaMeetingController);

export default router;
