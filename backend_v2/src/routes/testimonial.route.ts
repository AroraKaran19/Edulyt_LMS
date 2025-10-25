import {
  createTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
} from "../controllers/testimonial.controller";
import { verifyAdmin } from "../middlewares/admin.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/testimonials
 * @desc    Get all testimonials
 * @access  Public
 */
router.get("/", getAllTestimonials);

/**
 * @route   GET /api/testimonials/:id
 * @desc    Get a testimonial by ID
 * @access  Public
 */
router.get("/:id", getTestimonialById);

/**
 * @route   POST /api/testimonials
 * @desc    Create a new testimonial
 * @access  Admin
 */
router.post("/", verifyAdmin, createTestimonial);

/**
 * @route   PUT /api/testimonials/:id
 * @desc    Update a testimonial
 * @access  Admin
 */
router.put("/:id", verifyAdmin, updateTestimonial);

/**
 * @route   DELETE /api/testimonials/:id
 * @desc    Delete a testimonial
 * @access  Admin
 */
router.delete("/:id", verifyAdmin, deleteTestimonial);

// ===================
// Admin Routes
// ===================

/**
 * @route   GET /api/admin/testimonials
 * @desc    Get all testimonials for admin (with full data)
 * @access  Admin
 */
router.get("/admin", verifyAdmin, getAllTestimonials);

/**
 * @route   GET /api/admin/testimonials/:id
 * @desc    Get a testimonial by ID for admin (with full data)
 * @access  Admin
 */
router.get("/admin/:id", verifyAdmin, getTestimonialById);

/**
 * @route   PUT /api/admin/testimonials/:id
 * @desc    Update a testimonial (Admin can update any testimonial)
 * @access  Admin
 */
router.put("/admin/:id", verifyAdmin, updateTestimonial);

/**
 * @route   DELETE /api/admin/testimonials/:id
 * @desc    Delete a testimonial (Admin can delete any testimonial)
 * @access  Admin
 */
router.delete("/admin/:id", verifyAdmin, deleteTestimonial);

export default router;
