import { User } from ".";

// ─── Primitives ───────────────────────────────────────────────────────────────

/**
 * How the learner earned their seat in an internship batch.
 *
 * merit — sat the entrance exam, crossed the threshold score, and was
 *         manually selected by an admin from the merit pool.
 * paid  — paid the batch price; admission is immediate with no admin step.
 */
export type InternshipEnrollmentType = "merit" | "paid";

/**
 * Full lifecycle of an internship enrollment.
 *
 * ── Merit path ────────────────────────────────────────────────────────────────
 *
 *   exam_registered
 *     └─ User completed the enrollment form; waiting for the exam date.
 *   exam_attempted
 *     └─ User submitted the entrance exam; automated scoring pending.
 *   in_merit_pool
 *     └─ Score ≥ thresholdScore; added to the candidate pool.
 *        Being here does NOT guarantee a seat — admin picks from the pool.
 *   admin_rejected  (terminal)
 *     └─ Admin did not select this candidate.
 *   enrolled
 *     └─ Seat confirmed; tasks and exams start unlocking.
 *
 * ── Paid path ─────────────────────────────────────────────────────────────────
 *
 *   payment_pending
 *     └─ Payment initiated but not yet confirmed by the gateway.
 *   enrolled
 *     └─ Payment confirmed; immediate enrollment, no admin step.
 *
 * ── Post-enrollment ───────────────────────────────────────────────────────────
 *
 *   completed  — learner finished the internship program.
 *   dropped    — learner voluntarily withdrew.
 *   revoked    — admin forcibly removed the learner.
 *   paused     — enrollment temporarily frozen (e.g. medical leave).
 */
export type InternshipEnrollmentStatus =
  | "exam_registered"           // merit: form submitted, waiting for exam date
  | "exam_attempted"            // merit: exam submitted, result pending
  | "in_merit_pool"             // merit: passed threshold, awaiting admin seat selection
  | "admin_rejected"            // merit: admin did not select this candidate (terminal)
  | "payment_pending"           // paid: payment initiated, awaiting gateway confirmation
  | "pending_documentation"     // both paths: selected, awaiting Aadhar + photo upload
  | "docs_under_review"         // both paths: learner submitted docs, awaiting admin verification
  | "offer_letter_pending"      // both paths: admin approved docs, cron will generate offer letter and enroll
  | "re_pending_documentation"  // both paths: admin rejected docs, learner must resubmit
  | "enrolled"                  // both paths: fully active enrollment
  | "completed"                 // post-enrollment: program finished
  | "dropped"                   // post-enrollment: voluntary withdrawal
  | "revoked"                   // post-enrollment: admin-forced removal
  | "paused";                   // post-enrollment: temporarily frozen

/**
 * Documentation submitted by the learner during the post-result documentation
 * phase. Aadhar number is stored as AES-256-GCM ciphertext + IV + auth tag
 * (base64). The plain number is only ever recovered for admin display.
 *
 * Submissions are only accepted within `[documentationStartAt, documentationEndAt]`.
 * Past the window the API rejects with `DOCUMENTATION_WINDOW_CLOSED` and the
 * learner is directed to the program administrator.
 */
export interface InternshipEnrollmentDocumentation {
  aadharCardNumberEnc: string;
  aadharCardNumberIv: string;
  aadharCardNumberTag: string;
  /** Public S3 URL of the learner's photo. */
  learnerPhoto: string;
  /** S3 object key, kept for cleanup if the learner re-uploads. */
  learnerPhotoS3Key: string;
  submittedAt: Date;
}

// ─── Internship snapshot ──────────────────────────────────────────────────────

/**
 * Immutable snapshot of the internship captured at enrollment time.
 */
export interface EnrollmentInternshipSnapshot {
  title: string;
  slug: string;
  thumbnail?: string;
}

// ─── Batch snapshot ───────────────────────────────────────────────────────────

/**
 * Immutable snapshot of the batch the learner enrolled into, captured at the
 * moment of enrollment.
 *
 * Batches are embedded subdocuments inside the Internship document (not a
 * separate collection).  Storing a snapshot here keeps the enrollment
 * self-contained — displaying or querying batch details never requires
 * fetching the full parent Internship document.
 *
 * `batchId` is the MongoDB-generated `_id` of the embedded subdocument and
 * serves as the stable back-reference for lookups if needed.
 */
export interface EnrollmentBatchSnapshot {
  /** `internship.batches[n]._id` — unique identifier for the batch. */
  batchId: string;
  /** Human-readable cohort name (e.g. "Batch 2025 – July"). */
  name: string;
  /** Date the cohort officially begins. */
  internshipStartDate: Date;
}

// ─── Core enrollment document ─────────────────────────────────────────────────

export interface InternshipEnrollment {
  _id?: string;

  /** `Internship._id` — the internship program this enrollment belongs to. */
  internship: string;

  /** Snapshot of the internship captured once at enrollment time. */
  internshipSnapshot?: EnrollmentInternshipSnapshot;

  /**
   * Snapshot of the batch the learner enrolled into.
   * Captured once at enrollment time so the enrollment is self-contained.
   * See {@link EnrollmentBatchSnapshot} for field details.
   */
  batchSnapshot?: EnrollmentBatchSnapshot;

  /** `User._id` — the learner being enrolled. */
  user: string;

  /** Describes which enrollment path was used once known. */
  enrollmentType?: InternshipEnrollmentType;

  /** Current lifecycle state of this enrollment (see type definition above). */
  status: InternshipEnrollmentStatus;

  // ── Merit path ──────────────────────────────────────────────────────────────

  /** Raw score the learner achieved on the internship entrance exam. */
  examScore?: number;

  /** Timestamp of when the learner submitted the entrance exam. */
  examAttemptedAt?: Date;

  /** `User._id` of the admin who approved or rejected this merit candidate. */
  adminActionBy?: string;

  /** Timestamp of the admin's approve/reject action. */
  adminActionAt?: Date;

  /** Reason stored when an admin rejects a merit-pool candidate. */
  adminRejectionNote?: string;

  // ── Paid path ───────────────────────────────────────────────────────────────

  /** Amount charged for the guaranteed seat (in the configured currency unit). */
  paymentAmount?: number;

  /** Payment gateway order / transaction ID — used for reconciliation. */
  paymentOrderId?: string;

  /** Timestamp when the payment gateway confirmed the transaction. */
  paymentConfirmedAt?: Date;

  // ── Common ──────────────────────────────────────────────────────────────────

  /**
   * The moment the learner became fully `enrolled` (via either path).
   * Used as the anchor date for computing per-learner task / exam schedules:
   *
   *   visibleFrom = enrolledAt + template.unlockAfterDays
   *   dueAt       = enrolledAt + template.dueDays
   */
  enrolledAt?: Date;

  /**
   * KYC documents collected after result announcement. Required to leave
   * `pending_documentation` and become `enrolled` when the parent internship
   * has a documentation window configured.
   */
  documentation?: InternshipEnrollmentDocumentation;

  /** `User._id` of the admin who approved or rejected the submitted documentation. */
  documentationReviewedBy?: string;

  /** Timestamp when the admin reviewed (approved or rejected) the submitted documentation. */
  documentationReviewedAt?: Date;

  /** Rejection note set by admin when sending enrollment back to `re_pending_documentation`. */
  documentationRejectionNote?: string;

  /** Timestamp set by the offer-letter cron when it processed this enrollment. */
  offerLetterGeneratedAt?: Date;

  /**
   * Unique intern identifier assigned by the offer-letter cron, format: AI-XXXXX.
   * Printed on the generated offer letter.
   */
  internId?: string;

  /** Public S3 URL of the generated offer letter DOCX. Set by the offer-letter cron. */
  offerLetterUrl?: string;

  /**
   * Cumulative score points earned from **task** submissions in this internship.
   *
   * Incremented when a task submission transitions to `fully_reviewed` AND
   * the learner's `totalAwardedScore` meets or exceeds the task template's
   * `scoreThreshold` (both values are frozen in the submission snapshot).
   *
   * Amount added  = `totalAwardedScore` of the passing submission.
   * Exam results do NOT contribute — exams are entrance-gate events only.
   *
   * Used to determine certification eligibility.
   */
  internshipSuccessPoints: number;

  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Populated response variant ───────────────────────────────────────────────

/**
 * Shape returned by API endpoints that populate the `user` and `adminActionBy`
 * references instead of returning raw ObjectId strings.
 */
export interface InternshipEnrollmentResponse
  extends Omit<InternshipEnrollment, "user" | "adminActionBy"> {
  user: User;
  adminActionBy?: User;
}

// ─── Paginated list payload ───────────────────────────────────────────────────

export interface ListInternshipEnrollmentsResult {
  enrollments: InternshipEnrollmentResponse[];
  total: number;
  page: number;
  totalPages: number;
}
