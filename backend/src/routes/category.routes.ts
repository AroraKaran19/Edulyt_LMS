import {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  searchCategories,
  getCategoryStats,
} from "../controllers/category.controller";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories with pagination
 * @access  Public
 * @params
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - search: Search term for category name
 *   - activeOnly: Filter only active categories (default: true)
 * @example
 *   GET /api/categories?page=1&limit=10&search=programming&activeOnly=true
 */
router.get("/", getAllCategories);

/**
 * @route   GET /api/categories/search
 * @desc    Search categories
 * @access  Public
 * @params
 *   - q: Search term (required)
 *   - activeOnly: Filter only active categories (default: true)
 *   - limit: Maximum results (default: 10)
 * @example
 *   GET /api/categories/search?q=web&activeOnly=true&limit=5
 */
router.get("/search", searchCategories);

/**
 * @route   GET /api/categories/stats
 * @desc    Get category statistics
 * @access  Public
 * @example
 *   GET /api/categories/stats
 */
router.get("/stats", getCategoryStats);

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 * @params
 *   - slug: Category slug
 * @example
 *   GET /api/categories/slug/web-development
 */
router.get("/slug/:slug", getCategoryBySlug);

/**
 * @route   GET /api/categories/:categoryId
 * @desc    Get category by ID
 * @access  Public
 * @params
 *   - categoryId: Category ID
 * @example
 *   GET /api/categories/64a1b2c3d4e5f6789012345
 */
router.get("/:categoryId", getCategoryById);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Admin
 * @body
 *   - name: Category name (required, 2-100 chars)
 *   - slug: Category slug (optional, auto-generated from name if not provided)
 *   - isActive: Category status (optional, default: true)
 * @example
 *   POST /api/categories
 *   Body: {
 *     "name": "Web Development",
 *     "slug": "web-development",
 *     "isActive": true
 *   }
 */
router.post("/", createCategory);

/**
 * @route   PUT /api/categories/:categoryId
 * @desc    Update category
 * @access  Admin
 * @params
 *   - categoryId: Category ID
 * @body    Category update data (name, slug, isActive)
 * @example
 *   PUT /api/categories/64a1b2c3d4e5f6789012345
 *   Body: {
 *     "name": "Advanced Web Development",
 *     "isActive": true
 *   }
 */
router.put("/:categoryId", updateCategory);

/**
 * @route   PUT /api/categories/:categoryId/toggle-status
 * @desc    Toggle category status (active/inactive)
 * @access  Admin
 * @params
 *   - categoryId: Category ID
 * @example
 *   PUT /api/categories/64a1b2c3d4e5f6789012345/toggle-status
 */
router.put("/:categoryId/toggle-status", toggleCategoryStatus);

/**
 * @route   DELETE /api/categories/:categoryId
 * @desc    Delete category
 * @access  Admin
 * @params
 *   - categoryId: Category ID
 * @example
 *   DELETE /api/categories/64a1b2c3d4e5f6789012345
 */
router.delete("/:categoryId", deleteCategory);

export default router;
