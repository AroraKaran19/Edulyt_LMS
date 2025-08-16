import mongoose from "mongoose";
import { CourseInstructor } from "../types";
import { userSchema } from "./user.schema";

// ===================
// Instructor Schema (Discriminator of User Schema)
// ===================

const instructorSchema = new mongoose.Schema<CourseInstructor>(
  {
    // Instructor-specific fields only
    rating: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    totalStudents: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Total students cannot be negative"],
    },
    bio: {
      type: String,
      required: false,
      trim: true,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
    },
    currentPosition: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Current position cannot exceed 100 characters"],
    },
    currentCompany: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Current company cannot exceed 100 characters"],
    },
    linkedinUrl: {
      type: String,
      required: false,
      validate: {
        validator: function(url: string) {
          if (!url) return true;
          return /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(url);
        },
        message: "LinkedIn URL must be a valid LinkedIn profile URL",
      },
    },
    reviews: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: "Review",
      default: [],
    },
    ownedCourses: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: "Course",
      default: [],
    },
  },
  { 
    timestamps: true,
    discriminatorKey: "role" // Use role field as discriminator
  }
);

// Instructor-specific indexes
instructorSchema.index({ rating: -1 }); // For listing instructors by rating
instructorSchema.index({ totalStudents: -1 }); // For listing instructors by total students
instructorSchema.index({ reviews: 1 }); // For finding instructors by review
instructorSchema.index({ ownedCourses: 1 }); // For finding instructors by course

// Pre-save hook to ensure role is set to instructor
instructorSchema.pre("save", function (next) {
  this.role = "instructor";
  this.set("updatedAt", new Date());
  next();
});

// Create the discriminator model
export const InstructorModel = userSchema.discriminator("instructor", instructorSchema);

export default InstructorModel;
