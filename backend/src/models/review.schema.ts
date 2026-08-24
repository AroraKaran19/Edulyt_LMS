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
    approved: { type: Boolean, default: false, required: true }, // Requires instructor/admin approval
    reviewableType: {
      type: String,
      required: true,
      enum: ["Course", "Instructor", "Internship"],
    },
    reviewableId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "reviewableType",
    },
    internshipBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ reviewableId: 1, isActive: 1, approved: 1 }); // For fetching active approved reviews by course
reviewSchema.index({
  reviewableType: 1,
  reviewableId: 1,
  internshipBatchId: 1,
});
reviewSchema.index({ approved: 1, createdAt: -1 }); // For filtering by approval status
reviewSchema.index({ rating: 1 }); // For sorting/filtering by rating
reviewSchema.index({ comment: 1 }); // For searching reviews by comment

// Keyed lookups by author: the role-change purge and the account-deletion
// cascade both delete by `userId`, which was otherwise a collection scan.
reviewSchema.index({ userId: 1 });
reviewSchema.index({ createdAt: -1 }); // For listing reviews by creation date
reviewSchema.index({ updatedAt: -1 }); // For listing reviews by update date

const ReviewModel = mongoose.model<Review>("Review", reviewSchema);

export default ReviewModel;
