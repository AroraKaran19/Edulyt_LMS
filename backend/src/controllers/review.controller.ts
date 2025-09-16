import { Request, Response } from "express";
import {
  getAllReviews as getAllReviewsService,
  getReviewsForItem as getReviewsForItemService,
  getReviewById as getReviewByIdService,
  createReview as createReviewService,
  updateReview as updateReviewService,
  deleteReview as deleteReviewService,
  getReviewStats as getReviewStatsService,
} from "../services/review.service";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";

/**
 * Get all reviews with pagination and filtering
 */
export const getAllReviews = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { 
      page = 1, 
      limit = 10, 
      reviewableType, 
      reviewableId, 
      minRating 
    } = req.query;

    const reviews = await getAllReviewsService(
      Number(page),
      Number(limit),
      reviewableType as string,
      reviewableId as string,
      minRating ? Number(minRating) : undefined
    );

    sendSuccessResponse(res, reviews, "Reviews retrieved successfully", 200);
  }
);

/**
 * Get reviews for a specific course or instructor
 */
export const getReviewsForItem = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { reviewableType, reviewableId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!reviewableType || !reviewableId) {
      throw new AppError("Reviewable type and ID are required", 400);
    }

    const reviews = await getReviewsForItemService(
      reviewableType,
      reviewableId,
      Number(page),
      Number(limit)
    );

    sendSuccessResponse(res, reviews, "Reviews retrieved successfully", 200);
  }
);

/**
 * Get review by ID
 */
export const getReviewById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { reviewId } = req.params;

    if (!reviewId) {
      throw new AppError("Review ID is required", 400);
    }

    const review = await getReviewByIdService(reviewId);

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    sendSuccessResponse(res, { review }, "Review retrieved successfully", 200);
  }
);

/**
 * Create a new review
 */
export const createReview = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const reviewData = req.body;

    if (!reviewData) {
      throw new AppError("Review data is required", 400);
    }

    console.log("📝 Creating review for:", {
      reviewableType: reviewData.reviewableType,
      reviewableId: reviewData.reviewableId,
      rating: reviewData.rating
    });

    const result = await createReviewService(reviewData);

    sendSuccessResponse(
      res,
      { reviewId: result.reviewId },
      result.message,
      201
    );
  }
);

/**
 * Update review
 */
export const updateReview = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { reviewId } = req.params;
    const updateData = req.body;

    if (!reviewId) {
      throw new AppError("Review ID is required", 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new AppError("Update data is required", 400);
    }

    console.log("📝 Updating review:", reviewId);

    const result = await updateReviewService(reviewId, updateData);

    sendSuccessResponse(
      res,
      { reviewId, updated: true },
      result.message,
      200
    );
  }
);

/**
 * Delete review (soft delete)
 */
export const deleteReview = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { reviewId } = req.params;

    if (!reviewId) {
      throw new AppError("Review ID is required", 400);
    }

    console.log("🗑️ Deleting review:", reviewId);

    const result = await deleteReviewService(reviewId);

    sendSuccessResponse(
      res,
      { reviewId, deleted: true },
      result.message,
      200
    );
  }
);

/**
 * Get review statistics for a course or instructor
 */
export const getReviewStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { reviewableType, reviewableId } = req.params;

    if (!reviewableType || !reviewableId) {
      throw new AppError("Reviewable type and ID are required", 400);
    }

    const stats = await getReviewStatsService(reviewableType, reviewableId);

    sendSuccessResponse(res, stats, "Review statistics retrieved successfully", 200);
  }
);

/**
 * Bulk update review status (for admin)
 */
export const bulkUpdateReviewStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { reviewIds, isActive } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      throw new AppError("Review IDs array is required", 400);
    }

    if (typeof isActive !== 'boolean') {
      throw new AppError("isActive must be a boolean", 400);
    }

    console.log(`📝 Bulk updating ${reviewIds.length} reviews status to ${isActive}`);

    let updatedCount = 0;
    const errors: string[] = [];

    for (const reviewId of reviewIds) {
      try {
        await updateReviewService(reviewId, { isActive });
        updatedCount++;
      } catch (error) {
        errors.push(`Failed to update review ${reviewId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    sendSuccessResponse(
      res,
      { 
        updatedCount, 
        totalRequested: reviewIds.length,
        errors: errors.length > 0 ? errors : undefined
      },
      `Successfully updated ${updatedCount} out of ${reviewIds.length} reviews`,
      200
    );
  }
);
