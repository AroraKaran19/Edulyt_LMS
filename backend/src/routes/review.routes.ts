import {
  getAllReviews,
  getReviewsForItem,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getReviewStats,
  bulkUpdateReviewStatus,
} from "../controllers/review.controller";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews with pagination and filtering
 * @access  Public
 * @params
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - reviewableType: Filter by type (Course/Instructor)
 *   - reviewableId: Filter by specific course/instructor ID
 *   - minRating: Filter by minimum rating
 * @example
 *   GET /api/reviews?page=1&limit=10&reviewableType=Course&minRating=4
 */
router.get("/", getAllReviews);

/**
 * @route   GET /api/reviews/:reviewableType/:reviewableId
 * @desc    Get reviews for a specific course or instructor
 * @access  Public
 * @params
 *   - reviewableType: Type (Course/Instructor)
 *   - reviewableId: ID of the course/instructor
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 * @example
 *   GET /api/reviews/Course/64a1b2c3d4e5f6789012345?page=1&limit=5
 */
router.get("/:reviewableType/:reviewableId", getReviewsForItem);

/**
 * @route   GET /api/reviews/stats/:reviewableType/:reviewableId
 * @desc    Get review statistics for a course or instructor
 * @access  Public
 * @params
 *   - reviewableType: Type (Course/Instructor)
 *   - reviewableId: ID of the course/instructor
 * @example
 *   GET /api/reviews/stats/Course/64a1b2c3d4e5f6789012345
 */
router.get("/stats/:reviewableType/:reviewableId", getReviewStats);

/**
 * @route   GET /api/reviews/id/:reviewId
 * @desc    Get review by ID
 * @access  Public
 * @params
 *   - reviewId: Review ID
 * @example
 *   GET /api/reviews/id/64a1b2c3d4e5f6789012345
 */
router.get("/id/:reviewId", getReviewById);

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Public (should be protected with auth middleware in production)
 * @body
 *   - name: Reviewer name (required)
 *   - rating: Rating 1-5 (required)
 *   - comment: Review comment (required)
 *   - reviewableType: Type "Course" or "Instructor" (required)
 *   - reviewableId: ID of course/instructor (required)
 *   - profileImage: Profile image URL (optional)
 *   - currentRole: Current role (optional)
 *   - currentCompany: Current company (optional)
 *   - linkedin: LinkedIn profile URL (optional)
 * @example
 *   POST /api/reviews
 *   Body: {
 *     "name": "John Doe",
 *     "rating": 5,
 *     "comment": "Excellent course!",
 *     "reviewableType": "Course",
 *     "reviewableId": "64a1b2c3d4e5f6789012345",
 *     "currentRole": "Software Developer",
 *     "currentCompany": "Tech Corp"
 *   }
 */
router.post("/", createReview);

/**
 * @route   PUT /api/reviews/:reviewId
 * @desc    Update review
 * @access  Admin/Review Owner
 * @params
 *   - reviewId: Review ID
 * @body    Review update data (name, rating, comment, etc.)
 * @example
 *   PUT /api/reviews/64a1b2c3d4e5f6789012345
 *   Body: {
 *     "rating": 4,
 *     "comment": "Updated comment"
 *   }
 */
router.put("/:reviewId", updateReview);

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete review (soft delete)
 * @access  Admin/Review Owner
 * @params
 *   - reviewId: Review ID
 * @example
 *   DELETE /api/reviews/64a1b2c3d4e5f6789012345
 */
router.delete("/:reviewId", deleteReview);

/**
 * @route   PUT /api/reviews/bulk/status
 * @desc    Bulk update review status (for admin)
 * @access  Admin
 * @body
 *   - reviewIds: Array of review IDs
 *   - isActive: Boolean status to set
 * @example
 *   PUT /api/reviews/bulk/status
 *   Body: {
 *     "reviewIds": ["64a1b2c3d4e5f6789012345", "64a1b2c3d4e5f6789012346"],
 *     "isActive": false
 *   }
 */
router.put("/bulk/status", bulkUpdateReviewStatus);

export default router;
