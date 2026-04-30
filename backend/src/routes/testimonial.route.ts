import {
  createTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
} from "../controllers/testimonial.controller";
import { verifyAdmin } from "../middlewares/admin.middleware";
import { verifyUser } from "../middlewares/user.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/testimonials
 * @desc    Get all testimonials
 * @access  Public
 */
router.get("/", getAllTestimonials);

// ===================
// Admin Routes (must be before `/:id` — otherwise "admin" is parsed as an id)
// ===================

/**
 * @route   GET /api/testimonials/admin
 * @desc    Get all testimonials for admin (with full data)
 * @access  Admin
 */
router.get("/admin", verifyUser, verifyAdmin, getAllTestimonials);

/**
 * @route   GET /api/testimonials/admin/:id
 * @desc    Get a testimonial by ID for admin (with full data)
 * @access  Admin
 */
router.get("/admin/:id", verifyUser, verifyAdmin, getTestimonialById);

/**
 * @route   PUT /api/testimonials/admin/:id
 * @desc    Update a testimonial (Admin can update any testimonial)
 * @access  Admin
 */
router.put("/admin/:id", verifyUser, verifyAdmin, updateTestimonial);

/**
 * @route   DELETE /api/testimonials/admin/:id
 * @desc    Delete a testimonial (Admin can delete any testimonial)
 * @access  Admin
 */
router.delete("/admin/:id", verifyUser, verifyAdmin, deleteTestimonial);

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
router.post("/", verifyUser, verifyAdmin, createTestimonial);

/**
 * @route   PUT /api/testimonials/:id
 * @desc    Update a testimonial
 * @access  Admin
 */
router.put("/:id", verifyUser, verifyAdmin, updateTestimonial);

/**
 * @route   DELETE /api/testimonials/:id
 * @desc    Delete a testimonial
 * @access  Admin
 */
router.delete("/:id", verifyUser, verifyAdmin, deleteTestimonial);

export default router;
