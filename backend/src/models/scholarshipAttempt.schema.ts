import mongoose from "mongoose";
import { ScholarshipAttempt } from "../types/scholarship";

const testSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    // The range, not one percentage: the snapshot freezes at attempt start,
    // before the winner's roll exists.
    minDiscountPercent: { type: Number, required: true },
    maxDiscountPercent: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    marketerName: { type: String, required: false, default: "" },
  },
  { _id: false },
);

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptionIds: { type: [String], default: [] },
  },
  { _id: false },
);

const scholarshipAttemptSchema = new mongoose.Schema<ScholarshipAttempt>(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScholarshipTest",
      required: false,
      default: null,
    },
    testSnapshot: { type: testSnapshotSchema, required: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    attemptNumber: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      required: true,
      enum: ["in_progress", "submitted", "expired"],
      default: "in_progress",
    },
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId }],
    startedAt: { type: Date, required: true },
    /** Server-side authority for the clock; the client countdown is cosmetic. */
    expiresAt: { type: Date, required: true },
    answers: { type: [answerSchema], default: [] },
    /** Analytics only: finishing earns the coupon, the score never gates it. */
    correctCount: { type: Number, required: true, default: 0, min: 0 },
    totalQuestions: { type: Number, required: true, default: 0, min: 0 },
    submittedAt: { type: Date, required: false },
  },
  { timestamps: true },
);

scholarshipAttemptSchema.index(
  { testId: 1, email: 1, attemptNumber: 1 },
  { unique: true },
);
// Entitlement is earned by finishing, so the lookup is on status, not a score.
scholarshipAttemptSchema.index({ testId: 1, email: 1, status: 1 });
scholarshipAttemptSchema.index({ testId: 1, submittedAt: -1 });
scholarshipAttemptSchema.index({ email: 1, createdAt: -1 });

export const ScholarshipAttemptModel = mongoose.model<ScholarshipAttempt>(
  "ScholarshipAttempt",
  scholarshipAttemptSchema,
);
