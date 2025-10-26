import mongoose from "mongoose";
import { Category } from "../types";

const categorySchema = new mongoose.Schema<Category>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
categorySchema.index({ isActive: 1 });

export const CategoryModel = mongoose.model<Category>(
  "Category",
  categorySchema
);
