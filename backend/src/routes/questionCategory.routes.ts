import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin, requirePermission } from "../middlewares/admin.middleware";
import { listQuestionCategoriesController } from "../controllers/questionCategory.controller";

const router = Router();

router.use(verifyUser);
router.use(verifyAdmin);
router.use(requirePermission("internships.questions"));

/** Read-only list of fixed categories */
router.get("/", listQuestionCategoriesController);

export default router;
