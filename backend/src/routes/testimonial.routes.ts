import { Router } from "express";
import {
  getAllTestimonialsController,
  getTestimonialByIdController,
  createTestimonialController,
  updateTestimonialController,
  deleteTestimonialController,
  getTestimonialsByIdsController,
  getVerifiedTestimonialsController,
} from "../controllers/testimonial.controller";

const router = Router();

/**
 * @route   GET /api/testimonials
 * @desc    Get all testimonials with pagination and search
 * @access  Public
 */
router.get("/", getAllTestimonialsController);

/**
 * @route   GET /api/testimonials/verified
 * @desc    Get verified testimonials only
 * @access  Public
 */
router.get("/verified", getVerifiedTestimonialsController);

/**
 * @route   GET /api/testimonials/:id
 * @desc    Get testimonial by ID
 * @access  Public
 */
router.get("/:id", getTestimonialByIdController);

/**
 * @route   POST /api/testimonials
 * @desc    Create a new testimonial
 * @access  Admin
 */
router.post("/", createTestimonialController);

/**
 * @route   POST /api/testimonials/by-ids
 * @desc    Get testimonials by IDs array
 * @access  Public
 */
router.post("/by-ids", getTestimonialsByIdsController);

/**
 * @route   PUT /api/testimonials/:id
 * @desc    Update a testimonial
 * @access  Admin
 */
router.put("/:id", updateTestimonialController);

/**
 * @route   DELETE /api/testimonials/:id
 * @desc    Delete a testimonial
 * @access  Admin
 */
router.delete("/:id", deleteTestimonialController);

export default router;
