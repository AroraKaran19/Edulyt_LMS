import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createQuestionCategoryService,
  listQuestionCategoriesService,
  getQuestionCategoryByIdService,
  updateQuestionCategoryService,
  deleteQuestionCategoryService,
} from "../services/questionCategory.services";

/**
 * @route   POST /api/question-categories
 * @desc    Create a question category (admin)
 * @access  Admin
 */
export const createQuestionCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const { name } = req.body as { name?: string };
    if (!name?.trim()) throw new AppError("name is required", 400);

    const result = await createQuestionCategoryService(
      name,
      new mongoose.Types.ObjectId(String(userId))
    );
    sendSuccessResponse(res, result, "Question category created successfully", 201);
  }
);

/**
 * @route   GET /api/question-categories
 * @desc    List question categories with optional pagination, search, isActive filter
 * @access  Admin
 */
export const listQuestionCategoriesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 50, search, isActive } = req.query;

    const result = await listQuestionCategoriesService({
      page: Number(page),
      limit: Number(limit),
      search: typeof search === "string" ? search : undefined,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
    });

    sendSuccessResponse(res, result, "Question categories fetched successfully", 200);
  }
);

/**
 * @route   GET /api/question-categories/:categoryId
 * @desc    Get a single question category by ID
 * @access  Admin
 */
export const getQuestionCategoryByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const result = await getQuestionCategoryByIdService(String(categoryId));
    sendSuccessResponse(res, result, "Question category fetched successfully", 200);
  }
);

/**
 * @route   PATCH /api/question-categories/:categoryId
 * @desc    Update name and/or isActive
 * @access  Admin
 */
export const updateQuestionCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const { name, isActive } = req.body as { name?: string; isActive?: boolean };

    const result = await updateQuestionCategoryService(String(categoryId), {
      name,
      isActive,
    });
    sendSuccessResponse(res, result, "Question category updated successfully", 200);
  }
);

/**
 * @route   DELETE /api/question-categories/:categoryId
 * @desc    Delete a question category
 * @access  Admin
 */
export const deleteQuestionCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    await deleteQuestionCategoryService(String(categoryId));
    sendSuccessResponse(res, { deleted: true }, "Question category deleted successfully", 200);
  }
);
