import { CourseCategoryModel } from "../models/course-category.schema";
import { AppError } from "../middlewares/error.middleware";
import mongoose from "mongoose";

export interface CourseCategory {
  _id?: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Get all categories with pagination
 * @param page - Page number
 * @param limit - Items per page
 * @param search - Search term for category name
 * @param activeOnly - Filter only active categories
 * @returns Promise<{categories: CourseCategory[], total: number, page: number, totalPages: number}>
 */
export const getAllCategories = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  activeOnly: boolean = true
): Promise<{
  categories: CourseCategory[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Build query object
    const query: any = {};

    if (activeOnly) {
      query.isActive = true;
    }

    // Add search filter if provided
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await CourseCategoryModel.countDocuments(query);

    const categories = await CourseCategoryModel.find(query)
      .sort({ name: 1 }) // Sort alphabetically
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      categories,
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Database error in getAllCategories:", error);
    throw new AppError("Failed to fetch categories from database", 500);
  }
};

/**
 * Get category by ID
 * @param categoryId - Category ID
 * @returns Promise<CourseCategory | null>
 */
export const getCategoryById = async (categoryId: string): Promise<CourseCategory | null> => {
  try {
    // Validate categoryId format
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new AppError("Invalid category ID format", 400);
    }

    const category = await CourseCategoryModel.findById(categoryId).lean();
    return category;
  } catch (error) {
    console.error("Database error in getCategoryById:", error);
    throw new AppError("Failed to fetch category from database", 500);
  }
};

/**
 * Get category by slug
 * @param slug - Category slug
 * @returns Promise<CourseCategory | null>
 */
export const getCategoryBySlug = async (slug: string): Promise<CourseCategory | null> => {
  try {
    const category = await CourseCategoryModel.findOne({ slug, isActive: true }).lean();
    return category;
  } catch (error) {
    console.error("Database error in getCategoryBySlug:", error);
    throw new AppError("Failed to fetch category from database", 500);
  }
};

/**
 * Create a new category
 * @param categoryData - Category data
 * @returns Promise<{success: boolean, categoryId: string, message: string}>
 */
export const createCategory = async (categoryData: Partial<CourseCategory>) => {
  try {
    // Validate required fields
    if (!categoryData.name) {
      throw new AppError("Category name is required", 400);
    }

    // Validate field lengths
    if (categoryData.name.trim().length < 2) {
      throw new AppError("Category name must be at least 2 characters long", 400);
    }

    if (categoryData.name.trim().length > 100) {
      throw new AppError("Category name cannot exceed 100 characters", 400);
    }

    // Generate slug from name if not provided
    let slug = categoryData.slug;
    if (!slug) {
      slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .trim();
    }

    // Ensure slug is unique
    let baseSlug = slug;
    let counter = 1;
    while (await CourseCategoryModel.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newCategory = new CourseCategoryModel({
      name: categoryData.name.trim(),
      slug,
      isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
    });

    await newCategory.validate();
    await newCategory.save();

    return {
      success: true,
      categoryId: newCategory._id,
      message: "Category created successfully",
    };
  } catch (error) {
    console.error("Database error in createCategory:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      throw new AppError(`${duplicateField} already exists. Please use a different ${duplicateField}.`, 400);
    }
    
    throw new AppError("Failed to create category", 500);
  }
};

/**
 * Update category
 * @param categoryId - Category ID
 * @param updateData - Category update data
 * @returns Promise<{success: boolean, message: string}>
 */
export const updateCategory = async (
  categoryId: string,
  updateData: Partial<CourseCategory>
): Promise<{success: boolean, message: string}> => {
  try {
    // Validate categoryId format
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new AppError("Invalid category ID format", 400);
    }

    // Remove fields that shouldn't be updated
    const { _id, createdAt, ...allowedUpdateData } = updateData;

    if (Object.keys(allowedUpdateData).length === 0) {
      throw new AppError("No valid fields provided for update", 400);
    }

    // Validate field lengths if provided
    if (allowedUpdateData.name) {
      if (allowedUpdateData.name.trim().length < 2) {
        throw new AppError("Category name must be at least 2 characters long", 400);
      }
      if (allowedUpdateData.name.trim().length > 100) {
        throw new AppError("Category name cannot exceed 100 characters", 400);
      }
      allowedUpdateData.name = allowedUpdateData.name.trim();
    }

    // Handle slug update if name is being changed
    if (allowedUpdateData.name && !allowedUpdateData.slug) {
      let newSlug = allowedUpdateData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      // Ensure slug is unique (excluding current category)
      let baseSlug = newSlug;
      let counter = 1;
      while (await CourseCategoryModel.findOne({ slug: newSlug, _id: { $ne: categoryId } })) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      allowedUpdateData.slug = newSlug;
    }

    const updateResult = await CourseCategoryModel.findByIdAndUpdate(
      categoryId,
      {
        ...allowedUpdateData,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateResult) {
      throw new AppError("Category not found", 404);
    }

    return {
      success: true,
      message: "Category updated successfully",
    };
  } catch (error) {
    console.error("Database error in updateCategory:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      throw new AppError(`${duplicateField} already exists. Please use a different ${duplicateField}.`, 400);
    }
    
    throw new AppError("Failed to update category", 500);
  }
};

/**
 * Delete category
 * @param categoryId - Category ID
 * @returns Promise<{success: boolean, message: string}>
 */
export const deleteCategory = async (categoryId: string): Promise<{success: boolean, message: string}> => {
  try {
    // Validate categoryId format
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new AppError("Invalid category ID format", 400);
    }

    const deleteResult = await CourseCategoryModel.findByIdAndDelete(categoryId);

    if (!deleteResult) {
      throw new AppError("Category not found", 404);
    }

    return {
      success: true,
      message: "Category deleted successfully",
    };
  } catch (error) {
    console.error("Database error in deleteCategory:", error);
    throw new AppError("Failed to delete category", 500);
  }
};

/**
 * Toggle category status (active/inactive)
 * @param categoryId - Category ID
 * @returns Promise<{success: boolean, message: string, isActive: boolean}>
 */
export const toggleCategoryStatus = async (
  categoryId: string
): Promise<{success: boolean, message: string, isActive: boolean}> => {
  try {
    // Validate categoryId format
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new AppError("Invalid category ID format", 400);
    }

    const category = await CourseCategoryModel.findById(categoryId);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    const newStatus = !category.isActive;
    
    await CourseCategoryModel.findByIdAndUpdate(
      categoryId,
      {
        isActive: newStatus,
        updatedAt: new Date(),
      }
    );

    return {
      success: true,
      message: `Category ${newStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: newStatus,
    };
  } catch (error) {
    console.error("Database error in toggleCategoryStatus:", error);
    throw new AppError("Failed to toggle category status", 500);
  }
};

/**
 * Search categories
 * @param searchTerm - Search term
 * @param activeOnly - Filter only active categories
 * @param limit - Maximum results to return
 * @returns Promise<CourseCategory[]>
 */
export const searchCategories = async (
  searchTerm: string,
  activeOnly: boolean = true,
  limit: number = 10
): Promise<CourseCategory[]> => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new AppError("Search term must be at least 2 characters long", 400);
    }

    const query: any = {
      name: { $regex: searchTerm.trim(), $options: "i" }
    };

    if (activeOnly) {
      query.isActive = true;
    }

    const categories = await CourseCategoryModel.find(query)
      .limit(limit)
      .sort({ name: 1 })
      .lean();

    return categories;
  } catch (error) {
    console.error("Database error in searchCategories:", error);
    throw new AppError("Failed to search categories", 500);
  }
};
