import express from "express";
import CourseReviewController from "../controllers/course-review.controller";
import { verifyUser } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * @route   POST /api/reviews
 * @desc    Create a new course review
 * @access  Private (user - enrolled in course)
 * @body    { courseId, rating, title, comment, isAnonymous? }
 * @return  Review object
 */
router.post(
  "/",
  verifyUser,
  CourseReviewController.createReview
);

/**
 * @route   GET /api/reviews
 * @desc    Get reviews with filters and pagination
 * @access  Private (user)
 * @query   courseId?, userId?, rating?, isAnonymous?, search?, dateFrom?, dateTo?, page?, limit?
 * @return  Array of reviews with pagination
 */
router.get(
  "/",
  verifyUser,
  CourseReviewController.getReviews
);

/**
 * @route   GET /api/reviews/user
 * @desc    Get user's reviews
 * @access  Private (user)
 * @query   page?, limit?
 * @return  Array of user's reviews with pagination
 */
router.get(
  "/user",
  verifyUser,
  CourseReviewController.getUserReviews
);

/**
 * @route   GET /api/reviews/course/:courseId
 * @desc    Get course reviews
 * @access  Private (user)
 * @query   page?, limit?, rating?
 * @return  Array of course reviews with pagination
 */
router.get(
  "/course/:courseId",
  verifyUser,
  CourseReviewController.getCourseReviews
);

/**
 * @route   GET /api/reviews/stats/:courseId
 * @desc    Get review statistics for a course
 * @access  Private (user)
 * @return  Review statistics
 */
router.get(
  "/stats/:courseId",
  verifyUser,
  CourseReviewController.getReviewStats
);

/**
 * @route   GET /api/reviews/:reviewId
 * @desc    Get a single review with details
 * @access  Private (user)
 * @return  Review object
 */
router.get(
  "/:reviewId",
  verifyUser,
  CourseReviewController.getReviewById
);

/**
 * @route   PUT /api/reviews/:reviewId
 * @desc    Update a review
 * @access  Private (user - review owner)
 * @body    { rating?, title?, comment?, isAnonymous? }
 * @return  Updated review object
 */
router.put(
  "/:reviewId",
  verifyUser,
  CourseReviewController.updateReview
);

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private (user - review owner)
 * @return  Success message
 */
router.delete(
  "/:reviewId",
  verifyUser,
  CourseReviewController.deleteReview
);

/**
 * @route   POST /api/reviews/vote
 * @desc    Vote on a review (helpful/not helpful)
 * @access  Private (user - enrolled in course)
 * @body    { reviewId, voteType }
 * @return  Success message
 */
router.post(
  "/vote",
  verifyUser,
  CourseReviewController.voteOnReview
);

export default router;
