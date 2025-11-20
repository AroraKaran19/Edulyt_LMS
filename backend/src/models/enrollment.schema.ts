import mongoose from "mongoose";
import {
  Enrollment,
  EnrollmentProgressSummary,
  LastContentAccessed,
  PartialAccessControl,
  ModuleAccessControl,
  LessonAccessControl,
  ContentCompletion,
} from "../types";

// Enrollment Progress Summary Schema
const enrollmentProgressSummarySchema =
  new mongoose.Schema<EnrollmentProgressSummary>(
    {
      overallCompletion: { type: Number, default: 0, min: 0, max: 100 },
      totalModules: { type: Number, default: 0 },
      completedModules: { type: Number, default: 0 },
      totalLessons: { type: Number, default: 0 },
      completedLessons: { type: Number, default: 0 },
      lastActivityAt: { type: Date, default: Date.now },
    },
    { _id: false }
  );

// Content Completion Schema
const contentCompletionSchema = new mongoose.Schema<ContentCompletion>(
  {
    contentId: { type: String, required: true, index: true },
    completedAt: { type: Date, required: true, default: Date.now },
    moduleId: { type: String, required: false },
    lessonId: { type: String, required: false },
    contentType: {
      type: String,
      required: false,
      enum: ["video", "quiz", "document"],
    },
    timeSpent: { type: Number, default: 0 }, // Time spent in minutes
  },
  { _id: false }
);

// Last Content Accessed Schema
const lastContentAccessedSchema = new mongoose.Schema<LastContentAccessed>(
  {
    moduleId: { type: String, required: true },
    lessonId: { type: String, required: true },
    contentId: { type: String, required: true },
    contentType: {
      type: String,
      required: true,
      enum: ["video", "quiz", "document"],
    },
    lastPosition: { type: Number, default: 0 }, // For videos
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Partial Access Control Schemas
const lessonAccessControlSchema = new mongoose.Schema<LessonAccessControl>(
  {
    lessonId: { type: String, required: true },
    accessibleContentIds: { type: [String], default: [] },
  },
  { _id: false }
);

const moduleAccessControlSchema = new mongoose.Schema<ModuleAccessControl>(
  {
    moduleId: { type: String, required: true },
    accessibleLessons: { type: [lessonAccessControlSchema], default: [] },
  },
  { _id: false }
);

const partialAccessControlSchema = new mongoose.Schema<PartialAccessControl>(
  {
    accessibleModules: { type: [moduleAccessControlSchema], default: [] },
    accessType: {
      type: String,
      required: true,
      enum: ["full", "partial"],
      default: "partial",
    },
  },
  { _id: false }
);

// Main Enrollment Schema
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
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "completed", "dropped", "paused"],
      default: "active",
      index: true,
    },
    progress: {
      type: enrollmentProgressSummarySchema,
      required: true,
      default: {
        overallCompletion: 0,
        totalModules: 0,
        completedModules: 0,
        totalLessons: 0,
        completedLessons: 0,
        lastActivityAt: new Date(),
      },
    },
    completedContents: {
      type: [contentCompletionSchema],
      default: [],
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Optional metadata
    enrollmentSource: {
      type: String,
      enum: ["direct", "gift", "promotion"],
      default: "direct",
    },
    giftFrom: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      validate: {
        validator: function (value: any) {
          // Allow null, ObjectId, or string values
          return (
            value === null ||
            mongoose.Types.ObjectId.isValid(value) ||
            typeof value === "string"
          );
        },
        message: "giftFrom must be null, a valid ObjectId, or a string",
      },
    },
    promotionCode: {
      type: String,
      default: null,
    },
    planType: {
      type: String,
      enum: ["elite", "essential"],
      default: "essential",
    },

    // Partial access control (for admin-controlled access)
    accessControl: {
      type: partialAccessControlSchema,
      default: null,
    },

    // Completion tracking
    completedAt: {
      type: Date,
      default: null,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateIssuedAt: {
      type: Date,
      default: null,
    },

    // Analytics
    totalTimeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    // Last accessed content
    lastContentAccessed: {
      type: lastContentAccessedSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ lastActivityAt: -1 });
enrollmentSchema.index({ status: 1, enrolledAt: -1 });
enrollmentSchema.index({ "completedContents.contentId": 1 }); // Index for querying completed content

// Pre-update middleware
enrollmentSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastUpdated: new Date() });
  next();
});

// Static methods
enrollmentSchema.statics.findByUserAndCourse = function (
  userId: string,
  courseId: string
) {
  return this.findOne({ userId, courseId, status: { $ne: "dropped" } });
};

enrollmentSchema.statics.findActiveByUser = function (userId: string) {
  return this.find({ userId, status: "active" });
};

enrollmentSchema.statics.findCompletedByUser = function (userId: string) {
  return this.find({ userId, status: "completed" });
};

// Instance methods
enrollmentSchema.methods.updateProgress = function (
  progressData: Partial<EnrollmentProgressSummary>
) {
  this.progress = { ...this.progress, ...progressData };
  this.lastActivityAt = new Date();
  return this.save();
};

enrollmentSchema.methods.markAsCompleted = function () {
  this.status = "completed";
  this.completedAt = new Date();
  this.progress.overallCompletion = 100;
  return this.save();
};

enrollmentSchema.methods.pause = function () {
  this.status = "paused";
  return this.save();
};

enrollmentSchema.methods.resume = function () {
  this.status = "active";
  return this.save();
};

export const EnrollmentModel = mongoose.model<Enrollment>(
  "Enrollment",
  enrollmentSchema
);
