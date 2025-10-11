import { Request, Response } from "express";
import { AppError, asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import { CourseReviewService } from "../services/course-review.service";
import { ReviewFilters } from "../types/course-review";

export class CourseReviewController {
  /**
   * Create a new course review
   * @param req - Express request object
   * @param res - Express response object
   */
  createReview = asyncHandler(async (req: Request, res: Response) => {
    const { courseId, rating, title, comment, isAnonymous } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!courseId || !rating || !title || !comment) {
      throw new AppError("Course ID, rating, title, and comment are required", 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const review = await CourseReviewService.createReview(courseId, userId, {
      rating,
      title,
      comment,
      isAnonymous,
    });

    sendSuccessResponse(
      res,
      { review },
      "Review created successfully",
      201
    );
  });

  /**
   * Get reviews with filters and pagination
   * @param req - Express request object
   * @param res - Express response object
   */
  getReviews = asyncHandler(async (req: Request, res: Response) => {
    const {
      courseId,
      userId,
      rating,
      isAnonymous,
      search,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = req.query;

    const filters: ReviewFilters = {
      courseId: courseId as string,
      userId: userId as string,
      rating: rating ? parseInt(rating as string) : undefined,
      isAnonymous: isAnonymous ? isAnonymous === "true" : undefined,
      search: search as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const result = await CourseReviewService.getReviews(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendSuccessResponse(
      res,
      result,
      "Reviews fetched successfully",
      200
    );
  });

  /**
   * Get a single review with details
   * @param req - Express request object
   * @param res - Express response object
   */
  getReviewById = asyncHandler(async (req: Request, res: Response) => {
    const { reviewId } = req.params;

    if (!reviewId) {
      throw new AppError("Review ID is required", 400);
    }

    const review = await CourseReviewService.getReviewById(reviewId);

    sendSuccessResponse(
      res,
      { review },
      "Review fetched successfully",
      200
    );
  });

  /**
   * Update a review
   * @param req - Express request object
   * @param res - Express response object
   */
  updateReview = asyncHandler(async (req: Request, res: Response) => {
    const { reviewId } = req.params;
    const { rating, title, comment, isAnonymous } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!reviewId) {
      throw new AppError("Review ID is required", 400);
    }

    if (rating && (rating < 1 || rating > 5)) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const review = await CourseReviewService.updateReview(reviewId, userId, {
      rating,
      title,
      comment,
      isAnonymous,
    });

    sendSuccessResponse(
      res,
      { review },
      "Review updated successfully",
      200
    );
  });

  /**
   * Delete a review
   * @param req - Express request object
   * @param res - Express response object
   */
  deleteReview = asyncHandler(async (req: Request, res: Response) => {
    const { reviewId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!reviewId) {
      throw new AppError("Review ID is required", 400);
    }

    await CourseReviewService.deleteReview(reviewId, userId);

    sendSuccessResponse(
      res,
      { deletedReviewId: reviewId },
      "Review deleted successfully",
      200
    );
  });

  /**
   * Vote on a review
   * @param req - Express request object
   * @param res - Express response object
   */
  voteOnReview = asyncHandler(async (req: Request, res: Response) => {
    const { reviewId, voteType } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!reviewId || !voteType) {
      throw new AppError("Review ID and vote type are required", 400);
    }

    if (!["helpful", "not_helpful", "remove"].includes(voteType)) {
      throw new AppError("Vote type must be 'helpful', 'not_helpful', or 'remove'", 400);
    }

    await CourseReviewService.voteOnReview(reviewId, userId, voteType as "helpful" | "not_helpful" | "remove");

    sendSuccessResponse(
      res,
      { reviewId, voteType },
      "Vote processed successfully",
      200
    );
  });

  /**
   * Get review statistics for a course
   * @param req - Express request object
   * @param res - Express response object
   */
  getReviewStats = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const stats = await CourseReviewService.getReviewStats(courseId);

    sendSuccessResponse(
      res,
      { stats },
      "Review statistics fetched successfully",
      200
    );
  });

  /**
   * Get user's reviews
   * @param req - Express request object
   * @param res - Express response object
   */
  getUserReviews = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    const result = await CourseReviewService.getUserReviews(
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendSuccessResponse(
      res,
      result,
      "User reviews fetched successfully",
      200
    );
  });

  /**
   * Get course reviews
   * @param req - Express request object
   * @param res - Express response object
   */
  getCourseReviews = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await CourseReviewService.getCourseReviews(
      courseId,
      parseInt(page as string),
      parseInt(limit as string),
      rating ? parseInt(rating as string) : undefined
    );

    sendSuccessResponse(
      res,
      result,
      "Course reviews fetched successfully",
      200
    );
  });
}

export default new CourseReviewController();
