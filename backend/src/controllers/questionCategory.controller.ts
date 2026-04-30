import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { QUESTION_CATEGORY_VALUES } from "../constants/questionCategories";

/**
 * @route   GET /api/question-categories
 * @desc    Fixed question categories (read-only; no DB)
 * @access  Admin
 */
export const listQuestionCategoriesController = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = QUESTION_CATEGORY_VALUES.map((name) => ({
      _id: name,
      name,
      isActive: true,
    }));
    sendSuccessResponse(
      res,
      {
        categories,
        total: categories.length,
        page: 1,
        totalPages: 1,
      },
      "Question categories fetched successfully",
      200,
    );
  },
);
