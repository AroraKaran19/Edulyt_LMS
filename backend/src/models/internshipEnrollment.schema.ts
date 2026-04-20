import mongoose from "mongoose";

const internshipEnrollmentSchema = new mongoose.Schema(
  {
    /** Internship["_id"] */
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
    },
    /**
     * Snapshot of the batch captured at enrollment time.
     * Keeps the enrollment self-contained — no need to re-fetch the
     * parent Internship document just to display cohort details.
     */
    batchSnapshot: {
      type: new mongoose.Schema(
        {
          /** `internship.batches[n]._id` */
          batchId: { type: String, required: true },
          /** Human-readable cohort name, e.g. "Batch 2025 – July". */
          name: { type: String, required: true, trim: true },
          /** Date the cohort officially begins. */
          internshipStartDate: { type: Date, required: true },
        },
        { _id: false },
      ),
      default: undefined,
    },
    /** User["_id"] */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    enrollmentType: {
      type: String,
      enum: ["merit", "paid"],
    },
    status: {
      type: String,
      enum: [
        "exam_attempted",
        "in_merit_pool",
        "admin_approved",
        "admin_rejected",
        "payment_pending",
        "enrolled",
        "completed",
        "dropped",
        "revoked",
        "paused",
      ],
      required: true,
      default: "enrolled",
    },

    // ── Merit path ────────────────────────────────────────────────────────────
    examScore: { type: Number, min: 0 },
    examAttemptedAt: { type: Date },
    adminActionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminActionAt: { type: Date },
    adminRejectionNote: { type: String, trim: true },

    // ── Paid path ─────────────────────────────────────────────────────────────
    paymentAmount: { type: Number, min: 0 },
    paymentOrderId: { type: String, trim: true },
    paymentConfirmedAt: { type: Date },

    // ── Common ────────────────────────────────────────────────────────────────
    /**
     * Anchor date for computing task/exam unlock & due dates:
     *   visibleFrom = enrolledAt + template.unlockAfterDays
     *   dueAt       = enrolledAt + template.dueDays
     */
    enrolledAt: { type: Date },

    /**
     * Cumulative points earned from completed task submissions where
     * totalAwardedScore >= template scoreThreshold.
     * Incremented automatically when a task submission transitions to
     * `fully_reviewed` and the learner meets/exceeds the pass threshold.
     * Used for certification eligibility.
     */
    internshipSuccessPoints: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

// One enrollment per user per internship batch
internshipEnrollmentSchema.index(
  { user: 1, internship: 1, "batchSnapshot.batchId": 1 },
  { unique: true, sparse: true },
);
internshipEnrollmentSchema.index({ internship: 1, status: 1 });
internshipEnrollmentSchema.index({ user: 1, status: 1 });

export const InternshipEnrollmentModel = mongoose.model(
  "InternshipEnrollment",
  internshipEnrollmentSchema,
);
