import {
  createFAQ,
  deleteFAQ,
  getAllFAQ,
  getFAQById,
  updateFAQ,
} from "../controllers/faq.controller";
import { adminGuard } from "../middlewares/admin.middleware";
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
router.get("/admin", ...adminGuard("faqs"),getAllFAQ);

/**
 * @route   GET /api/faq/admin/:id
 * @desc    Get a FAQ by ID for admin (with full data)
 * @access  Admin
 */
router.get("/admin/:id", ...adminGuard("faqs"),getFAQById);

/**
 * @route   PUT /api/faq/admin/:id
 * @desc    Update a FAQ (Admin can update any FAQ)
 * @access  Admin
 */
router.put("/admin/:id", ...adminGuard("faqs"),updateFAQ);

/**
 * @route   DELETE /api/faq/admin/:id
 * @desc    Delete a FAQ (Admin can delete any FAQ)
 * @access  Admin
 */
router.delete("/admin/:id", ...adminGuard("faqs"),deleteFAQ);

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
router.post("/", ...adminGuard("faqs"),createFAQ);

/**
 * @route   PUT /api/faq/:id
 * @desc    Update a FAQ
 * @access  Admin
 */
router.put("/:id", ...adminGuard("faqs"),updateFAQ);

/**
 * @route   DELETE /api/faq/:id
 * @desc    Delete a FAQ
 * @access  Admin
 */
router.delete("/:id", ...adminGuard("faqs"),deleteFAQ);

export default router;
