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
import { DEFAULT_BRAND } from "../constants/brands";
import { readableBrands } from "../lib/brandScope";

export const getAllCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, search = "", audience } = req.query;
    const limit =
      req.query.limit !== undefined ? Number(req.query.limit) : undefined;
    const isAdmin = req.user?.userType === "admin";
    const validAudience =
      audience &&
      typeof audience === "string" &&
      ["college-students", "professionals"].includes(audience)
        ? (audience as "college-students" | "professionals")
        : undefined;

    if (Number(page) < 1) {
      throw new AppError("Page must be a positive number", 400);
    }
    if (limit !== undefined && limit < 1) {
      throw new AppError("Limit must be a positive number when provided", 400);
    }

    const result = await getAllCategoriesService(
      Number(page),
      limit,
      String(search),
      isAdmin,
      validAudience,
      isAdmin ? undefined : readableBrands(req.brand ?? DEFAULT_BRAND)
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
    const { name, description, showOnHomePage, showOnCourseList, categoryImage, audience } = req.body;
    if (!name) {
      throw new AppError("Category name is required", 400);
    }
    if (!audience || !["college-students", "professionals"].includes(audience)) {
      throw new AppError("Audience is required and must be 'college-students' or 'professionals'", 400);
    }

    try {
      const result = await createCategoryService(
        name,
        description,
        showOnHomePage,
        showOnCourseList,
        categoryImage,
        audience
      );
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
    const { name, description, isActive, showOnHomePage, showOnCourseList, categoryImage, audience } = req.body;
    if (!id) {
      throw new AppError("Category ID is required", 400);
    }
    if (
      !name &&
      !description &&
      isActive === undefined &&
      showOnHomePage === undefined &&
      showOnCourseList === undefined &&
      categoryImage === undefined &&
      audience === undefined
    ) {
      throw new AppError(
        "At least one field (name, description, isActive, showOnHomePage, showOnCourseList, categoryImage, or audience) is required",
        400
      );
    }
    if (audience !== undefined && !["college-students", "professionals"].includes(audience)) {
      throw new AppError("Audience must be 'college-students' or 'professionals'", 400);
    }

    try {
      const result = await updateCategoryService(id, {
        name,
        description,
        isActive,
        showOnHomePage,
        showOnCourseList,
        categoryImage,
        audience,
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
    const result = await getHomePageCategoriesService(
      readableBrands(req.brand ?? DEFAULT_BRAND)
    );
    sendSuccessResponse(res, result, "Home page categories fetched successfully", 200);
    return;
  }
);
