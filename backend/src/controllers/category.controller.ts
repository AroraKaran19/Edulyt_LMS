import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createCategoryService,
  deleteCategoryService,
  getAllCategoriesService,
  getCategoryByIdService,
  getHomePageCategoriesService,
  updateCategoryService,
} from "../services/category.services";

export const getAllCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    const isAdmin = req.user?.userType === "admin";

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await getAllCategoriesService(
      Number(page),
      Number(limit),
      String(search),
      isAdmin
    );

    if (!result || result.categories.length === 0) {
      sendSuccessResponse(res, [], "No categories found", 200);
      return;
    }

    sendSuccessResponse(res, result, "Categories fetched successfully", 200);
    return;
  }
);

export const getCategoryById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const isAdmin = req.user?.userType === "admin";
    
    if (!id) {
      throw new AppError("Category ID is required", 400);
    }

    const result = await getCategoryByIdService(id, isAdmin);
    if (!result) {
      sendSuccessResponse(res, [], "Category not found", 200);
      return;
    }

    sendSuccessResponse(res, result, "Category fetched successfully", 200);
    return;
  }
);

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, showOnHomePage } = req.body;
    if (!name) {
      throw new AppError("Category name is required", 400);
    }

    try {
      const result = await createCategoryService(name, description, showOnHomePage);
      if (!result) {
        throw new AppError("Failed to create category", 500);
      }

      sendSuccessResponse(res, result, "Category created successfully", 201);
      return;
    } catch (error: any) {
      if (error.message && error.message.includes("Maximum of 4 categories")) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, isActive, showOnHomePage } = req.body;
    if (!id) {
      throw new AppError("Category ID is required", 400);
    }
    if (!name && !description && isActive === undefined && showOnHomePage === undefined) {
      throw new AppError(
        "At least one field (name, description, isActive, or showOnHomePage) is required",
        400
      );
    }

    try {
      const result = await updateCategoryService(id, {
        name,
        description,
        isActive,
        showOnHomePage,
      });
      if (!result) {
        throw new AppError("Failed to update category", 500);
      }

      sendSuccessResponse(res, result, "Category updated successfully", 200);
      return;
    } catch (error: any) {
      if (error.message && error.message.includes("Maximum of 4 categories")) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new AppError("Category ID is required", 400);
    }

    const result = await deleteCategoryService(id);
    if (!result) {
      throw new AppError("Failed to delete category", 500);
    }

    sendSuccessResponse(res, result, "Category deleted successfully", 200);
    return;
  }
);

export const getHomePageCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getHomePageCategoriesService();
    sendSuccessResponse(res, result, "Home page categories fetched successfully", 200);
    return;
  }
);
