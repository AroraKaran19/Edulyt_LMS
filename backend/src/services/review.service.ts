import { ReviewModel } from "../models/review.schema";
import { Review } from "../types";
import { AppError } from "../middlewares/error.middleware";
import mongoose from "mongoose";

/**
 * Get all reviews with pagination and filtering
 * @param page - Page number
 * @param limit - Items per page  
 * @param reviewableType - Filter by type (Course/Instructor)
 * @param reviewableId - Filter by specific course/instructor ID
 * @param minRating - Filter by minimum rating
 * @returns Promise<{reviews: Review[], total: number, page: number, totalPages: number}>
 */
export const getAllReviews = async (
  page: number = 1,
  limit: number = 10,
  reviewableType?: string,
  reviewableId?: string,
  minRating?: number
): Promise<{
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Build query object
    const query: any = { isActive: true };

    if (reviewableType) {
      query.reviewableType = reviewableType;
    }

    if (reviewableId && mongoose.Types.ObjectId.isValid(reviewableId)) {
      query.reviewableId = reviewableId;
    }

    if (minRating) {
      query.rating = { $gte: minRating };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await ReviewModel.countDocuments(query);

    const reviews = await ReviewModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewableId', 'title fullName') // Populate course title or instructor name
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      reviews,
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Database error in getAllReviews:", error);
    throw new AppError("Failed to fetch reviews from database", 500);
  }
};

/**
 * Get reviews for a specific reviewable item (course/instructor)
 * @param reviewableType - Type (Course/Instructor)
 * @param reviewableId - ID of the course/instructor
 * @param page - Page number
 * @param limit - Items per page
 * @returns Promise<{reviews: Review[], total: number, averageRating: number}>
 */
export const getReviewsForItem = async (
  reviewableType: string,
  reviewableId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  reviews: Review[];
  total: number;
  averageRating: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Validate reviewableId format
    if (!mongoose.Types.ObjectId.isValid(reviewableId)) {
      throw new AppError("Invalid reviewable ID format", 400);
    }

    // Validate reviewableType
    if (!['Course', 'Instructor'].includes(reviewableType)) {
      throw new AppError("Invalid reviewable type. Must be 'Course' or 'Instructor'", 400);
    }

    const query = {
      reviewableType,
      reviewableId,
      isActive: true
    };

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count and average rating
    const [total, avgResult, reviews] = await Promise.all([
      ReviewModel.countDocuments(query),
      ReviewModel.aggregate([
        { $match: query },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } }
      ]),
      ReviewModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const averageRating = avgResult.length > 0 ? Number(avgResult[0].averageRating.toFixed(1)) : 0;
    const totalPages = Math.ceil(total / limit);

    return {
      reviews,
      total,
      averageRating,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Database error in getReviewsForItem:", error);
    throw new AppError("Failed to fetch reviews for item", 500);
  }
};

/**
 * Get review by ID
 * @param reviewId - Review ID
 * @returns Promise<Review | null>
 */
export const getReviewById = async (reviewId: string): Promise<Review | null> => {
  try {
    // Validate reviewId format
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError("Invalid review ID format", 400);
    }

    const review = await ReviewModel.findById(reviewId)
      .populate('reviewableId', 'title fullName')
      .lean();

    return review;
  } catch (error) {
    console.error("Database error in getReviewById:", error);
    throw new AppError("Failed to fetch review from database", 500);
  }
};

/**
 * Create a new review
 * @param reviewData - Review data
 * @returns Promise<{success: boolean, reviewId: string, message: string}>
 */
export const createReview = async (reviewData: Partial<Review>) => {
  try {
    // Validate required fields
    if (!reviewData.name || !reviewData.rating || !reviewData.comment || !reviewData.reviewableType || !reviewData.reviewableId) {
      throw new AppError("Missing required fields: name, rating, comment, reviewableType, reviewableId", 400);
    }

    // Validate reviewableId format
    if (!mongoose.Types.ObjectId.isValid(reviewData.reviewableId as string)) {
      throw new AppError("Invalid reviewable ID format", 400);
    }

    // Validate reviewableType
    if (!['Course', 'Instructor'].includes(reviewData.reviewableType)) {
      throw new AppError("Invalid reviewable type. Must be 'Course' or 'Instructor'", 400);
    }

    // Validate rating
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const newReview = new ReviewModel({
      ...reviewData,
      isActive: true,
    });

    await newReview.validate();
    await newReview.save();

    return {
      success: true,
      reviewId: newReview._id,
      message: "Review created successfully",
    };
  } catch (error) {
    console.error("Database error in createReview:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    throw new AppError("Failed to create review", 500);
  }
};

/**
 * Update review
 * @param reviewId - Review ID
 * @param updateData - Review update data
 * @returns Promise<{success: boolean, message: string}>
 */
export const updateReview = async (
  reviewId: string,
  updateData: Partial<Review>
): Promise<{success: boolean, message: string}> => {
  try {
    // Validate reviewId format
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError("Invalid review ID format", 400);
    }

    // Remove fields that shouldn't be updated
    const { _id, reviewableType, reviewableId, createdAt, ...allowedUpdateData } = updateData;

    if (Object.keys(allowedUpdateData).length === 0) {
      throw new AppError("No valid fields provided for update", 400);
    }

    // Validate rating if provided
    if (allowedUpdateData.rating && (allowedUpdateData.rating < 1 || allowedUpdateData.rating > 5)) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const updateResult = await ReviewModel.findByIdAndUpdate(
      reviewId,
      {
        ...allowedUpdateData,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateResult) {
      throw new AppError("Review not found", 404);
    }

    return {
      success: true,
      message: "Review updated successfully",
    };
  } catch (error) {
    console.error("Database error in updateReview:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      throw new AppError(`Validation failed: ${validationErrors}`, 400);
    }
    
    throw new AppError("Failed to update review", 500);
  }
};

/**
 * Delete review (soft delete)
 * @param reviewId - Review ID
 * @returns Promise<{success: boolean, message: string}>
 */
export const deleteReview = async (reviewId: string): Promise<{success: boolean, message: string}> => {
  try {
    // Validate reviewId format
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError("Invalid review ID format", 400);
    }

    const deleteResult = await ReviewModel.findByIdAndUpdate(
      reviewId,
      {
        isActive: false,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!deleteResult) {
      throw new AppError("Review not found", 404);
    }

    return {
      success: true,
      message: "Review deleted successfully",
    };
  } catch (error) {
    console.error("Database error in deleteReview:", error);
    throw new AppError("Failed to delete review", 500);
  }
};

/**
 * Get review statistics for a reviewable item
 * @param reviewableType - Type (Course/Instructor)
 * @param reviewableId - ID of the course/instructor
 * @returns Promise<{averageRating: number, totalReviews: number, ratingDistribution: object}>
 */
export const getReviewStats = async (
  reviewableType: string,
  reviewableId: string
): Promise<{
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}> => {
  try {
    // Validate reviewableId format
    if (!mongoose.Types.ObjectId.isValid(reviewableId)) {
      throw new AppError("Invalid reviewable ID format", 400);
    }

    const query = {
      reviewableType,
      reviewableId,
      isActive: true
    };

    const [stats, distribution] = await Promise.all([
      ReviewModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 }
          }
        }
      ]),
      ReviewModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const averageRating = stats.length > 0 ? Number(stats[0].averageRating.toFixed(1)) : 0;
    const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

    // Create rating distribution object
    const ratingDistribution: { [key: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = 0;
    }
    
    distribution.forEach(item => {
      ratingDistribution[item._id] = item.count;
    });

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  } catch (error) {
    console.error("Database error in getReviewStats:", error);
    throw new AppError("Failed to fetch review statistics", 500);
  }
};
