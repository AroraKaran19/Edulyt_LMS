import { CategoryModel } from "../models/category.schema";
import { AppError } from "../middlewares/error.middleware";
import mongoose from "mongoose";

export interface CategoryResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface CategoryListResponse {
  success: boolean;
  data?: {
    categories: any[];
    total: number;
    page: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

/**
 * Get all categories with pagination and filtering
 */
export const getAllCategories = async (
  page: number = 1,
  limit: number = 50,
  search: string = "",
  isActive?: boolean
): Promise<CategoryListResponse> => {
  try {
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Get categories with pagination
    const categories = await CategoryModel.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await CategoryModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        categories,
        total,
        page,
        totalPages,
      },
      message: "Categories retrieved successfully",
    };
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    throw new AppError(
      `Failed to retrieve categories: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get active categories only (for dropdowns)
 */
export const getActiveCategories = async (): Promise<CategoryResponse> => {
  try {
    const categories = await CategoryModel.find({ isActive: true })
      .sort({ name: 1 })
      .select("name description")
      .lean();

    return {
      success: true,
      data: categories,
      message: "Active categories retrieved successfully",
    };
  } catch (error) {
    console.error("Error in getActiveCategories:", error);
    throw new AppError(
      `Failed to retrieve active categories: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Create a new category
 */
export const createCategory = async (categoryData: {
  name: string;
  description?: string;
}): Promise<CategoryResponse> => {
  try {
    // Check if category already exists
    const existingCategory = await CategoryModel.findOne({
      name: { $regex: new RegExp(`^${categoryData.name}$`, "i") },
    });

    if (existingCategory) {
      throw new AppError("Category with this name already exists", 409);
    }

    const newCategory = new CategoryModel({
      ...categoryData,
      isActive: true,
    });

    await newCategory.validate();
    await newCategory.save();

    return {
      success: true,
      data: newCategory,
      message: "Category created successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof mongoose.Error.ValidationError) {
      throw new AppError(`Validation error: ${error.message}`, 400);
    }

    console.error("Error in createCategory:", error);
    throw new AppError(
      `Failed to create category: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Update a category
 */
export const updateCategory = async (
  categoryId: string,
  updateData: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<CategoryResponse> => {
  try {
    // Check if category exists
    const existingCategory = await CategoryModel.findById(categoryId);
    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }

    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name !== existingCategory.name) {
      const duplicateCategory = await CategoryModel.findOne({
        name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
        _id: { $ne: categoryId },
      });

      if (duplicateCategory) {
        throw new AppError("Category with this name already exists", 409);
      }
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true, runValidators: true }
    );

    return {
      success: true,
      data: updatedCategory,
      message: "Category updated successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof mongoose.Error.ValidationError) {
      throw new AppError(`Validation error: ${error.message}`, 400);
    }

    console.error("Error in updateCategory:", error);
    throw new AppError(
      `Failed to update category: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (categoryId: string): Promise<CategoryResponse> => {
  try {
    // Check if category exists
    const existingCategory = await CategoryModel.findById(categoryId);
    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }

    // Check if category is being used by any courses
    const { CourseModel } = await import("../models/course.schema");
    const coursesUsingCategory = await CourseModel.countDocuments({
      category: existingCategory.name,
    });

    if (coursesUsingCategory > 0) {
      throw new AppError(
        `Cannot delete category. It is being used by ${coursesUsingCategory} course(s). Consider deactivating it instead.`,
        409
      );
    }

    await CategoryModel.findByIdAndDelete(categoryId);

    return {
      success: true,
      message: "Category deleted successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error("Error in deleteCategory:", error);
    throw new AppError(
      `Failed to delete category: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (categoryId: string): Promise<CategoryResponse> => {
  try {
    const category = await CategoryModel.findById(categoryId);
    
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    return {
      success: true,
      data: category,
      message: "Category retrieved successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error("Error in getCategoryById:", error);
    throw new AppError(
      `Failed to retrieve category: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};
