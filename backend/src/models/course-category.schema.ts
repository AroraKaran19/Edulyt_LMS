import mongoose from "mongoose";

// ===================
// Course Category Schema
// ===================

const courseCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CourseCategoryModel = mongoose.model(
  "CourseCategory",
  courseCategorySchema
);
