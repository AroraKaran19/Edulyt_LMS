import { Schema, model } from "mongoose";
import { CourseReview } from "../types/course-review";

const courseReviewSchema = new Schema<CourseReview>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    notHelpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
courseReviewSchema.index({ courseId: 1, rating: 1 });
courseReviewSchema.index({ userId: 1, courseId: 1 }, { unique: true }); // One review per user per course
courseReviewSchema.index({ createdAt: -1 });
courseReviewSchema.index({ rating: -1 });
courseReviewSchema.index({ title: "text", comment: "text" });

// Pre-save middleware to update timestamps
courseReviewSchema.pre("save", function (next) {
  if (this.isNew) {
    this.createdAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});

export const CourseReviewModel = model<CourseReview>("CourseReview", courseReviewSchema);
