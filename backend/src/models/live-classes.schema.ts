import mongoose from "mongoose";
import { LiveClass } from "../types/live-classes";
import { validateUrl } from "./validators";

// ===================
// Live Class Schema
// ===================

const liveClassSchema = new mongoose.Schema<LiveClass & { expiresAt?: Date }>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title must not exceed 200 characters"],
    },
    imageUrl: {
      type: String,
      required: false,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty string
          return validateUrl(v);
        },
        message: "Image URL must be a valid URL (http:// or https://)",
      },
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: [1000, "Description must not exceed 1000 characters"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Course",
    },
    startDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          // Validate time format HH:mm
          return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Start time must be in HH:mm format",
      },
    },
    endDate: {
      type: Date,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          // Validate time format HH:mm
          return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "End time must be in HH:mm format",
      },
    },
    expiresAt: {
      type: Date,
      required: false,
      // This field will be automatically set in pre-save hook
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Add pre-save hook to validate that end date/time is after start date/time
// and set expiresAt for TTL index
liveClassSchema.pre("save", function (next) {
  // Combine date and time to create full datetime
  const startDateTime = new Date(this.startDate);
  const [startHours, startMinutes] = this.startTime.split(":").map(Number);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(this.endDate);
  const [endHours, endMinutes] = this.endTime.split(":").map(Number);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  if (endDateTime <= startDateTime) {
    return next(new Error("End date and time must be after start date and time"));
  }

  // Set expiresAt to endDateTime for TTL index (auto-delete after end date/time)
  this.expiresAt = endDateTime;

  next();
});

// Add index for efficient queries
liveClassSchema.index({ instructor: 1 });
liveClassSchema.index({ course: 1 });
liveClassSchema.index({ startDate: 1 });
liveClassSchema.index({ endDate: 1 });
liveClassSchema.index({ startDate: 1, endDate: 1 });
liveClassSchema.index({ course: 1, startDate: 1 }); // Compound index for course-based date queries

// TTL index - automatically delete documents when expiresAt time is reached
// MongoDB will delete the document when the expiresAt date/time passes
liveClassSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create and export the model
const LiveClassModel = mongoose.model<LiveClass>("LiveClass", liveClassSchema);

export default LiveClassModel;

