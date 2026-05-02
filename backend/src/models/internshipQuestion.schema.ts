import mongoose from "mongoose";
import { QUESTION_CATEGORY_VALUES } from "../constants/questionCategories";

const mcqOptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true },
);

const internshipQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["mcq", "file_upload"],
      required: true,
    },
    usageType: {
      type: String,
      enum: ["exam", "task", "both"],
      required: true,
    },
    score: { type: Number, required: true, default: 0, min: 0 },
    negativeScore: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    options: { type: [mcqOptionSchema], default: undefined },
    referenceFile: { type: String, trim: true, default: "" },
    category: {
      type: String,
      trim: true,
      default: undefined,
      enum: {
        values: [...QUESTION_CATEGORY_VALUES],
        message: "Invalid question category",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

internshipQuestionSchema.index({ questionText: 1 });
internshipQuestionSchema.index({ type: 1, usageType: 1, updatedAt: -1 });

export const InternshipQuestionModel = mongoose.model(
  "InternshipQuestion",
  internshipQuestionSchema,
);
