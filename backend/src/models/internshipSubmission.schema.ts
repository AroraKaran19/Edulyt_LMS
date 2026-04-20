import mongoose from "mongoose";

// ─── Snapshot sub-schemas ─────────────────────────────────────────────────────
// These are embedded at submission-creation time and NEVER mutated afterwards.

const snapshotOptionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false },
);

const snapshotQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    type: { type: String, enum: ["mcq", "file_upload"], required: true },
    score: { type: Number, required: true, min: 0 },
    options: { type: [snapshotOptionSchema], default: undefined },
    referenceFile: { type: String, default: "" },
  },
  { _id: false },
);

const taskTemplateSnapshotSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    questions: { type: [snapshotQuestionSchema], required: true },
    totalScore: { type: Number, required: true, min: 0 },
    scoreThreshold: { type: Number, required: true, default: 0, min: 0 },
    unlockAfterDays: { type: Number, required: true, default: 0 },
    dueDays: { type: Number, required: true, default: 0 },
    snapshotAt: { type: Date, required: true },
  },
  { _id: false },
);

const examTemplateSnapshotSchema = new mongoose.Schema(
  {
    examId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    questions: { type: [snapshotQuestionSchema], required: true },
    totalScore: { type: Number, required: true, min: 0 },
    thresholdScore: { type: Number, min: 0 },
    examStartAt: { type: Date },
    examEndAt: { type: Date },
    examResultAt: { type: Date, required: true },
    snapshotAt: { type: Date, required: true },
  },
  { _id: false },
);

// ─── Response sub-schemas ─────────────────────────────────────────────────────

const mcqResponseSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    selectedOptions: { type: [String], default: [] },
    isCorrect: { type: Boolean },
    awardedScore: { type: Number, min: 0 },
  },
  { _id: false },
);

const fileUploadEntrySchema = new mongoose.Schema(
  {
    file: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false },
);

const fileResponseSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    currentFile: { type: String, required: true },
    uploadHistory: { type: [fileUploadEntrySchema], default: [] },
    status: {
      type: String,
      enum: ["submitted", "under_review", "re_upload_requested", "reviewed"],
      default: "submitted",
    },
    awardedScore: { type: Number, min: 0 },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true },
  },
  { _id: true },
);

// ─── Main submission schema ───────────────────────────────────────────────────

const internshipSubmissionSchema = new mongoose.Schema(
  {
    submissionFor: {
      type: String,
      enum: ["exam", "task"],
      required: true,
    },

    // Template refs — kept as strings so they survive template deletion/rename
    examId: { type: String },
    taskId: { type: String },

    /**
     * The immutable snapshot.  Written once at creation time from the live
     * template document.  Grading and UI MUST read from here, not from
     * InternshipExamModel / InternshipTaskModel.
     */
    templateSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Context
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
    },
    batchId: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipEnrollment",
      required: true,
    },

    // Answers
    mcqResponses: { type: [mcqResponseSchema], default: [] },
    fileResponses: { type: [fileResponseSchema], default: [] },

    totalAwardedScore: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["draft", "submitted", "partially_reviewed", "fully_reviewed"],
      default: "draft",
    },

    submittedAt: { type: Date },
  },
  { timestamps: true },
);

// Unique constraint: one submission per (user × template × batch)
internshipSubmissionSchema.index(
  { userId: 1, examId: 1, batchId: 1 },
  { unique: true, sparse: true },
);
internshipSubmissionSchema.index(
  { userId: 1, taskId: 1, batchId: 1 },
  { unique: true, sparse: true },
);
internshipSubmissionSchema.index({ userId: 1, internshipId: 1 });
internshipSubmissionSchema.index({ taskId: 1, updatedAt: -1 }, { sparse: true });
internshipSubmissionSchema.index({ examId: 1, updatedAt: -1 }, { sparse: true });
internshipSubmissionSchema.index({ status: 1, updatedAt: -1 });

export const InternshipSubmissionModel = mongoose.model(
  "InternshipSubmission",
  internshipSubmissionSchema,
);
