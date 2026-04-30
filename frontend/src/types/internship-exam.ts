import { User } from ".";
import type { InternshipQuestionResponse } from "./internship-question";

// ─── Exam template ────────────────────────────────────────────────────────────

/**
 * Reusable **exam template**. Exam **windows** are not stored here: entrance
 * windows live on `InternshipBatches` (`entranceExamStartAt` / `entranceExamEndAt`);
 * certification windows are computed per learner. `examResultAt` is required.
 */
export type ExamType = "entrance" | "certification";

export interface InternshipExam {
  _id?: string;
  title: string;
  description?: string;
  examType: ExamType;

  /** IDs of questions from the question bank (usageType: "exam" | "both"). */
  questions: string[];

  /** Computed sum of all question scores — stored for fast reads. */
  totalScore: number;

  /**
   * Minimum score to enter the merit candidate pool (entrance exams only).
   * Leave undefined for post-enrollment assessments.
   */
  thresholdScore?: number;

  /** When results are published for this exam. Required. */
  examResultAt: Date;

  isActive: boolean;
  createdBy?: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}

/** Response shape with questions and creator populated. */
export interface InternshipExamResponse
  extends Omit<InternshipExam, "questions" | "createdBy"> {
  questions: InternshipQuestionResponse[];
  createdBy: User;
}

/** Slim question row on exam template detail (admin). */
export type InternshipExamQuestionSummary = {
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  isActive: boolean;
};

/** Admin GET /internship-exams/admin/:id — populated questions + creator. */
export type InternshipExamTemplateDetail = {
  _id: string;
  title: string;
  description: string;
  examType: ExamType;
  questions: InternshipExamQuestionSummary[];
  totalScore: number;
  thresholdScore?: number;
  examResultAt: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

// ─── Paginated list payload ───────────────────────────────────────────────────

export interface ListInternshipExamsResult {
  exams: InternshipExamResponse[];
  total: number;
  page: number;
  totalPages: number;
}
