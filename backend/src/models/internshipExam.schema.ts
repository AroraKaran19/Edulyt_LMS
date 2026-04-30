import mongoose from "mongoose";

const internshipExamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    examType: {
      type: String,
      enum: ["entrance", "certification"],
      required: true,
      default: "entrance",
    },
    questions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "InternshipQuestion" },
    ],
    totalScore: { type: Number, required: true, default: 0, min: 0 },
    thresholdScore: { type: Number, min: 0 },
    /** When results are published for this exam. Required. */
    examResultAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

internshipExamSchema.index({ title: 1 });
internshipExamSchema.index({ isActive: 1, updatedAt: -1 });

export const InternshipExamModel = mongoose.model(
  "InternshipExam",
  internshipExamSchema,
);
