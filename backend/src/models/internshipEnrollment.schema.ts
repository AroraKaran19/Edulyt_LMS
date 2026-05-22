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
     * Snapshot of the internship captured at enrollment time.
     * Keeps the enrollment self-contained — title and slug never change
     * from the learner's perspective even if the live document is updated.
     */
    internshipSnapshot: {
      type: new mongoose.Schema(
        {
          title: { type: String, required: true, trim: true },
          slug: { type: String, required: true, trim: true },
          thumbnail: { type: String, trim: true },
        },
        { _id: false },
      ),
      default: undefined,
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
          /** Copy of batch `applicationLastDate` at signup (IST calendar “apply by”). */
          applicationLastDate: { type: Date, required: false },
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
        "exam_registered",
        "exam_attempted",
        "in_merit_pool",
        "admin_rejected",
        "payment_pending",
        "pending_documentation",
        "docs_under_review",
        "offer_letter_pending",
        "re_pending_documentation",
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

    /**
     * Program length chosen at registration (`internshipDuration` in applicationAnswers), in months.
     * Drives per-learner certification exam day (last UTC day of the program).
     */
    programDurationMonths: {
      type: Number,
      min: 1,
      max: 120,
      default: undefined,
    },

    /**
     * Materialized end of the learner's program window
     * (`enrolledAt + programDurationMonths`). Stored so queries that need
     * "tasks / meetings / exam scheduled in this learner's window" don't
     * have to recompute the boundary each time. Set by the same code path
     * that sets `programDurationMonths`.
     */
    endDate: { type: Date, required: false },

    /**
     * Snapshot of the public internship enroll form at submission time (JSON).
     * Used by admins via the enrollment detail → registration modal.
     */
    applicationAnswers: { type: mongoose.Schema.Types.Mixed, required: false },
    applicationSubmittedAt: { type: Date, required: false },

    /**
     * KYC documents (Aadhar + photo). Required to leave `pending_documentation`
     * once the parent internship has a documentation window configured.
     * Aadhar is stored as AES-256-GCM ciphertext + IV + tag (base64); only
     * decrypted at admin display time.
     */
    documentation: {
      type: new mongoose.Schema(
        {
          aadharCardNumberEnc: { type: String, required: true },
          aadharCardNumberIv: { type: String, required: true },
          aadharCardNumberTag: { type: String, required: true },
          learnerPhoto: { type: String, required: true, trim: true },
          learnerPhotoS3Key: { type: String, required: true, trim: true },
          submittedAt: { type: Date, required: true },
        },
        { _id: false },
      ),
      default: undefined,
    },
    documentationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    documentationReviewedAt: { type: Date },
    documentationRejectionNote: { type: String, trim: true },
    /**
     * Timestamp at which the learner accepted the internship Terms &
     * Conditions (Annexure 1). Set when they submit documents — submission
     * is rejected if this is not accepted.
     */
    termsAcceptedAt: { type: Date },
    offerLetterGeneratedAt: { type: Date },
    internId: { type: String, trim: true, sparse: true },
    offerLetterUrl: { type: String, trim: true },

    /**
     * One-shot guard for the wallet "internship registration" reward.
     * Set true once the registration success-points reward has been
     * processed for this enrollment (whether or not points were actually
     * credited — a sibling enrollment of the same internship may have
     * already claimed the once-per-internship reward).
     */
    registrationSuccessPointsAwarded: {
      type: Boolean,
      required: false,
      default: false,
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

// Keep `endDate` derived from `enrolledAt + programDurationMonths`. Centralized
// here so every `.save()` / `.create()` path stays correct; pre-enrollment
// docs (no enrolledAt yet) leave endDate undefined naturally.
internshipEnrollmentSchema.pre("save", function (next) {
  const enrolledAt = this.enrolledAt instanceof Date ? this.enrolledAt : null;
  const months =
    typeof this.programDurationMonths === "number"
      ? this.programDurationMonths
      : null;
  if (enrolledAt && months && months > 0) {
    const d = new Date(enrolledAt);
    d.setMonth(d.getMonth() + months);
    this.endDate = d;
  } else {
    this.endDate = undefined;
  }
  next();
});

export const InternshipEnrollmentModel = mongoose.model(
  "InternshipEnrollment",
  internshipEnrollmentSchema,
);
