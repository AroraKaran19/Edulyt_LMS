import { User } from ".";

// ─── MCQ response ─────────────────────────────────────────────────────────────

/**
 * A user's answer to a single MCQ question.
 * Scored automatically on submission — `isCorrect` and `awardedScore` are set
 * by the server immediately.
 */
export interface InternshipMCQResponse {
  /** InternshipQuestion["_id"] — must match a question in templateSnapshot.questions */
  question: string;
  /** _id(s) of the option(s) the user selected. */
  selectedOptions: string[];
  isCorrect?: boolean;
  /** Full score if correct, 0 otherwise (partial credit not supported for MCQ). */
  awardedScore?: number;
}

// ─── File upload response ─────────────────────────────────────────────────────

/** One entry in the re-upload audit trail. */
export interface InternshipFileUploadEntry {
  file: string;
  uploadedAt: Date;
}

export type InternshipFileSubmissionStatus =
  | "submitted"           // user uploaded, pending review
  | "under_review"        // reviewer opened it
  | "re_upload_requested" // reviewer asked user to re-submit
  | "reviewed";           // reviewer awarded a score (final)

/**
 * A user's response to a single file-upload question.
 * Points are NOT awarded automatically — a reviewer sets `awardedScore`.
 */
export interface InternshipFileResponse {
  /** InternshipQuestion["_id"] — must match a question in templateSnapshot.questions */
  question: string;
  /** URL of the most recently uploaded file. */
  currentFile: string;
  /** Optional learner explanation (instead of or in addition to a file). */
  learnerComment?: string;
  /** Full audit trail of every upload attempt (oldest → newest). */
  uploadHistory: InternshipFileUploadEntry[];
  status: InternshipFileSubmissionStatus;
  /** Score the reviewer chose to award (≤ question.score). */
  awardedScore?: number;
  /** `Admin._id` or `Instructor._id` of the person who reviewed this response. */
  reviewedBy?: string;
  reviewedAt?: Date;
  /** Optional reviewer note / feedback shown to the user. */
  reviewNote?: string;
}

// ─── Template snapshot ────────────────────────────────────────────────────────
//
// The snapshot is written ONCE when the submission document is first created.
// It captures every field needed to render the assignment, grade responses, and
// show results — even if the live template or questions are later edited.
// Grading logic MUST read from the snapshot, never from the live documents.

/** Frozen copy of one question inside a template snapshot. */
export interface SnapshotQuestion {
  /** Original InternshipQuestion._id — used to match against mcqResponses/fileResponses. */
  questionId: string;
  questionText: string;
  type: "mcq" | "file_upload";
  /** Max points this question is worth (frozen at snapshot time). */
  score: number;
  /** Penalty deducted on a wrong MCQ answer (frozen at snapshot time). 0 = no negative marking. */
  negativeScore: number;
  /** Frozen MCQ options — includes isCorrect flags for server-side auto-grading. */
  options?: {
    optionId: string;
    text: string;
    /** Stored server-side only — never sent to the learner before submission. */
    isCorrect: boolean;
  }[];
  /**
   * Optional reference file URL for file-upload questions.
   * NOT persisted in the snapshot — resolved live from the question at read
   * time so admin replacements (better template, fixed PDF, etc.) propagate to
   * learners with existing submissions. Reference files are helper material,
   * not grading inputs.
   */
  referenceFile?: string;
}

/** Immutable snapshot of the task template written at submission-creation time. */
export interface TaskTemplateSnapshot {
  taskId: string;
  title: string;
  description: string;
  questions: SnapshotQuestion[];
  totalScore: number;
  scoreThreshold: number;
  /** Internship success points awarded on pass (marks >= scoreThreshold). */
  successPoints: number;
  unlockAfterDays: number;
  dueDays: number;
  /** When this snapshot was captured. */
  snapshotAt: Date;
}

/** Immutable snapshot of the exam template written at submission-creation time. */
export interface ExamTemplateSnapshot {
  examId: string;
  /** Frozen at snapshot time — drives review workflow (certification always needs admin sign-off). */
  examType?: "entrance" | "certification";
  title: string;
  description: string;
  questions: SnapshotQuestion[];
  totalScore: number;
  thresholdScore?: number;
  /**
   * Timing is NOT persisted in the snapshot — it can change after attempts
   * start (admins extend an entrance window, reschedule a result date). These
   * are resolved live (batch window / per-learner cert window / template
   * result date) and overlaid at read time in serializeSubmission. Optional
   * here only because the overlay populates them on the wire.
   */
  examStartAt?: Date;
  examEndAt?: Date;
  examResultAt?: Date;
  /** When this snapshot was captured. */
  snapshotAt: Date;
}

// ─── Submission ───────────────────────────────────────────────────────────────

export type InternshipSubmissionStatus =
  | "draft"              // saved but not yet submitted
  | "submitted"          // submitted; MCQ auto-graded; files or final certification review may be pending
  | "partially_reviewed" // at least one file response reviewed, others still pending (cert: not yet admin-finalized)
  | "fully_reviewed";    // entrance: all file parts done, or MCQ-only. certification: admin finalized review.

/** Shared fields on every exam / task submission. */
export interface InternshipSubmissionBase {
  _id?: string;

  /** Internship document _id — always set for reporting and access control. */
  internshipId: string;
  /**
   * Embedded batch subdocument _id on the internship — ties the submission to
   * a concrete cohort so unlock / due dates are anchored correctly.
   */
  batchId: string;
  /** User["_id"] */
  userId: string;
  /** InternshipEnrollment["_id"] — ties submission to the correct enrollment. */
  enrollmentId: string;

  mcqResponses: InternshipMCQResponse[];
  fileResponses: InternshipFileResponse[];

  /**
   * Running total of all awarded scores (MCQ auto + file reviewer).
   * Updated each time a file response is reviewed or MCQ is auto-graded.
   */
  totalAwardedScore: number;

  status: InternshipSubmissionStatus;
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/** One document per (user × exam template × internship × batch). */
export type InternshipExamSubmission = InternshipSubmissionBase & {
  submissionFor: "exam";
  /** InternshipExam template _id */
  examId: string;
  /**
   * Immutable snapshot of the exam template captured at submission creation.
   * All grading and UI rendering uses this snapshot — never the live template.
   */
  templateSnapshot: ExamTemplateSnapshot;
};

/** One document per (user × task template × internship × batch). */
export type InternshipTaskSubmission = InternshipSubmissionBase & {
  submissionFor: "task";
  /** InternshipTask template _id */
  taskId: string;
  /**
   * Immutable snapshot of the task template captured at submission creation.
   * All grading and UI rendering uses this snapshot — never the live template.
   */
  templateSnapshot: TaskTemplateSnapshot;
};

export type InternshipSubmission =
  | InternshipExamSubmission
  | InternshipTaskSubmission;

/** Response shape with user populated. */
export type InternshipSubmissionResponse =
  | (Omit<InternshipExamSubmission, "userId"> & { user: User })
  | (Omit<InternshipTaskSubmission, "userId"> & { user: User });

// ─── Paginated list payload ───────────────────────────────────────────────────

export interface ListInternshipSubmissionsResult {
  submissions: InternshipSubmissionResponse[];
  total: number;
  page: number;
  totalPages: number;
}
