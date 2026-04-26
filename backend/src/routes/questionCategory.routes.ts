import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import {
  createQuestionCategoryController,
  listQuestionCategoriesController,
  getQuestionCategoryByIdController,
  updateQuestionCategoryController,
  deleteQuestionCategoryController,
} from "../controllers/questionCategory.controller";

const router = Router();

router.use(verifyUser);
router.use(verifyAdmin);

router.post("/", createQuestionCategoryController);
router.get("/", listQuestionCategoriesController);
router.get("/:categoryId", getQuestionCategoryByIdController);
router.patch("/:categoryId", updateQuestionCategoryController);
router.delete("/:categoryId", deleteQuestionCategoryController);

export default router;
