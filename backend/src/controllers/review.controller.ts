import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  getAllReviewsService,
  getReviewByIdService,
  createReviewService,
  updateReviewService,
  deleteReviewService,
  getReviewsByReviewableService,
  approveReviewService,
  rejectReviewService,
} from "../services/review.services";

export const getAllReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      reviewableType,
      reviewableId,
      rating,
      approved,
    } = req.query;
    const isAdmin = req.user?.userType === "admin";

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await getAllReviewsService(
      Number(page),
      Number(limit),
      String(search),
      reviewableType as string,
      reviewableId as string,
      rating ? Number(rating) : undefined,
      isAdmin,
      approved !== undefined ? approved === "true" : undefined
    );

    if (!result || result.reviews.length === 0) {
      sendSuccessResponse(res, [], "No reviews found", 200);
      return;
    }

    sendSuccessResponse(res, result, "Reviews fetched successfully", 200);
    return;
  }
);

export const getReviewById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const isAdmin = req.user?.userType === "admin";

    if (!id) {
      throw new AppError("Review ID is required", 400);
    }

    const result = await getReviewByIdService(id, isAdmin);
    if (!result) {
      sendSuccessResponse(res, [], "Review not found", 200);
      return;
    }

    sendSuccessResponse(res, result, "Review fetched successfully", 200);
    return;
  }
);

export const createReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { rating, comment, reviewableType, reviewableId } = req.body;
    const user = req.user;

    if (!user?._id || !rating || !comment || !reviewableType || !reviewableId) {
      throw new AppError(
        "User ID, rating, comment, reviewable type, and reviewable ID are required",
        400
      );
    }

    if (!["Course", "Instructor"].includes(reviewableType)) {
      throw new AppError(
        "Reviewable type must be either 'Course' or 'Instructor'",
        400
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new AppError("Rating must be an integer between 1 and 5", 400);
    }

    const result = await createReviewService({
      userId: user._id,
      rating,
      comment,
      reviewableType,
      reviewableId,
    });

    if (!result) {
      throw new AppError("Failed to create review", 500);
    }

    sendSuccessResponse(res, result, "Review created successfully", 201);
    return;
  }
);

export const updateReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = req.user;
    const isAdmin = req.user?.userType === "admin";

    if (!id) {
      throw new AppError("Review ID is required", 400);
    }

    if (!user?._id) {
      throw new AppError("User ID is required", 400);
    }

    if (!rating && !comment) {
      throw new AppError(
        "At least one field (rating or comment) is required for update",
        400
      );
    }

    if (rating && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
      throw new AppError("Rating must be an integer between 1 and 5", 400);
    }

    const result = await updateReviewService(
      id,
      { rating, comment },
      user._id,
      isAdmin
    );

    if (!result) {
      throw new AppError("Failed to update review or review not found", 500);
    }

    sendSuccessResponse(res, result, "Review updated successfully", 200);
    return;
  }
);

export const deleteReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const isAdmin = req.user?.userType === "admin";

    if (!id) {
      throw new AppError("Review ID is required", 400);
    }

    if (!user?._id) {
      throw new AppError("User ID is required", 400);
    }

    const result = await deleteReviewService(id, user._id, isAdmin);

    if (!result) {
      throw new AppError("Failed to delete review or review not found", 500);
    }

    sendSuccessResponse(res, result, "Review deleted successfully", 200);
    return;
  }
);

export const getReviewsByReviewable = asyncHandler(
  async (req: Request, res: Response) => {
    const { reviewableType, reviewableId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    if (!reviewableType || !reviewableId) {
      throw new AppError("Reviewable type and ID are required", 400);
    }

    if (!["Course", "Instructor"].includes(reviewableType)) {
      throw new AppError(
        "Reviewable type must be either 'Course' or 'Instructor'",
        400
      );
    }

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await getReviewsByReviewableService(
      reviewableType as "Course" | "Instructor",
      reviewableId,
      Number(page),
      Number(limit),
      rating ? Number(rating) : undefined
    );

    sendSuccessResponse(res, result, "Reviews fetched successfully", 200);
    return;
  }
);

// Approve review (instructor/admin only)
export const approveReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Review ID is required", 400);
    }

    const result = await approveReviewService(id);

    if (!result) {
      throw new AppError("Review not found", 404);
    }

    sendSuccessResponse(res, result, "Review approved successfully", 200);
    return;
  }
);

// Reject/Un-approve review (instructor/admin only)
export const rejectReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Review ID is required", 400);
    }

    const result = await rejectReviewService(id);

    if (!result) {
      throw new AppError("Review not found", 404);
    }

    sendSuccessResponse(res, result, "Review rejected successfully", 200);
    return;
  }
);