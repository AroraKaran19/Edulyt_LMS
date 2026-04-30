import {
  createFAQ,
  deleteFAQ,
  getAllFAQ,
  getFAQById,
  updateFAQ,
} from "../controllers/faq.controller";
import { verifyAdmin } from "../middlewares/admin.middleware";
import { verifyUser } from "../middlewares/user.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/faq
 * @desc    Get all FAQs
 * @access  Public
 */
router.get("/", getAllFAQ);

// ===================
// Admin Routes (must be before `/:id` — otherwise "admin" is parsed as an id)
// ===================

/**
 * @route   GET /api/faq/admin
 * @desc    Get all FAQs for admin (with full data)
 * @access  Admin
 */
router.get("/admin", verifyUser, verifyAdmin, getAllFAQ);

/**
 * @route   GET /api/faq/admin/:id
 * @desc    Get a FAQ by ID for admin (with full data)
 * @access  Admin
 */
router.get("/admin/:id", verifyUser, verifyAdmin, getFAQById);

/**
 * @route   PUT /api/faq/admin/:id
 * @desc    Update a FAQ (Admin can update any FAQ)
 * @access  Admin
 */
router.put("/admin/:id", verifyUser, verifyAdmin, updateFAQ);

/**
 * @route   DELETE /api/faq/admin/:id
 * @desc    Delete a FAQ (Admin can delete any FAQ)
 * @access  Admin
 */
router.delete("/admin/:id", verifyUser, verifyAdmin, deleteFAQ);

/**
 * @route   GET /api/faq/:id
 * @desc    Get a FAQ by ID
 * @access  Public
 */
router.get("/:id", getFAQById);

/**
 * @route   POST /api/faq
 * @desc    Create a new FAQ
 * @access  Admin
 */
router.post("/", verifyUser, verifyAdmin, createFAQ);

/**
 * @route   PUT /api/faq/:id
 * @desc    Update a FAQ
 * @access  Admin
 */
router.put("/:id", verifyUser, verifyAdmin, updateFAQ);

/**
 * @route   DELETE /api/faq/:id
 * @desc    Delete a FAQ
 * @access  Admin
 */
router.delete("/:id", verifyUser, verifyAdmin, deleteFAQ);

export default router;
