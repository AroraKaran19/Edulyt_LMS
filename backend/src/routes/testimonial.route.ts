import {
  createTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
} from "../controllers/testimonial.controller";
import { adminGuard } from "../middlewares/admin.middleware";
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
router.get("/admin", ...adminGuard("testimonials"),getAllTestimonials);

/**
 * @route   GET /api/testimonials/admin/:id
 * @desc    Get a testimonial by ID for admin (with full data)
 * @access  Admin
 */
router.get("/admin/:id", ...adminGuard("testimonials"),getTestimonialById);

/**
 * @route   PUT /api/testimonials/admin/:id
 * @desc    Update a testimonial (Admin can update any testimonial)
 * @access  Admin
 */
router.put("/admin/:id", ...adminGuard("testimonials"),updateTestimonial);

/**
 * @route   DELETE /api/testimonials/admin/:id
 * @desc    Delete a testimonial (Admin can delete any testimonial)
 * @access  Admin
 */
router.delete("/admin/:id", ...adminGuard("testimonials"),deleteTestimonial);

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
router.post("/", ...adminGuard("testimonials"),createTestimonial);

/**
 * @route   PUT /api/testimonials/:id
 * @desc    Update a testimonial
 * @access  Admin
 */
router.put("/:id", ...adminGuard("testimonials"),updateTestimonial);

/**
 * @route   DELETE /api/testimonials/:id
 * @desc    Delete a testimonial
 * @access  Admin
 */
router.delete("/:id", ...adminGuard("testimonials"),deleteTestimonial);

export default router;
