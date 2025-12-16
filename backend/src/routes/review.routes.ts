import { Router } from "express";
import {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getReviewsByReviewable,
  approveReview,
  rejectReview,
} from "../controllers/review.controller";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";

const router = Router();

// ===================
// Public Routes
// ===================

/**
 * @route   GET /api/reviews/reviewable/:reviewableType/:reviewableId
 * @desc    Get reviews for a specific course or instructor
 * @access  Public
 */
router.get(
  "/reviews/reviewable/:reviewableType/:reviewableId",
  getReviewsByReviewable
);

// ===================
// Protected Routes
// ===================

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews with optional filters
 * @access  Authenticated Users
 */
router.get("/reviews", verifyUser, getAllReviews);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get a review by ID
 * @access  Authenticated Users
 */
router.get("/reviews/:id", verifyUser, getReviewById);

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Authenticated Users
 */
router.post("/reviews", verifyUser, createReview);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review
 * @access  Authenticated Users (Owner only)
 */
router.put("/reviews/:id", verifyUser, updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Authenticated Users (Owner only)
 */
router.delete("/reviews/:id", verifyUser, deleteReview);

// ===================
// Admin Routes
// ===================

/**
 * @route   GET /api/reviews/admin
 * @desc    Get all reviews for admin (with full data)
 * @access  Admin
 */
router.get("/reviews/admin", verifyUser, verifyAdmin, getAllReviews);

/**
 * @route   GET /api/reviews/admin/:id
 * @desc    Get a review by ID for admin (with full data)
 * @access  Admin
 */
router.get("/reviews/admin/:id", verifyUser, verifyAdmin, getReviewById);

/**
 * @route   PUT /api/reviews/admin/:id
 * @desc    Update a review (Admin can update any review)
 * @access  Admin
 */
router.put("/reviews/admin/:id", verifyUser, verifyAdmin, updateReview);

/**
 * @route   DELETE /api/reviews/admin/:id
 * @desc    Delete a review (Admin can delete any review)
 * @access  Admin
 */
router.delete("/reviews/admin/:id", verifyUser, verifyAdmin, deleteReview);

/**
 * @route   PATCH /api/reviews/admin/:id/approve
 * @desc    Approve a review (Admin/Instructor only)
 * @access  Admin
 */
router.patch("/reviews/admin/:id/approve", verifyUser, verifyAdmin, approveReview);

/**
 * @route   PATCH /api/reviews/admin/:id/reject
 * @desc    Reject/Un-approve a review (Admin/Instructor only)
 * @access  Admin
 */
router.patch("/reviews/admin/:id/reject", verifyUser, verifyAdmin, rejectReview);

export default router;
