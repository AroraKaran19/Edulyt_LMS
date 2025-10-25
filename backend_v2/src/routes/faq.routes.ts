import {
  createFAQ,
  deleteFAQ,
  getAllFAQ,
  getFAQById,
  updateFAQ,
} from "../controllers/faq.controller";
import { verifyAdmin } from "../middlewares/admin.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/faqs
 * @desc    Get all FAQs
 * @access  Public
 */
router.get("/", getAllFAQ);

/**
 * @route   GET /api/faqs/:id
 * @desc    Get a FAQ by ID
 * @access  Public
 */
router.get("/:id", getFAQById);

/**
 * @route   POST /api/faqs
 * @desc    Create a new FAQ
 * @access  Admin
 */
router.post("/", verifyAdmin, createFAQ);

/**
 * @route   PUT /api/faqs/:id
 * @desc    Update a FAQ
 * @access  Admin
 */
router.put("/:id", verifyAdmin, updateFAQ);

/**
 * @route   DELETE /api/faqs/:id
 * @desc    Delete a FAQ
 * @access  Admin
 */
router.delete("/:id", verifyAdmin, deleteFAQ);

// ===================
// Admin Routes
// ===================

/**
 * @route   GET /api/admin/faqs
 * @desc    Get all FAQs for admin (with full data)
 * @access  Admin
 */
router.get("/admin", verifyAdmin, getAllFAQ);

/**
 * @route   GET /api/admin/faqs/:id
 * @desc    Get a FAQ by ID for admin (with full data)
 * @access  Admin
 */
router.get("/admin/:id", verifyAdmin, getFAQById);

/**
 * @route   PUT /api/admin/faqs/:id
 * @desc    Update a FAQ (Admin can update any FAQ)
 * @access  Admin
 */
router.put("/admin/:id", verifyAdmin, updateFAQ);

/**
 * @route   DELETE /api/admin/faqs/:id
 * @desc    Delete a FAQ (Admin can delete any FAQ)
 * @access  Admin
 */
router.delete("/admin/:id", verifyAdmin, deleteFAQ);

export default router;
