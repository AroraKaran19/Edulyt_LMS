import { CategoryModel } from "../models/category.schema";
import { Category } from "../types/category";

export const getAllCategoriesService = async (
  page: number,
  limit: number,
  search: string,
  isAdmin?: boolean
): Promise<{
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  let filters: any = {};

  // Active filter - only show active items for non-admin users
  if (!isAdmin) {
    filters.isActive = true;
  }

  // Search filter
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const categories = await CategoryModel.find(filters)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await CategoryModel.countDocuments(filters);

  const totalPages = Math.ceil(total / limit);

  return {
    categories,
    total,
    totalPages,
    page,
  };
};

export const getCategoryByIdService = async (
  id: string,
  isAdmin?: boolean
): Promise<Category | null> => {
  const category = await CategoryModel.findById(id)
    .where(isAdmin ? {} : { isActive: true });

  if (!category) {
    return null;
  }

  return category as Category;
};

export const createCategoryService = async (
  name: string,
  description?: string
): Promise<Category | null> => {
  const category = new CategoryModel(
    { name, description }
  );
  const savedCategory = await category.save();

  if (!savedCategory) {
    return null;
  }

  return savedCategory;
};

export const updateCategoryService = async (
  id: string,
  updateData: { name?: string; description?: string; isActive?: boolean }
): Promise<Category | null> => {
  const category = await CategoryModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return null;
  }

  return category as Category;
};

export const deleteCategoryService = async (
  id: string
): Promise<Category | null> => {
  const category = await CategoryModel.findByIdAndDelete(id);

  if (!category) {
    return null;
  }

  return category as Category;
};
