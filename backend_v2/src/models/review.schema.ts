import { Review } from "../types/review";
import mongoose from "mongoose";
import { validateReview } from "./validators";

// ===================
// Review Schema
// ===================

const reviewSchema = new mongoose.Schema<Review>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    rating: {
      type: Number,
      required: true,
      validate: {
        validator: validateReview,
        message: "Rating must be a valid rating",
      },
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
    },
    comment: { type: String, required: true },
    isActive: { type: Boolean, default: true, required: true },
    reviewableType: {
      type: String,
      required: true,
      enum: ["Course", "Instructor"],
    },
    reviewableId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "reviewableType",
    },
  },
  { timestamps: true }
);

reviewSchema.index({ reviewableId: 1, isActive: 1 }); // For fetching active reviews by course
reviewSchema.index({ rating: 1 }); // For sorting/filtering by rating
reviewSchema.index({ comment: 1 }); // For searching reviews by comment

reviewSchema.index({ createdAt: -1 }); // For listing reviews by creation date
reviewSchema.index({ updatedAt: -1 }); // For listing reviews by update date

const ReviewModel = mongoose.model<Review>("Review", reviewSchema);

export default ReviewModel;
