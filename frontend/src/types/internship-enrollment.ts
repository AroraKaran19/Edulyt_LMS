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
  | "exam_registered"  // merit: form submitted, waiting for exam date
  | "exam_attempted"   // merit: exam submitted, result pending
  | "in_merit_pool"    // merit: passed threshold, awaiting admin seat selection
  | "admin_rejected"   // merit: admin did not select this candidate (terminal)
  | "payment_pending"  // paid: payment initiated, awaiting gateway confirmation
  | "enrolled"         // both paths: fully active enrollment
  | "completed"        // post-enrollment: program finished
  | "dropped"          // post-enrollment: voluntary withdrawal
  | "revoked"          // post-enrollment: admin-forced removal
  | "paused";          // post-enrollment: temporarily frozen

// ─── Internship snapshot ──────────────────────────────────────────────────────

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
/** Row for admin list of internship batches that run an entrance exam. */
export interface EntranceExamCohortRow {
  internshipId: string;
  internshipTitle: string;
  internshipSlug: string;
  batchId: string;
  batchName: string;
  applicationLastDate: string;
  internshipStartDate: string;
  examId: string;
  examTitle: string;
}

/** Cohort row for certification exam admin — same fields; `examId` is the certification template. */
export type CertificationExamCohortRow = EntranceExamCohortRow;

export interface InternshipEnrollmentListRow {
  _id: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    name?: string;
  } | null;
  internship: {
    _id: string;
    title: string;
    slug?: string;
  } | null;
  internshipSnapshot?: EnrollmentInternshipSnapshot;
  /** Snapshot fields; `internshipStartDate` is an ISO string over the wire. */
  batchSnapshot?: {
    batchId: string;
    name: string;
    internshipStartDate: string;
  };
  enrollmentType?: InternshipEnrollmentType;
  /** Known values match {@link InternshipEnrollmentStatus}; `string` allows API drift. */
  status: string;
  examScore?: number;
  internshipSuccessPoints: number;
  enrolledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  /** ISO — when the entrance exam window opens (populated for merit-path `exam_registered`/`exam_attempted`). */
  examStartAt?: string;
  /** ISO — when the entrance exam window closes. */
  examEndAt?: string;
  /** ISO — when the exam result will be announced. */
  examResultAt?: string;
  /**
   * Certification exam window for this learner (UTC), when the cohort assigns a template.
   * From the same rules as the server attempt gate.
   */
  certificationExamStartAt?: string;
  certificationExamEndAt?: string;
  /** Snapshot of public internship enroll form at submission. */
  applicationAnswers?: Record<string, unknown>;
  /** ISO — when application answers were saved. */
  applicationSubmittedAt?: string;
}

// ─── Learner entrance exam ────────────────────────────────────────────────────

export interface LearnerEntranceExamQuestion {
  questionId: string;
  questionText: string;
  type: "mcq" | "file_upload";
  score: number;
  options?: { optionId: string; text: string }[];
  referenceFile?: string;
}

export interface LearnerEntranceExam {
  examId: string;
  enrollmentId: string;
  internshipId: string;
  batchId: string;
  title: string;
  description: string;
  totalScore: number;
  thresholdScore?: number;
  examStartAt?: string;
  examEndAt?: string;
  examResultAt?: string;
  questions: LearnerEntranceExamQuestion[];
  /** Existing draft submission id, if the learner already started. */
  existingSubmissionId?: string;
}

// ─── Learner program detail (slug-based) ──────────────────────────────────────

export interface LearnerTaskRow {
  _id: string;
  title: string;
  description: string;
  taskType: "attendance" | "task";
  totalScore: number;
  scoreThreshold: number;
  unlockAfterDays: number;
  dueDays: number;
  questionCount: number;
  isUnlocked: boolean;
  isDue: boolean;
  visibleFrom: string;
  dueAt: string;
  submission?: {
    _id: string;
    status: string;
    totalAwardedScore: number;
  };
}

export interface LearnerProgramEnrollment {
  _id: string;
  status: string;
  enrollmentType?: string;
  enrolledAt?: string;
  internshipSuccessPoints: number;
  /** Minimum internship success points before certification exam (from internship doc). */
  certificationThreshold: number;
  /** When certificationThreshold > 0 — points still needed (0 = met). */
  certificationPointsShortfall?: number;
  /** When purchase enabled: shortfall × INR per point (rough Paytm total). */
  approxInrToReachCertificationThreshold?: number;
  internshipId: string;
  batchId: string;
  internshipSnapshot?: {
    title: string;
    slug: string;
    thumbnail?: string;
  };
  batchSnapshot?: {
    batchId: string;
    name: string;
    internshipStartDate: string;
  };
}

export interface LearnerProgramDetail {
  enrollment: LearnerProgramEnrollment;
  tasks: LearnerTaskRow[];
  /** Present when certification uses success points and admin set INR price > 0 */
  internshipSuccessPointPurchase?: {
    inrPerPoint: number;
  };
}
