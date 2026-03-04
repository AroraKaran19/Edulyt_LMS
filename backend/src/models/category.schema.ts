import mongoose from "mongoose";
import { Category } from "../types";

const categorySchema = new mongoose.Schema<Category>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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

export const CategoryModel = mongoose.model<Category>(
  "Category",
  categorySchema
);
