import { verifyUser } from "../middlewares/user.middleware";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
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

// ===================
// Admin Routes
// ===================

/**
 * @route   GET /api/admin/categories
 * @desc    Get all categories for admin (with full data)
 * @access  Admin
 */
router.get("/admin", verifyUser, verifyAdmin, getAllCategories);

/**
 * @route   GET /api/admin/categories/:id
 * @desc    Get a category by ID for admin (with full data)
 * @access  Admin
 */
router.get("/admin/:id", verifyUser, verifyAdmin, getCategoryById);

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Update a category (Admin can update any category)
 * @access  Admin
 */
router.put("/admin/:id", verifyUser, verifyAdmin, updateCategory);

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Delete a category (Admin can delete any category)
 * @access  Admin
 */
router.delete("/admin/:id", verifyUser, verifyAdmin, deleteCategory);

export default router;
