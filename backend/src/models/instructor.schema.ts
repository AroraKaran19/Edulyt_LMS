import mongoose from "mongoose";
import { CourseInstructor } from "../types";
import { validateLinkedinUrl, validateUrl } from "./validators";

// ===================
// Instructor Schema
// ===================

const instructorSchema = new mongoose.Schema<CourseInstructor>(
  {
    name: { type: String, required: true },
    profileImage: { type: String, required: false },
    // experience: { type: String, required: false },
    rating: { type: Number, required: true },
    totalStudents: { type: Number, required: true },
    totalCourses: { type: Number, required: true },
    bio: { type: String, required: false },
    currentPosition: { type: String, required: false },
    currentCompany: { type: String, required: false },
    previousExperience: {
      type: [String],
      required: false,
      validate: {
        validator: validateUrl,
        message: "Previous experience must be a valid URL",
      },
    },
    // education: { type: [String], required: false },
    linkedinUrl: {
      type: String,
      required: false,
      validate: {
        validator: validateLinkedinUrl,
        message: "Linkedin URL must be a valid LinkedIn profile URL",
      },
    },
    reviews: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: "Review",
    },
    courseIds: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: "Course",
    },
  },
  { timestamps: true }
);

// Indexes

instructorSchema.index({ name: 1 }); // For searching instructors
instructorSchema.index({ isActive: 1 }); // For filtering active instructors
instructorSchema.index({ reviews: 1 }); // For finding instructors by review
instructorSchema.index({ courseIds: 1 }); // For finding instructors by course
instructorSchema.index({ totalStudents: 1 }); // For listing instructors by total students

instructorSchema.index({ totalStudents: -1 }); // For listing instructors by total students
instructorSchema.index({ rating: -1 }); // For listing instructors by rating

export default instructorSchema;
