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

// `referenceFile` is intentionally NOT stored here — it's helper material
// (template / starter ZIP) that admins may update after submissions exist.
// Resolved live from InternshipQuestion at read time; see serializeSubmission.
const snapshotQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    type: { type: String, enum: ["mcq", "file_upload"], required: true },
    score: { type: Number, required: true, min: 0 },
    negativeScore: { type: Number, default: 0, min: 0 },
    options: { type: [snapshotOptionSchema], default: undefined },
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
    examType: {
      type: String,
      enum: ["entrance", "certification"],
      default: "entrance",
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    questions: { type: [snapshotQuestionSchema], required: true },
    totalScore: { type: Number, required: true, min: 0 },
    thresholdScore: { type: Number, min: 0 },
    // Timing (entrance window, certification window, result date) is NOT stored
    // here — it can change after attempts start, so it's resolved live at read
    // and gate time. See resolveLiveExamTiming in internshipSubmission.services.
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
    // Can be negative when negative marking is configured on the question.
    awardedScore: { type: Number },
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
    currentFile: { type: String, default: "" },
    learnerComment: { type: String, trim: true, default: "" },
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

    // Can be negative when negative marking pulls the MCQ total below zero.
    totalAwardedScore: { type: Number, default: 0 },

    // Ledger: how many internship success points THIS submission has currently
    // credited to the learner's enrollment. Reconciled on every review so
    // re-scoring / resubmission adjusts the learner's points by the delta
    // (clawing back on resubmit, never double-crediting on re-approval).
    // Intentionally has NO default so pre-ledger documents read as `undefined`
    // and can be seeded from their existing state on first reconcile.
    creditedSuccessPoints: { type: Number },

    status: {
      type: String,
      enum: ["draft", "submitted", "partially_reviewed", "fully_reviewed"],
      default: "draft",
    },

    submittedAt: { type: Date },
  },
  { timestamps: true },
);

// Unique constraint: one submission per (user × template × batch).
//
// These MUST use partialFilterExpression, NOT `sparse`. A compound *sparse*
// index indexes a document that has AT LEAST ONE of its keys — so a task
// submission (no `examId`) would still be indexed by the examId index with
// `examId: null`, making every user's 2nd task in a batch collide on
// (userId, null, batchId). The partial filter scopes each index to its own
// submission type so tasks and exams never cross-contaminate.
internshipSubmissionSchema.index(
  { userId: 1, examId: 1, batchId: 1 },
  { unique: true, partialFilterExpression: { examId: { $exists: true } } },
);
internshipSubmissionSchema.index(
  { userId: 1, taskId: 1, batchId: 1 },
  { unique: true, partialFilterExpression: { taskId: { $exists: true } } },
);
internshipSubmissionSchema.index({ userId: 1, internshipId: 1 });
internshipSubmissionSchema.index({ taskId: 1, updatedAt: -1 }, { sparse: true });
internshipSubmissionSchema.index({ examId: 1, updatedAt: -1 }, { sparse: true });
internshipSubmissionSchema.index({ status: 1, updatedAt: -1 });

export const InternshipSubmissionModel = mongoose.model(
  "InternshipSubmission",
  internshipSubmissionSchema,
);
