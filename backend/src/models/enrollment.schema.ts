import mongoose from "mongoose";
import {
  Enrollment,
  EnrollmentProgressSummary,
} from "../types/enrollment";

// Simplified enrollment progress sub-schema
const enrollmentProgressSchema = new mongoose.Schema<EnrollmentProgressSummary>(
  {
    overallCompletion: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    totalModules: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    completedModules: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalLessons: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    completedLessons: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastActivityAt: {
      type: Date,
      required: false,
    },
  },
  { _id: false }
);

// Main enrollment schema
const enrollmentSchema = new mongoose.Schema<Enrollment>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    enrolledAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "completed", "dropped", "paused"],
      default: "active",
      index: true,
    },
    progress: {
      type: enrollmentProgressSchema,
      required: true,
      default: () => ({
        overallCompletion: 0,
        totalModules: 0,
        completedModules: 0,
        totalLessons: 0,
        completedLessons: 0,
      }),
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // Optional metadata
    enrollmentSource: {
      type: String,
      enum: ["direct", "gift", "promotion"],
      default: "direct",
    },
    giftFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    promotionCode: {
      type: String,
      required: false,
    },

    // Completion tracking
    completedAt: {
      type: Date,
      required: false,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateIssuedAt: {
      type: Date,
      required: false,
    },

    // Analytics
    totalTimeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true }); // Prevent duplicate enrollments
enrollmentSchema.index({ courseId: 1, status: 1 }); // Course enrollments by status
enrollmentSchema.index({ userId: 1, status: 1 }); // User enrollments by status
enrollmentSchema.index({ enrolledAt: -1 }); // Recent enrollments
enrollmentSchema.index({ lastActivityAt: -1 }); // Recent activity
enrollmentSchema.index({ "progress.overallCompletion": -1 }); // Sort by completion

// Pre-save middleware to update lastUpdated
enrollmentSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

// Pre-update middleware to update lastUpdated
enrollmentSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function (next) {
    this.set({ lastUpdated: new Date() });
    next();
  }
);

// Static methods for common queries
enrollmentSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId }).populate("courseId", "title thumbnail category");
};

enrollmentSchema.statics.findByCourse = function (courseId: string) {
  return this.find({ courseId }).populate(
    "userId",
    "firstName lastName email profilePicture"
  );
};

enrollmentSchema.statics.findActiveByUser = function (userId: string) {
  return this.find({ userId, status: "active" }).populate(
    "courseId",
    "title thumbnail category"
  );
};

enrollmentSchema.statics.findCompletedByUser = function (userId: string) {
  return this.find({ userId, status: "completed" }).populate(
    "courseId",
    "title thumbnail category"
  );
};

enrollmentSchema.statics.getEnrollmentStats = function (courseId: string) {
  return this.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgCompletion: { $avg: "$progress.overallCompletion" },
      },
    },
  ]);
};

// Instance methods
enrollmentSchema.methods.markAsCompleted = function () {
  this.status = "completed";
  this.completedAt = new Date();
  this.progress.overallCompletion = 100;
  this.progress.completedModules = this.progress.totalModules;
  this.progress.completedLessons = this.progress.totalLessons;
  return this.save();
};

export const EnrollmentModel = mongoose.model<Enrollment>(
  "Enrollment",
  enrollmentSchema
);
