import { User } from ".";

// ─── MCQ response ─────────────────────────────────────────────────────────────

/**
 * A user's answer to a single MCQ question.
 * Scored automatically on submission.
 */
export interface InternshipMCQResponse {
  /** InternshipQuestion["_id"] — matches a question in templateSnapshot.questions */
  question: string;
  /** _id(s) of the option(s) the user selected. */
  selectedOptions: string[];
  isCorrect?: boolean;
  awardedScore?: number;
}

// ─── File upload response ─────────────────────────────────────────────────────

export interface InternshipFileUploadEntry {
  file: string;
  uploadedAt: Date;
}

export type InternshipFileSubmissionStatus =
  | "submitted"
  | "under_review"
  | "re_upload_requested"
  | "reviewed";

export interface InternshipFileResponse {
  question: string;
  currentFile: string;
  /** Written answer or context for the file (optional). */
  learnerComment?: string;
  uploadHistory: InternshipFileUploadEntry[];
  status: InternshipFileSubmissionStatus;
  awardedScore?: number;
  /** `Admin._id` or `Instructor._id` of the person who reviewed this response. */
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;
}

// ─── Template snapshot ────────────────────────────────────────────────────────
//
// Written once at submission-creation time.
// All rendering and grading reads from the snapshot — never the live template.

/** Frozen copy of one question inside a template snapshot. */
export interface SnapshotQuestion {
  questionId: string;
  questionText: string;
  type: "mcq" | "file_upload";
  score: number;
  /**
   * MCQ options.
   * NOTE: `isCorrect` is NOT included in responses sent to the learner
   * before they submit — the server strips it. It becomes visible in the
   * result view after submission.
   */
  options?: {
    optionId: string;
    text: string;
    isCorrect?: boolean;
  }[];
  /**
   * Reference file URL. Resolved live from the question on read — not stored
   * in the snapshot — so admin replacements propagate to existing submissions.
   */
  referenceFile?: string;
}

/** Frozen snapshot of the task template — written once, never mutated. */
export interface TaskTemplateSnapshot {
  taskId: string;
  title: string;
  description: string;
  questions: SnapshotQuestion[];
  totalScore: number;
  scoreThreshold: number;
  unlockAfterDays: number;
  dueDays: number;
  snapshotAt: Date | string;
}

/** Frozen snapshot of the exam template — written once, never mutated. */
export interface ExamTemplateSnapshot {
  examId: string;
  title: string;
  description: string;
  questions: SnapshotQuestion[];
  totalScore: number;
  thresholdScore?: number;
  examStartAt?: Date | string;
  examEndAt?: Date | string;
  examResultAt?: Date | string;
  /** Optional per-attempt cap in minutes. */
  duration?: number;
  unlockAfterDays: number;
  dueDays: number;
  snapshotAt: Date | string;
}

// ─── Submission ───────────────────────────────────────────────────────────────

export type InternshipSubmissionStatus =
  | "draft"
  | "submitted"
  | "partially_reviewed"
  | "fully_reviewed";

export interface InternshipSubmissionBase {
  _id?: string;
  internshipId: string;
  batchId: string;
  userId: string;
  enrollmentId: string;
  mcqResponses: InternshipMCQResponse[];
  fileResponses: InternshipFileResponse[];
  totalAwardedScore: number;
  status: InternshipSubmissionStatus;
  submittedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type InternshipExamSubmission = InternshipSubmissionBase & {
  submissionFor: "exam";
  examId: string;
  templateSnapshot: ExamTemplateSnapshot;
};

export type InternshipTaskSubmission = InternshipSubmissionBase & {
  submissionFor: "task";
  taskId: string;
  templateSnapshot: TaskTemplateSnapshot;
};

export type InternshipSubmission =
  | InternshipExamSubmission
  | InternshipTaskSubmission;

export type InternshipSubmissionResponse =
  | (Omit<InternshipExamSubmission, "userId"> & { user: User })
  | (Omit<InternshipTaskSubmission, "userId"> & { user: User });

export interface ListInternshipSubmissionsResult {
  submissions: InternshipSubmissionResponse[];
  total: number;
  page: number;
  totalPages: number;
}
