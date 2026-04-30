import { User } from ".";

export type InternshipQuestionUsageType = "exam" | "task" | "both";

export type InternshipQuestionType = "mcq" | "file_upload";

export interface InternshipMCQOption {
  _id?: string;
  text: string;
  isCorrect: boolean;
}

interface InternshipQuestionBase {
  _id?: string;
  questionText: string;
  type: InternshipQuestionType;
  usageType: InternshipQuestionUsageType;
  score: number;
  isActive: boolean;
  createdBy?: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Concrete question shapes ─────────────────────────────────────────────────

export interface InternshipMCQQuestion extends InternshipQuestionBase {
  type: "mcq";
  options: InternshipMCQOption[];
}

export interface InternshipFileUploadQuestion extends InternshipQuestionBase {
  type: "file_upload";
  referenceFile?: string;
}

export type InternshipQuestion =
  | InternshipMCQQuestion
  | InternshipFileUploadQuestion;

// ─── Populated response variants (admin list / detail) ────────────────────────

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
