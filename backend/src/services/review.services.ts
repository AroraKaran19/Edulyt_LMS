import { ReviewModel, CourseModel } from "../models";
import { Review } from "../types/review";

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
  isAdmin?: boolean
): Promise<{
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  let filters: any = {};

  // Only show active reviews for non-admin users
  if (!isAdmin) {
    filters.isActive = true;
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
    .populate("userId", isAdmin ? "-__v" : "name email profilePicture")
    .populate("reviewableId", "title name")
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
    .where(isAdmin ? {} : { isActive: true })
    .populate("userId", isAdmin ? "-__v" : "name email profilePicture")
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
    .populate("userId", "name email profilePicture")
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
    .populate("userId", isAdmin ? "-__v" : "name email profilePicture")
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
    .populate("userId", "name email profilePicture")
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
