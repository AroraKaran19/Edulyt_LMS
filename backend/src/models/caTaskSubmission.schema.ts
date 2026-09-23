import mongoose, { Schema } from "mongoose";
import type { CaTaskSubmission } from "../types/caTask";

const snapshotOptionSchema = new Schema(
  { optionId: { type: String, required: true }, text: { type: String, required: true }, isCorrect: { type: Boolean, required: true } },
  { _id: false },
);

const snapshotQuestionSchema = new Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    type: { type: String, enum: ["mcq", "file_upload"], required: true },
    score: { type: Number, required: true, min: 0 },
    options: { type: [snapshotOptionSchema], default: undefined },
  },
  { _id: false },
);

const templateSnapshotSchema = new Schema(
  {
    taskId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    questions: { type: [snapshotQuestionSchema], required: true },
    totalScore: { type: Number, required: true, min: 0 },
    passScore: { type: Number, required: true, min: 0 },
    successPoints: { type: Number, required: true, min: 0 },
    snapshotAt: { type: Date, required: true },
  },
  { _id: false },
);

const mcqResponseSchema = new Schema(
  {
    question: { type: String, required: true },
    selectedOptions: { type: [String], default: [] },
    isCorrect: { type: Boolean, default: false },
    awardedScore: { type: Number, default: 0 },
  },
  { _id: false },
);

const fileUploadEntrySchema = new Schema(
  { file: { type: String, required: true }, uploadedAt: { type: Date, required: true } },
  { _id: false },
);

const fileResponseSchema = new Schema(
  {
    question: { type: String, required: true },
    currentFile: { type: String, default: "" },
    learnerComment: { type: String, trim: true, default: "" },
    uploadHistory: { type: [fileUploadEntrySchema], default: [] },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    awardedScore: { type: Number, default: 0, min: 0 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const caTaskSubmissionSchema = new Schema<CaTaskSubmission>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "CaTask", required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: "CaApplication", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    templateSnapshot: { type: templateSnapshotSchema, required: true },
    mcqResponses: { type: [mcqResponseSchema], default: [] },
    fileResponses: { type: [fileResponseSchema], default: [] },
    totalAwardedScore: { type: Number, default: 0 },
    pendingReview: { type: Boolean, default: false },
    status: { type: String, enum: ["submitted", "reviewed"], default: "submitted" },
    passed: { type: Boolean, default: false },
    pointsAwardedAt: { type: Date, default: null },
    submittedAt: { type: Date, required: true },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

caTaskSubmissionSchema.index({ taskId: 1, applicationId: 1 }, { unique: true });
caTaskSubmissionSchema.index({ applicationId: 1 });
caTaskSubmissionSchema.index({ pendingReview: 1, applicationId: 1 });

export const CaTaskSubmissionModel = mongoose.model<CaTaskSubmission>("CaTaskSubmission", caTaskSubmissionSchema);
