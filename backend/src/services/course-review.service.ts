import { AppError } from "../middlewares/error.middleware";
import { CourseReviewModel } from "../models/course-review.schema";
import { UserModel } from "../models/user.schema";
import { CourseModel } from "../models/course.schema";
import {
  CourseReview,
  CourseReviewWithDetails,
  ReviewStats,
  ReviewFilters,
  ReviewPagination,
  ReviewResponse,
} from "../types/course-review";
import mongoose from "mongoose";

export class CourseReviewService {
  /**
   * Create a new course review
   */
  static async createReview(
    courseId: string,
    userId: string,
    reviewData: {
      rating: number;
      title: string;
      comment: string;
      isAnonymous?: boolean;
    }
  ): Promise<CourseReview> {
    try {
      // Verify course exists
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new AppError("Course not found", 404);
      }

      // Verify user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Check if user is enrolled in the course
      const enrollment = await mongoose.model("Enrollment").findOne({
        userId,
        courseId,
        status: { $in: ["active", "completed"] },
      });

      if (!enrollment) {
        throw new AppError(
          "User must be enrolled in the course to write a review",
          403
        );
      }

      // Check if user already reviewed this course
      const existingReview = await CourseReviewModel.findOne({
        courseId,
        userId,
      });

      if (existingReview) {
        throw new AppError("User has already reviewed this course", 400);
      }

      const review = new CourseReviewModel({
        courseId,
        userId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        isAnonymous: reviewData.isAnonymous || false,
      });

      await review.save();
      return review;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create review", 500);
    }
  }

  /**
   * Get reviews with filters and pagination
   */
  static async getReviews(
    filters: ReviewFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<ReviewResponse<CourseReviewWithDetails>> {
    try {
      const query: any = {};

      // Apply filters
      if (filters.courseId) query.courseId = filters.courseId;
      if (filters.userId) query.userId = filters.userId;
      if (filters.rating) query.rating = filters.rating;
      if (filters.isAnonymous !== undefined)
        query.isAnonymous = filters.isAnonymous;
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
        if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
      }
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: "i" } },
          { comment: { $regex: filters.search, $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;

      const reviews = await CourseReviewModel.find(query)
        .populate("userId", "firstName lastName profilePicture userType")
        .populate("courseId", "title thumbnail")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await CourseReviewModel.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      const pagination: ReviewPagination = {
        page,
        limit,
        total,
        totalPages,
      };

      return {
        data: reviews as unknown as CourseReviewWithDetails[],
        pagination,
      };
    } catch (error) {
      throw new AppError("Failed to fetch reviews", 500);
    }
  }

  /**
   * Get a single review with details
   */
  static async getReviewById(
    reviewId: string
  ): Promise<CourseReviewWithDetails> {
    try {
      const review = await CourseReviewModel.findById(reviewId)
        .populate("userId", "firstName lastName profilePicture userType")
        .populate("courseId", "title thumbnail")
        .lean();

      if (!review) {
        throw new AppError("Review not found", 404);
      }

      return review as unknown as CourseReviewWithDetails;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to fetch review", 500);
    }
  }

  /**
   * Update a review
   */
  static async updateReview(
    reviewId: string,
    userId: string,
    updateData: {
      rating?: number;
      title?: string;
      comment?: string;
      isAnonymous?: boolean;
    }
  ): Promise<CourseReview> {
    try {
      const review = await CourseReviewModel.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      // Check if user is the review owner
      if (review.userId?.toString() !== userId) {
        throw new AppError("Not authorized to update this review", 403);
      }

      const updatedReview = await CourseReviewModel.findByIdAndUpdate(
        reviewId,
        updateData,
        { new: true }
      );

      return updatedReview!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update review", 500);
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      const review = await CourseReviewModel.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      // Check if user is the review owner
      if (review.userId?.toString() !== userId) {
        throw new AppError("Not authorized to delete this review", 403);
      }

      await CourseReviewModel.findByIdAndDelete(reviewId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete review", 500);
    }
  }

  /**
   * Vote on a review (helpful/not helpful)
   */
  static async voteOnReview(
    reviewId: string,
    userId: string,
    voteType: "helpful" | "not_helpful" | "remove"
  ): Promise<void> {
    try {
      const review = await CourseReviewModel.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      // Check if user is enrolled in the course
      const enrollment = await mongoose.model("Enrollment").findOne({
        userId,
        courseId: review.courseId,
        status: { $in: ["active", "completed"] },
      });

      if (!enrollment) {
        throw new AppError(
          "User must be enrolled in the course to vote on reviews",
          403
        );
      }

      const updateField =
        voteType === "helpful" ? "helpfulVotes" : "notHelpfulVotes";
      const increment = voteType === "remove" ? -1 : 1;

      await CourseReviewModel.findByIdAndUpdate(reviewId, {
        $inc: { [updateField]: increment },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to ${voteType} review`, 500);
    }
  }

  /**
   * Get review statistics for a course
   */
  static async getReviewStats(courseId: string): Promise<ReviewStats> {
    try {
      const [totalReviews, averageRating, ratingDistribution, recentReviews] =
        await Promise.all([
          CourseReviewModel.countDocuments({ courseId }),
          CourseReviewModel.aggregate([
            { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
            { $group: { _id: null, average: { $avg: "$rating" } } },
          ]),
          CourseReviewModel.aggregate([
            { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
            { $group: { _id: "$rating", count: { $sum: 1 } } },
          ]),
          CourseReviewModel.countDocuments({
            courseId,
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          }),
        ]);

      // Format rating distribution
      const distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      ratingDistribution.forEach((item) => {
        distribution[item._id as keyof typeof distribution] = item.count;
      });

      return {
        totalReviews,
        averageRating: averageRating[0]?.average || 0,
        ratingDistribution: distribution,
        recentReviews,
      };
    } catch (error) {
      throw new AppError("Failed to fetch review statistics", 500);
    }
  }

  /**
   * Get user's reviews
   */
  static async getUserReviews(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ReviewResponse<CourseReviewWithDetails>> {
    try {
      const filters: ReviewFilters = { userId };
      return await this.getReviews(filters, page, limit);
    } catch (error) {
      throw new AppError("Failed to fetch user reviews", 500);
    }
  }

  /**
   * Get course reviews
   */
  static async getCourseReviews(
    courseId: string,
    page: number = 1,
    limit: number = 10,
    rating?: number
  ): Promise<ReviewResponse<CourseReviewWithDetails>> {
    try {
      const filters: ReviewFilters = { courseId, rating };
      return await this.getReviews(filters, page, limit);
    } catch (error) {
      throw new AppError("Failed to fetch course reviews", 500);
    }
  }
}
