import mongoose from "mongoose";
import { QuestionCategory } from "../types/questionCategory";

const questionCategorySchema = new mongoose.Schema<QuestionCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

questionCategorySchema.index({ isActive: 1 });

export const QuestionCategoryModel = mongoose.model<QuestionCategory>(
  "QuestionCategory",
  questionCategorySchema
);
