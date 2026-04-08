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
    contentId: { type: String, required: true }, // Index is defined on parent schema
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

const collaborationTopNSettingsSchema = new mongoose.Schema(
  {
    contentsPerLesson: { type: Number, required: true, min: 1 },
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
      enum: ["active", "completed", "dropped", "revoked", "paused"],
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
      enum: ["direct", "gift", "promotion", "trial"],
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
    /** Snapshot of gifter at enrollment time (survives if gifter account is deleted). */
    giftFromSnapshot: {
      type: new mongoose.Schema(
        {
          displayName: { type: String, required: true },
          email: { type: String, required: false },
        },
        { _id: false }
      ),
      default: undefined,
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

    collaborationTopNSettings: {
      type: collaborationTopNSettingsSchema,
      default: undefined,
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

    // Trial enrollment fields
    isTrial: {
      type: Boolean,
      default: false,
      index: true,
    },
    trialExpiresAt: {
      type: Date,
      default: undefined,
      required: false,
      // This field will be automatically set in pre-save hook if isTrial is true
    },
    trialDurationDays: {
      type: Number,
      default: undefined,
      required: false,
      min: 1,
      // Number of days the trial lasts (defaults to 7 if not specified)
    },
    // Validity period for non-trial enrollments (4 years from enrollment date)
    validUntil: {
      type: Date,
      default: undefined,
      required: false,
      index: true,
      // This field will be automatically set in pre-save hook for non-trial enrollments
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
enrollmentSchema.index({ isTrial: 1, trialExpiresAt: 1 }); // Index for trial enrollments
enrollmentSchema.index({ isTrial: 1, validUntil: 1 }); // Index for non-trial enrollment validity

// NOTE: We intentionally do NOT use a TTL index for trial enrollments.
// Trial enrollments should remain in the database after `trialExpiresAt` so we can
// keep audit/history; access checks should use `trialExpiresAt` to treat them as expired.

// Pre-save hook to set expiration dates for enrollments
enrollmentSchema.pre("save", function (next) {
  // If this is a trial enrollment and trialExpiresAt is not set
  if (this.isTrial && !this.trialExpiresAt) {
    const trialDuration = this.trialDurationDays || 7; // Default to 7 days if not specified
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + trialDuration);
    this.trialExpiresAt = expiresAt;
    // Clear validUntil for trial enrollments
    this.validUntil = undefined;
  }
  // If trial enrollment is being converted to regular enrollment, clear trial fields
  if (!this.isTrial && this.trialExpiresAt) {
    this.trialExpiresAt = undefined;
    this.trialDurationDays = undefined;
  }
  // For non-trial enrollments, set validUntil to 4 years from enrollment date
  if (!this.isTrial && !this.validUntil) {
    const validUntilDate = new Date(this.enrolledAt || new Date());
    validUntilDate.setFullYear(validUntilDate.getFullYear() + 4); // Add 4 years
    this.validUntil = validUntilDate;
  }
  next();
});

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
  return this.findOne({ userId, courseId, status: { $nin: ["dropped", "revoked"] } });
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
