import { Router } from "express";
import {
  getAllCategoriesController,
  getActiveCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  getCategoryByIdController,
} from "../controllers/category.controller";

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories with pagination and filtering
 * @access  Public
 * @params
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 50, max: 100)
 *   - search: Search in name or description (optional)
 *   - isActive: Filter by active status (optional)
 * @example
 *   GET /api/categories?page=1&limit=10&search=programming&isActive=true
 */
router.get("/", getAllCategoriesController);

/**
 * @route   GET /api/categories/active
 * @desc    Get active categories only (for dropdowns)
 * @access  Public
 * @example
 *   GET /api/categories/active
 */
router.get("/active", getActiveCategoriesController);

/**
 * @route   GET /api/categories/:categoryId
 * @desc    Get category by ID
 * @access  Public
 * @params
 *   - categoryId: The ID of the category
 * @example
 *   GET /api/categories/64a1b2c3d4e5f6789012345
 */
router.get("/:categoryId", getCategoryByIdController);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Admin/Instructor
 * @body
 *   - name: Category name (required)
 *   - description: Category description (optional)
 * @example
 *   POST /api/categories
 *   Body: {
 *     "name": "Programming",
 *     "description": "Programming and software development courses"
 *   }
 */
router.post("/", createCategoryController);

/**
 * @route   PUT /api/categories/:categoryId
 * @desc    Update a category
 * @access  Admin/Instructor
 * @params
 *   - categoryId: The ID of the category to update
 * @body
 *   - name: Category name (optional)
 *   - description: Category description (optional)
 *   - isActive: Whether category is active (optional)
 * @example
 *   PUT /api/categories/64a1b2c3d4e5f6789012345
 *   Body: {
 *     "name": "Updated Programming",
 *     "description": "Updated description",
 *     "isActive": true
 *   }
 */
router.put("/:categoryId", updateCategoryController);

/**
 * @route   DELETE /api/categories/:categoryId
 * @desc    Delete a category
 * @access  Admin/Instructor
 * @params
 *   - categoryId: The ID of the category to delete
 * @example
 *   DELETE /api/categories/64a1b2c3d4e5f6789012345
 */
router.delete("/:categoryId", deleteCategoryController);

export default router;
