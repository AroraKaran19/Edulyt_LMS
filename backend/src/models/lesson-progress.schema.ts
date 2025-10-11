import mongoose from "mongoose";

export interface ILessonProgress {
  _id?: string;
  enrollmentId: mongoose.Types.ObjectId;
  moduleId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  score?: number; // For quizzes
  timeSpent?: number; // In seconds
  lastAccessedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const lessonProgressSchema = new mongoose.Schema<ILessonProgress>(
  {
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    moduleId: {
      type: String,
      required: true,
      index: true,
    },
    lessonId: {
      type: String,
      required: true,
      index: true,
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
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
lessonProgressSchema.index({ enrollmentId: 1, moduleId: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ enrollmentId: 1, completed: 1 });
lessonProgressSchema.index({ moduleId: 1, completed: 1 });

// Instance methods
lessonProgressSchema.methods.updateProgress = function (
  completed: boolean,
  score?: number,
  timeSpent?: number
) {
  this.completed = completed;
  this.completedAt = completed ? new Date() : undefined;
  this.score = score;
  this.lastAccessedAt = new Date();
  
  if (timeSpent) {
    this.timeSpent = (this.timeSpent || 0) + timeSpent;
  }
  
  return this.save();
};

export const LessonProgressModel = mongoose.model<ILessonProgress>(
  "LessonProgress",
  lessonProgressSchema
);
