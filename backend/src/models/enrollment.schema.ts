import mongoose from "mongoose";
import {
  Enrollment,
  LessonProgress,
  ModuleProgress,
  EnrollmentProgress,
} from "../types/enrollment";

// Lesson progress sub-schema
const lessonProgressSchema = new mongoose.Schema<LessonProgress>(
  {
    lessonId: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      required: true,
      default: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
    score: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
    },
    timeSpent: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    lastAccessedAt: {
      type: Date,
      required: false,
    },
  },
  { _id: false }
);

// Module progress sub-schema
const moduleProgressSchema = new mongoose.Schema<ModuleProgress>(
  {
    moduleId: {
      type: String,
      required: true,
    },
    completion: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    lessons: {
      type: [lessonProgressSchema],
      required: true,
      default: [],
    },
    startedAt: {
      type: Date,
      required: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
  },
  { _id: false }
);

// Enrollment progress sub-schema
const enrollmentProgressSchema = new mongoose.Schema<EnrollmentProgress>(
  {
    overallCompletion: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    modules: {
      type: [moduleProgressSchema],
      required: true,
      default: [],
    },
    lastContentAccessed: {
      moduleId: { type: String, required: false },
      lessonId: { type: String, required: false },
      contentId: { type: String, required: false },
      contentType: {
        type: String,
        enum: ["video", "quiz", "document"],
        required: false,
      },
      lastPosition: { type: Number, required: false },
      timestamp: { type: Date, required: false },
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
        modules: [],
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

// Pre-save middleware to update lastUpdated and calculate overall completion
enrollmentSchema.pre("save", function (next) {
  this.lastUpdated = new Date();

  // Calculate overall completion based on module completions
  if (this.progress.modules.length > 0) {
    const totalCompletion = this.progress.modules.reduce(
      (sum, module) => sum + module.completion,
      0
    );
    this.progress.overallCompletion = Math.round(
      totalCompletion / this.progress.modules.length
    );

    // Update status based on completion
    if (this.progress.overallCompletion === 100 && this.status === "active") {
      this.status = "completed";
      this.completedAt = new Date();
    }
  }

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
enrollmentSchema.methods.updateProgress = function (
  moduleId: string,
  lessonId: string,
  completed: boolean,
  score?: number,
  timeSpent?: number
) {
  const module = this.progress.modules.find(
    (m: ModuleProgress) => m.moduleId === moduleId
  );

  if (!module) {
    // Create new module progress
    this.progress.modules.push({
      moduleId,
      completion: 0,
      lessons: [
        {
          lessonId,
          completed,
          completedAt: completed ? new Date() : undefined,
          score,
          lastAccessedAt: new Date(),
        },
      ],
    });
  } else {
    // Update existing module progress
    let lesson = module.lessons.find(
      (l: LessonProgress) => l.lessonId === lessonId
    );

    if (!lesson) {
      module.lessons.push({
        lessonId,
        completed,
        completedAt: completed ? new Date() : undefined,
        score,
        lastAccessedAt: new Date(),
      });
    } else {
      lesson.completed = completed;
      lesson.completedAt = completed ? new Date() : undefined;
      lesson.score = score;
      lesson.lastAccessedAt = new Date();
    }

    // Recalculate module completion
    const completedLessons = module.lessons.filter(
      (l: LessonProgress) => l.completed
    ).length;
    module.completion = Math.round(
      (completedLessons / module.lessons.length) * 100
    );
  }

  // Update last activity
  this.lastActivityAt = new Date();

  // Update total time spent if provided
  if (timeSpent) {
    this.totalTimeSpent = (this.totalTimeSpent || 0) + timeSpent;
  }

  return this.save();
};

enrollmentSchema.methods.markAsCompleted = function () {
  this.status = "completed";
  this.completedAt = new Date();
  this.progress.overallCompletion = 100;
  return this.save();
};

export const EnrollmentModel = mongoose.model<Enrollment>(
  "Enrollment",
  enrollmentSchema
);
