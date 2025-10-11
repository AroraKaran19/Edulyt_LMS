import mongoose from "mongoose";

export interface IEnrollmentActivity {
  _id?: string;
  enrollmentId: mongoose.Types.ObjectId;
  moduleId: string;
  lessonId: string;
  contentId: string;
  contentType: "video" | "quiz" | "document";
  lastPosition?: number; // For videos
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const enrollmentActivitySchema = new mongoose.Schema<IEnrollmentActivity>(
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
    },
    lessonId: {
      type: String,
      required: true,
    },
    contentId: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      enum: ["video", "quiz", "document"],
      required: true,
    },
    lastPosition: {
      type: Number,
      required: false,
      min: 0,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
enrollmentActivitySchema.index({ enrollmentId: 1, timestamp: -1 });
enrollmentActivitySchema.index({ enrollmentId: 1 }, { unique: true }); // Only keep latest activity per enrollment

// Instance methods
enrollmentActivitySchema.methods.updateActivity = function (
  moduleId: string,
  lessonId: string,
  contentId: string,
  contentType: "video" | "quiz" | "document",
  lastPosition?: number
) {
  this.moduleId = moduleId;
  this.lessonId = lessonId;
  this.contentId = contentId;
  this.contentType = contentType;
  this.lastPosition = lastPosition;
  this.timestamp = new Date();
  
  return this.save();
};

export const EnrollmentActivityModel = mongoose.model<IEnrollmentActivity>(
  "EnrollmentActivity",
  enrollmentActivitySchema
);
