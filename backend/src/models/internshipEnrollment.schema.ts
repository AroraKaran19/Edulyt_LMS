import mongoose from "mongoose";
import { computeProgramEndDate } from "../lib/internshipProgramWindow";
import { brandPlugin } from "./plugins/brand.plugin";

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
    // No `min` — entrance exams support negative marking, so a net-negative
    // total is a legitimate score. A `min: 0` here also broke unrelated saves
    // (e.g. admin rejection) because `.save()` re-validates the existing field.
    examScore: { type: Number },
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
     * Admin override of the computed certificate verdict.
     *   "pass" → force-eligible (issues the certificate even if the learner
     *            missed the work-points threshold or failed the exam).
     *   "fail" → force-ineligible.
     *   null   → use the computed eligibility (default).
     * Applied centrally in {@link computeInternshipEligibility}.
     */
    certificateOverride: {
      type: String,
      enum: ["pass", "fail"],
      default: null,
    },

    /**
     * Frozen verdict written by the certificate evaluation worker on day N+1
     * after the learner's program window ends. The numbers are snapshotted at
     * decision time so support can answer "why didn't I get my certificate?"
     * without recomputing.
     *
     * The automatic verdict is not re-run — its presence is the worker's
     * idempotency guard — and success-point purchases are blocked once it
     * exists. An admin can still rescue a `fail` via `certificateOverride`,
     * which wins over this snapshot everywhere the certificate is gated.
     */
    certificateEvaluation: {
      type: new mongoose.Schema(
        {
          evaluatedAt: { type: Date, required: true },
          verdict: { type: String, enum: ["pass", "fail"], required: true },
          reason: {
            type: String,
            enum: ["passed", "points_shortfall"],
            required: true,
          },
          earned: { type: Number, required: true },
          totalAchievable: { type: Number, required: true },
          thresholdPct: { type: Number, required: true },
          requiredPoints: { type: Number, required: true },
        },
        { _id: false },
      ),
      default: undefined,
    },

    /**
     * When the learner was told the outcome of their entrance exam application,
     * selected or not.
     *
     * One field covers both emails because only one can ever fire: the selected
     * email is sent when they leave a pre-selection status for a selected one, and
     * the rejection email only when they are rejected *from* a pre-selection
     * status. A learner rejected after being selected gets neither, because
     * "you were not selected for this batch" would be false.
     *
     * Claimed atomically before the send. Admins double-click and move statuses
     * back and forth, so without this a candidate could be congratulated twice.
     */
    entranceResultEmailSentAt: { type: Date, default: undefined },

    /**
     * When the learner was told how their internship closed, certificate or not.
     *
     * Separate from {@link certificateEvaluation} on purpose: "has been judged"
     * and "has been told" are different facts. `reset-premature-internship-verdicts`
     * clears the verdict so learners can be re-judged, and it must NOT clear this,
     * or the next sweep emails everyone a second time.
     *
     * Claimed atomically before the send, so a failed send leaves a learner
     * un-mailed rather than risking a duplicate. Under-sending is fixable by hand;
     * a second "you are certified" email is not.
     */
    closureEmailSentAt: { type: Date, default: undefined },

    /**
     * When the learner was told their certificate is still being prepared, sent
     * when they passed but generation failed permanently.
     *
     * Tracked apart from {@link closureEmailSentAt} because it is an interim
     * notice, not the final word. Once ops repair and re-queue the job, the
     * learner still needs the real certificate email, so this one deliberately
     * does not consume the terminal slot.
     */
    closurePendingEmailSentAt: { type: Date, default: undefined },

    /**
     * Program length chosen at registration (`internshipDuration` in applicationAnswers), in months.
     * Required — it anchors `endDate`, which drives the certification exam day
     * AND the certificate verdict. A missing value would leave the enrollment
     * with no deadline, invisible to the evaluation worker forever.
     */
    programDurationMonths: {
      type: Number,
      required: [true, "Program duration (months) is required"],
      min: 1,
      max: 120,
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
// Sparse: only docs actually selected into the programme carry `enrolledAt`
// (pipeline states don't). Serves the admin dashboard's "today's / total
// enrolled" range counts and admin enrolledAt date-range filters.
internshipEnrollmentSchema.index({ enrolledAt: 1 }, { sparse: true });

// Serves the certificate-evaluation enqueuer: enrolled rows whose program
// window has closed and that have not yet been judged.
internshipEnrollmentSchema.index({ status: 1, endDate: 1 });
internshipEnrollmentSchema.plugin(brandPlugin, { fixed: "edulyt" });

// `endDate` is derived from the COHORT start + the learner's chosen duration —
// NOT `enrolledAt`. `enrolledAt` is set when an admin approves the learner or
// when the offer-letter worker runs, days or weeks after the cohort begins;
// anchoring on it gave the learner a different window than the task calendar
// they are actually shown (getLearnerProgramBySlug anchors on the cohort start),
// so the certificate was graded against a pool that didn't match their work.
internshipEnrollmentSchema.pre("save", function (next) {
  const startRaw = this.batchSnapshot?.internshipStartDate;
  const cohortStart = startRaw ? new Date(startRaw) : null;
  const months =
    typeof this.programDurationMonths === "number"
      ? this.programDurationMonths
      : null;
  if (
    cohortStart &&
    !Number.isNaN(cohortStart.getTime()) &&
    months &&
    months > 0
  ) {
    this.endDate = computeProgramEndDate(cohortStart, months);
  } else {
    this.endDate = undefined;
  }
  next();
});

export const InternshipEnrollmentModel = mongoose.model(
  "InternshipEnrollment",
  internshipEnrollmentSchema,
);
