import { Request, Response } from "express";
import {
  getAllCategories,
  getActiveCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
} from "../services/category.service";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";

/**
 * Get all categories with pagination and filtering
 */
export const getAllCategoriesController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 50,
      search = "",
      isActive,
    } = req.query;

    const result = await getAllCategories(
      Number(page),
      Number(limit),
      search as string,
      isActive !== undefined ? isActive === "true" : undefined
    );

    sendSuccessResponse(res, result.data, result.message, 200);
  }
);

/**
 * Get active categories only (for dropdowns)
 */
export const getActiveCategoriesController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await getActiveCategories();
    sendSuccessResponse(res, result.data, result.message, 200);
  }
);

/**
 * Create a new category
 */
export const createCategoryController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      throw new AppError("Category name is required", 400);
    }

    const result = await createCategory({
      name: name.trim(),
      description: description?.trim(),
    });

    sendSuccessResponse(res, result.data, result.message, 201);
  }
);

/**
 * Update a category
 */
export const updateCategoryController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.params;
    const updateData = req.body;

    if (!categoryId) {
      throw new AppError("Category ID is required", 400);
    }

    // Clean up the update data
    const cleanedData: any = {};
    if (updateData.name) cleanedData.name = updateData.name.trim();
    if (updateData.description !== undefined) cleanedData.description = updateData.description?.trim();
    if (updateData.isActive !== undefined) cleanedData.isActive = updateData.isActive;

    const result = await updateCategory(categoryId, cleanedData);
    sendSuccessResponse(res, result.data, result.message, 200);
  }
);

/**
 * Delete a category
 */
export const deleteCategoryController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new AppError("Category ID is required", 400);
    }

    const result = await deleteCategory(categoryId);
    sendSuccessResponse(res, null, result.message, 200);
  }
);

/**
 * Get category by ID
 */
export const getCategoryByIdController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new AppError("Category ID is required", 400);
    }

    const result = await getCategoryById(categoryId);
    sendSuccessResponse(res, result.data, result.message, 200);
  }
);
