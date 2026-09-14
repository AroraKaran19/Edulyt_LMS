import mongoose from "mongoose";
import { Category } from "../types";
import { brandPlugin } from "./plugins/brand.plugin";
import { brandFromAudience } from "../lib/brandRules";

const categorySchema = new mongoose.Schema<Category>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      required: true,
      enum: ["college-students", "professionals"],
      default: "college-students",
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    showOnHomePage: {
      type: Boolean,
      default: false,
      required: true,
    },
    showOnCourseList: {
      type: Boolean,
      default: true,
      required: true,
    },
    categoryImage: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    sortOrder: {
      type: Number,
      required: false,
      default: 999,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });
// A name is unique within a brand, so "Data Science" can exist on both.
categorySchema.plugin(brandPlugin, {
  derive: (doc) => brandFromAudience(doc.get("audience")),
});
categorySchema.index({ name: 1, brand: 1 }, { unique: true });

export const CategoryModel = mongoose.model<Category>(
  "Category",
  categorySchema
);
