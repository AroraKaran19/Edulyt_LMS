import { Request, Response } from "express";
import {
  getAllCategories as getAllCategoriesService,
  getCategoryById as getCategoryByIdService,
  getCategoryBySlug as getCategoryBySlugService,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
  toggleCategoryStatus as toggleCategoryStatusService,
  searchCategories as searchCategoriesService,
} from "../services/category.service";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";

/**
 * Get all categories with pagination
 */
export const getAllCategories = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      activeOnly = 'true' 
    } = req.query;

    const categories = await getAllCategoriesService(
      Number(page),
      Number(limit),
      search as string,
      activeOnly === 'true'
    );

    sendSuccessResponse(res, categories, "Categories retrieved successfully", 200);
  }
);

/**
 * Get category by ID
 */
export const getCategoryById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new AppError("Category ID is required", 400);
    }

    const category = await getCategoryByIdService(categoryId);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    sendSuccessResponse(res, { category }, "Category retrieved successfully", 200);
  }
);

/**
 * Get category by slug
 */
export const getCategoryBySlug = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;

    if (!slug) {
      throw new AppError("Category slug is required", 400);
    }

    const category = await getCategoryBySlugService(slug);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    sendSuccessResponse(res, { category }, "Category retrieved successfully", 200);
  }
);

/**
 * Create a new category
 */
export const createCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const categoryData = req.body;

    if (!categoryData) {
      throw new AppError("Category data is required", 400);
    }

    console.log("📝 Creating category:", {
      name: categoryData.name,
      slug: categoryData.slug || 'auto-generated'
    });

    const result = await createCategoryService(categoryData);

    sendSuccessResponse(
      res,
      { categoryId: result.categoryId },
      result.message,
      201
    );
  }
);

/**
 * Update category
 */
export const updateCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.params;
    const updateData = req.body;

    if (!categoryId) {
      throw new AppError("Category ID is required", 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new AppError("Update data is required", 400);
    }

    console.log("📝 Updating category:", categoryId);

    const result = await updateCategoryService(categoryId, updateData);

    sendSuccessResponse(
      res,
      { categoryId, updated: true },
      result.message,
      200
    );
  }
);

/**
 * Delete category
 */
export const deleteCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new AppError("Category ID is required", 400);
    }

    console.log("🗑️ Deleting category:", categoryId);

    const result = await deleteCategoryService(categoryId);

    sendSuccessResponse(
      res,
      { categoryId, deleted: true },
      result.message,
      200
    );
  }
);

/**
 * Toggle category status (active/inactive)
 */
export const toggleCategoryStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new AppError("Category ID is required", 400);
    }

    console.log("🔄 Toggling category status:", categoryId);

    const result = await toggleCategoryStatusService(categoryId);

    sendSuccessResponse(
      res,
      { 
        categoryId, 
        isActive: result.isActive,
        statusChanged: true 
      },
      result.message,
      200
    );
  }
);

/**
 * Search categories
 */
export const searchCategories = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { 
      q: searchTerm, 
      activeOnly = 'true', 
      limit = 10 
    } = req.query;

    if (!searchTerm) {
      throw new AppError("Search term (q) is required", 400);
    }

    console.log("🔍 Searching categories for:", searchTerm);

    const categories = await searchCategoriesService(
      searchTerm as string,
      activeOnly === 'true',
      Number(limit)
    );

    sendSuccessResponse(
      res,
      { categories, total: categories.length },
      "Categories search completed successfully",
      200
    );
  }
);

/**
 * Get category statistics
 */
export const getCategoryStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const [activeCategories, totalCategories] = await Promise.all([
      getAllCategoriesService(1, 1, undefined, true),
      getAllCategoriesService(1, 1, undefined, false)
    ]);

    sendSuccessResponse(
      res,
      {
        totalCategories: totalCategories.total,
        activeCategories: activeCategories.total,
        inactiveCategories: totalCategories.total - activeCategories.total
      },
      "Category statistics retrieved successfully",
      200
    );
  }
);
