import mongoose from "mongoose";

const internshipTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    questions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "InternshipQuestion" },
    ],
    totalScore: { type: Number, required: true, default: 0, min: 0 },
    /** Minimum aggregate score (marks) required to pass (must be <= totalScore). */
    scoreThreshold: { type: Number, required: true, default: 0, min: 0 },
    /** Internship success points awarded once the learner passes (marks >= scoreThreshold). */
    successPoints: { type: Number, required: true, default: 0, min: 0 },
    unlockAfterDays: { type: Number, required: true, default: 0, min: 0 },
    dueDays: { type: Number, required: true, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

internshipTaskSchema.index({ title: 1 });
internshipTaskSchema.index({ isActive: 1, updatedAt: -1 });

export const InternshipTaskModel = mongoose.model(
  "InternshipTask",
  internshipTaskSchema,
);
