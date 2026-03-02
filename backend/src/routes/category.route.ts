import { verifyUser } from "../middlewares/user.middleware";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  getHomePageCategories,
  updateCategory,
} from "../controllers/category.controller";
import { verifyAdmin } from "../middlewares/admin.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get("/", getAllCategories);

/**
 * @route   GET /api/categories/homepage
 * @desc    Get categories to show on home page
 * @access  Public
 */
router.get("/homepage", getHomePageCategories);

// Admin routes MUST be defined before /:id so that "admin" is not matched as an id
/**
 * @route   GET /api/categories/admin
 * @desc    Get all categories for admin (with full data)
 * @access  Admin
 */
router.get("/admin", verifyUser, verifyAdmin, getAllCategories);

/**
 * @route   GET /api/categories/admin/:id
 * @desc    Get a category by ID for admin (with full data)
 * @access  Admin
 */
router.get("/admin/:id", verifyUser, verifyAdmin, getCategoryById);

/**
 * @route   PUT /api/categories/admin/:id
 * @desc    Update a category (Admin can update any category)
 * @access  Admin
 */
router.put("/admin/:id", verifyUser, verifyAdmin, updateCategory);

/**
 * @route   DELETE /api/categories/admin/:id
 * @desc    Delete a category (Admin can delete any category)
 * @access  Admin
 */
router.delete("/admin/:id", verifyUser, verifyAdmin, deleteCategory);

/**
 * @route   GET /api/categories/:id
 * @desc    Get a category by ID
 * @access  Public
 */
router.get("/:id", getCategoryById);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Admin
 */
router.post("/", verifyUser, verifyAdmin, createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category
 * @access  Admin
 */
router.put("/:id", verifyUser, verifyAdmin, updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Admin
 */
router.delete("/:id", verifyUser, verifyAdmin, deleteCategory);

export default router;
