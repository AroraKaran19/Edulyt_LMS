import mongoose from "mongoose";
import { Enrollment, EnrollmentProgressSummary, LastContentAccessed } from "../types";

// Enrollment Progress Summary Schema
const enrollmentProgressSummarySchema = new mongoose.Schema<EnrollmentProgressSummary>(
  {
    overallCompletion: { type: Number, default: 0, min: 0, max: 100 },
    totalModules: { type: Number, default: 0 },
    completedModules: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    completedLessons: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now }
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
      enum: ["video", "quiz", "document"]
    },
    lastPosition: { type: Number, default: 0 }, // For videos
    timestamp: { type: Date, default: Date.now }
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
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },
    enrolledAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "completed", "dropped", "paused"],
      default: "active",
      index: true
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
        lastActivityAt: new Date()
      }
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now
    },
    
    // Optional metadata
    enrollmentSource: {
      type: String,
      enum: ["direct", "gift", "promotion"],
      default: "direct"
    },
    giftFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    promotionCode: {
      type: String,
      default: null
    },
    
    // Completion tracking
    completedAt: {
      type: Date,
      default: null
    },
    certificateIssued: {
      type: Boolean,
      default: false
    },
    certificateIssuedAt: {
      type: Date,
      default: null
    },
    
    // Analytics
    totalTimeSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActivityAt: {
      type: Date,
      default: Date.now
    },
    
    // Last accessed content
    lastContentAccessed: {
      type: lastContentAccessedSchema,
      default: null
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ lastActivityAt: -1 });
enrollmentSchema.index({ status: 1, enrolledAt: -1 });

// Virtual for completion percentage
enrollmentSchema.virtual('completionPercentage').get(function() {
  return this.progress.overallCompletion;
});

// Virtual for isCompleted
enrollmentSchema.virtual('isCompleted').get(function() {
  return this.status === "completed";
});

// Virtual for isActive
enrollmentSchema.virtual('isActive').get(function() {
  return this.status === "active";
});

// Pre-save middleware
enrollmentSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  
  // If status is completed, set completedAt
  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Update lastActivityAt
  this.lastActivityAt = new Date();
  
  next();
});

// Pre-update middleware
enrollmentSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastUpdated: new Date() });
  next();
});

// Static methods
enrollmentSchema.statics.findByUserAndCourse = function(userId: string, courseId: string) {
  return this.findOne({ userId, courseId, status: { $ne: "dropped" } });
};

enrollmentSchema.statics.findActiveByUser = function(userId: string) {
  return this.find({ userId, status: "active" });
};

enrollmentSchema.statics.findCompletedByUser = function(userId: string) {
  return this.find({ userId, status: "completed" });
};

// Instance methods
enrollmentSchema.methods.updateProgress = function(progressData: Partial<EnrollmentProgressSummary>) {
  this.progress = { ...this.progress, ...progressData };
  this.lastActivityAt = new Date();
  return this.save();
};

enrollmentSchema.methods.markAsCompleted = function() {
  this.status = "completed";
  this.completedAt = new Date();
  this.progress.overallCompletion = 100;
  return this.save();
};

enrollmentSchema.methods.pause = function() {
  this.status = "paused";
  return this.save();
};

enrollmentSchema.methods.resume = function() {
  this.status = "active";
  return this.save();
};

export const EnrollmentModel = mongoose.model<Enrollment>("Enrollment", enrollmentSchema);
