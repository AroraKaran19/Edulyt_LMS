import { Review } from "@/types/review";
import mongoose from "mongoose";

// ===================
// Review Schema
// ===================

const reviewSchema = new mongoose.Schema<Review>(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    profileImage: { type: String, required: false },
    currentRole: { type: String, required: true },
    currentCompany: { type: String, required: true },
    linkedin: { type: String, required: false },
    isActive: { type: Boolean, default: true, required: true },
    reviewableType: {
      type: String,
      required: true,
      enum: ["course", "instructor"],
    },
    reviewableId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

reviewSchema.index({ reviewableId: 1, isActive: 1 }); // For fetching active reviews by course
reviewSchema.index({ rating: 1 }); // For sorting/filtering by rating
reviewSchema.index({ name: 1 }); // For searching reviews by name
reviewSchema.index({ comment: 1 }); // For searching reviews by comment

reviewSchema.index({ createdAt: -1 }); // For listing reviews by creation date
reviewSchema.index({ updatedAt: -1 }); // For listing reviews by update date

export default reviewSchema;
