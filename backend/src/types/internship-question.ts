import { User } from ".";

// ─── Primitives ───────────────────────────────────────────────────────────────

export type InternshipQuestionUsageType = "exam" | "task" | "both";

export type InternshipQuestionType = "mcq" | "file_upload";

// ─── MCQ ──────────────────────────────────────────────────────────────────────

export interface InternshipMCQOption {
  _id?: string;
  text: string;
  isCorrect: boolean;
}

// ─── Shared base ──────────────────────────────────────────────────────────────

interface InternshipQuestionBase {
  _id?: string;
  questionText: string;
  type: InternshipQuestionType;
  /** Filters the question bank when an admin builds an exam or task. */
  usageType: InternshipQuestionUsageType;
  /** Maximum marks this question is worth. */
  score: number;
  isActive: boolean;
  createdBy: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Concrete question shapes ─────────────────────────────────────────────────

export interface InternshipMCQQuestion extends InternshipQuestionBase {
  type: "mcq";
  /** At least 2 options; at least 1 must have isCorrect === true. */
  options: InternshipMCQOption[];
}

export interface InternshipFileUploadQuestion extends InternshipQuestionBase {
  type: "file_upload";
  /** Optional reference file (template / dataset / instructions) set by admin. */
  referenceFile?: string;
}

/** Discriminated union — use `type` to narrow. */
export type InternshipQuestion =
  | InternshipMCQQuestion
  | InternshipFileUploadQuestion;

// ─── Populated response variants ─────────────────────────────────────────────

export interface InternshipMCQQuestionResponse
  extends Omit<InternshipMCQQuestion, "createdBy"> {
  createdBy: User;
}

export interface InternshipFileUploadQuestionResponse
  extends Omit<InternshipFileUploadQuestion, "createdBy"> {
  createdBy: User;
}

export type InternshipQuestionResponse =
  | InternshipMCQQuestionResponse
  | InternshipFileUploadQuestionResponse;

// ─── Paginated list payload ───────────────────────────────────────────────────

export interface ListInternshipQuestionsResult {
  questions: InternshipQuestionResponse[];
  total: number;
  page: number;
  totalPages: number;
}
