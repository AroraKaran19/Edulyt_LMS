import mongoose from "mongoose";
import { ReviewModel, CourseModel } from "../models";
import { Review } from "../types/review";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Helper function to calculate and update course analytics
const updateCourseAnalytics = async (courseId: string): Promise<void> => {
  // Use aggregation for better performance
  const stats = await ReviewModel.aggregate([
    {
      $match: {
        reviewableId: courseId,
        reviewableType: "Course",
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const analytics = stats[0] || { averageRating: 0, totalReviews: 0 };

  await CourseModel.findByIdAndUpdate(
    courseId,
    {
      $set: {
        "analytics.averageRating":
          Math.round(analytics.averageRating * 10) / 10,
        "analytics.totalReviews": analytics.totalReviews,
      },
    },
    { new: true }
  );
};

export const getAllReviewsService = async (
  page: number,
  limit: number,
  search: string,
  reviewableType?: string,
  reviewableId?: string,
  rating?: number,
  isAdmin?: boolean,
  approved?: boolean
): Promise<{
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  let filters: any = {};

  // Only show active and approved reviews for non-admin users
  if (!isAdmin) {
    filters.isActive = true;
    filters.approved = true; // Only show approved reviews to non-admins
  } else {
    // Admin can filter by approval status
    if (approved !== undefined) {
      filters.approved = approved;
    }
  }

  // Search filter
  if (search) {
    filters.comment = { $regex: search, $options: "i" };
  }

  // Reviewable type filter
  if (reviewableType) {
    filters.reviewableType = reviewableType;
  }

  // Reviewable ID filter (course or instructor)
  if (reviewableId) {
    filters.reviewableId = reviewableId;
  }

  // Rating filter
  if (rating) {
    filters.rating = rating;
  }

  const reviews = await ReviewModel.find(filters)
    .populate("userId", isAdmin ? "-__v" : "firstName lastName email profilePicture")
    .populate("reviewableId", "title name slug")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await ReviewModel.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  return {
    reviews,
    total,
    totalPages,
    page,
  };
};

export const getReviewByIdService = async (
  id: string,
  isAdmin?: boolean
): Promise<Review | null> => {
  const review = await ReviewModel.findById(id)
    .where(isAdmin ? {} : { isActive: true, approved: true }) // Only show approved reviews to non-admins
    .populate("userId", isAdmin ? "-__v" : "firstName lastName email profilePicture")
    .populate("reviewableId", "title name");

  if (!review) {
    return null;
  }

  return review as Review;
};

export const createReviewService = async (reviewData: {
  userId: string;
  rating: number;
  comment: string;
  reviewableType: "Course" | "Instructor";
  reviewableId: string;
}): Promise<Review | null> => {
  // Check if user already reviewed this item
  const existingReview = await ReviewModel.findOne({
    userId: reviewData.userId,
    reviewableId: reviewData.reviewableId,
    reviewableType: reviewData.reviewableType,
  });

  if (existingReview) {
    throw new Error("You have already reviewed this item");
  }

  const review = new ReviewModel(reviewData);
  const savedReview = await review.save();

  if (!savedReview) {
    return null;
  }

  // If this is a course review, update course analytics and add review to course
  if (reviewData.reviewableType === "Course") {
    // Add review ID to course
    await CourseModel.findByIdAndUpdate(
      reviewData.reviewableId,
      {
        $push: { reviews: savedReview._id },
      },
      { new: true }
    );

    // Recalculate and update all analytics using aggregation
    await updateCourseAnalytics(reviewData.reviewableId);
  }

  // Populate user data
  const populatedReview = await ReviewModel.findById(savedReview._id)
    .populate("userId", "firstName lastName email profilePicture")
    .populate("reviewableId", "title name");

  return populatedReview as Review;
};

export const updateReviewService = async (
  id: string,
  updateData: { rating?: number; comment?: string },
  userId: string,
  isAdmin?: boolean
): Promise<Review | null> => {
  let query: any = { _id: id };

  // Non-admin users can only update their own reviews
  if (!isAdmin) {
    query.userId = userId;
  }

  // Get the review before updating to check if it's for a course
  const oldReview = await ReviewModel.findById(id);

  const review = await ReviewModel.findOneAndUpdate(query, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("userId", isAdmin ? "-__v" : "firstName lastName email profilePicture")
    .populate("reviewableId", "title name");

  if (!review) {
    return null;
  }

  // If rating was updated and it's a course review, recalculate analytics
  if (
    oldReview &&
    updateData.rating &&
    oldReview.reviewableType === "Course" &&
    oldReview.reviewableId
  ) {
    await updateCourseAnalytics(oldReview.reviewableId);
  }

  return review as Review;
};

export const deleteReviewService = async (
  id: string,
  userId: string,
  isAdmin?: boolean
): Promise<Review | null> => {
  let query: any = { _id: id };

  // Non-admin users can only delete their own reviews
  if (!isAdmin) {
    query.userId = userId;
  }

  // Get the review before deleting to update course analytics
  const review = await ReviewModel.findOne(query);

  if (!review) {
    return null;
  }

  // Delete the review
  await ReviewModel.findOneAndDelete(query);

  // If this is a course review, update course analytics
  if (review.reviewableType === "Course" && review.reviewableId) {
    // Remove review ID from course
    await CourseModel.findByIdAndUpdate(
      review.reviewableId,
      {
        $pull: { reviews: review._id },
      },
      { new: true }
    );

    // Recalculate and update all analytics using aggregation
    await updateCourseAnalytics(review.reviewableId);
  }

  return review as Review;
};

/** Approved course reviews for courses this instructor teaches. */
export const getInstructorCourseReviewsService = async (
  instructorUserId: string,
  page: number,
  limit: number,
  search: string
): Promise<{
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const empty = (): {
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
  } => ({
    reviews: [],
    total: 0,
    page: page > 0 ? page : 1,
    totalPages: 0,
  });

  if (!mongoose.Types.ObjectId.isValid(instructorUserId)) {
    return empty();
  }
  const oid = new mongoose.Types.ObjectId(instructorUserId);
  const owned = await CourseModel.find({ instructor: oid })
    .select("_id")
    .lean();
  const courseIds = owned.map((c) => c._id);
  if (courseIds.length === 0) {
    return empty();
  }

  const safePage = page > 0 ? page : 1;
  const safeLimit = Math.min(Math.max(limit || 20, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  const filters: Record<string, unknown> = {
    reviewableType: "Course",
    reviewableId: { $in: courseIds },
    approved: true,
    isActive: true,
  };
  const q = search?.trim();
  if (q) {
    filters.comment = { $regex: escapeRegex(q), $options: "i" };
  }

  const total = await ReviewModel.countDocuments(filters);
  const totalPages = Math.ceil(total / safeLimit) || 0;

  const raw = await ReviewModel.find(filters)
    .populate("userId", "firstName lastName email profilePicture")
    .populate("reviewableId", "title slug")
    .skip(skip)
    .limit(safeLimit)
    .sort({ createdAt: -1 })
    .lean();

  return {
    reviews: raw as Review[],
    total,
    page: safePage,
    totalPages,
  };
};

export const getReviewsByReviewableService = async (
  reviewableType: "Course" | "Instructor",
  reviewableId: string,
  page: number = 1,
  limit: number = 10,
  rating?: number
): Promise<{
  reviews: Review[];
  total: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}> => {
  const skip = (page - 1) * limit;

  let filters: any = {
    reviewableType,
    reviewableId,
    isActive: true,
  };

  if (rating) {
    filters.rating = rating;
  }

  const reviews = await ReviewModel.find(filters)
    .populate("userId", "firstName lastName email profilePicture")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await ReviewModel.countDocuments(filters);

  // Calculate average rating
  const ratingStats = await ReviewModel.aggregate([
    { $match: { reviewableType, reviewableId, isActive: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
  ]);

  const averageRating = ratingStats[0]?.averageRating || 0;

  // Calculate rating distribution
  const ratingDistribution: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  if (ratingStats[0]?.ratingDistribution) {
    ratingStats[0].ratingDistribution.forEach((rating: number) => {
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });
  }

  return {
    reviews,
    total,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    ratingDistribution,
  };
};

// Approve a review (instructor/admin only)
export const approveReviewService = async (
  id: string
): Promise<Review | null> => {
  const review = await ReviewModel.findByIdAndUpdate(
    id,
    { approved: true },
    { new: true, runValidators: true }
  )
    .populate("userId", "firstName lastName email profilePicture")
    .populate("reviewableId", "title name");

  if (!review) {
    return null;
  }

  return review as Review;
};

// Reject/Un-approve a review (instructor/admin only)
export const rejectReviewService = async (
  id: string
): Promise<Review | null> => {
  const review = await ReviewModel.findByIdAndUpdate(
    id,
    { approved: false },
    { new: true, runValidators: true }
  )
    .populate("userId", "firstName lastName email profilePicture")
    .populate("reviewableId", "title name");

  if (!review) {
    return null;
  }

  return review as Review;
};
