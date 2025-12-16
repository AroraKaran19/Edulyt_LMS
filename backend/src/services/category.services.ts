import { CategoryModel, CourseModel } from "../models";
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
  const category = await CategoryModel.findById(id).where(
    isAdmin ? {} : { isActive: true }
  );

  if (!category) {
    return null;
  }

  return category as Category;
};

export const getHomePageCategoriesService = async (): Promise<Category[]> => {
  const categories = await CategoryModel.find({
    isActive: true,
    showOnHomePage: true,
  })
    .sort({ createdAt: -1 })
    .limit(4);

  return categories as Category[];
};

export const createCategoryService = async (
  name: string,
  description?: string,
  showOnHomePage?: boolean,
  categoryImage?: string
): Promise<Category | null> => {
  // Check if trying to set showOnHomePage to true
  if (showOnHomePage === true) {
    // Count existing categories with showOnHomePage: true
    const count = await CategoryModel.countDocuments({ showOnHomePage: true });
    if (count >= 4) {
      throw new Error("Maximum of 4 categories can be shown on home page");
    }
  }

  const category = new CategoryModel({
    name,
    description,
    showOnHomePage: showOnHomePage ?? false,
    categoryImage: categoryImage || "",
  });
  const savedCategory = await category.save();

  if (!savedCategory) {
    return null;
  }

  return savedCategory;
};

export const updateCategoryService = async (
  id: string,
  updateData: {
    name?: string;
    description?: string;
    isActive?: boolean;
    showOnHomePage?: boolean;
    categoryImage?: string;
  }
): Promise<Category | null> => {
  // Check if trying to set showOnHomePage to true
  if (updateData.showOnHomePage === true) {
    // Count existing categories with showOnHomePage: true (excluding current category)
    const count = await CategoryModel.countDocuments({
      showOnHomePage: true,
      _id: { $ne: id },
    });
    if (count >= 4) {
      throw new Error("Maximum of 4 categories can be shown on home page");
    }
  }

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
  // Get the category first to get the name
  const category = await CategoryModel.findById(id);

  if (!category) {
    return null;
  }

  // Check if there are any courses using this category
  const coursesUsingCategory = await CourseModel.countDocuments({
    category: category.name,
  });

  if (coursesUsingCategory > 0) {
    // Remove the category from courses and set them as inactive
    await CourseModel.updateMany(
      { category: category.name },
      {
        $unset: { category: 1 },
        $set: { isActive: false },
      }
    );
  }

  // Delete the category
  const deletedCategory = await CategoryModel.findByIdAndDelete(id);

  return deletedCategory as Category;
};
