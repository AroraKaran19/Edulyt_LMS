import { Review } from "@/types";
import mongoose from "mongoose";
import { validateLinkedinUrl, validateReview, validateUrl } from "./validators";

// ===================
// Review Schema
// ===================

const reviewSchema = new mongoose.Schema<Review>(
  {
    name: { type: String, required: true },
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
    profileImage: {
      type: String,
      required: false,
      validate: {
        validator: validateUrl,
        message: "Profile image must be a valid URL",
      },
    },
    currentRole: { type: String, required: true, default: "" },
    currentCompany: { type: String, required: true, default: "" },
    linkedin: {
      type: String,
      required: false,
      default: "",
      validate: {
        validator: validateLinkedinUrl,
        message: "Linkedin must be a valid LinkedIn profile URL or empty",
      },
    },
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
reviewSchema.index({ name: 1 }); // For searching reviews by name
reviewSchema.index({ comment: 1 }); // For searching reviews by comment

reviewSchema.index({ createdAt: -1 }); // For listing reviews by creation date
reviewSchema.index({ updatedAt: -1 }); // For listing reviews by update date

export default reviewSchema;
