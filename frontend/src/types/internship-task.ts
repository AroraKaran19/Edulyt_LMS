import { User } from ".";
import type { InternshipQuestionResponse } from "./internship-question";

// ─── Task template ────────────────────────────────────────────────────────────

/**
 * Reusable **task template** — not tied to a single internship.
 * Many internships can reference the same template; each learner submission
 * stores `internshipId`, `batchId`, and `taskId` for backtracking.
 *
 * Scheduling is relative to the **cohort start date**
 * (`batchSnapshot.internshipStartDate`), not the learner's enrollment date:
 *   visibleFrom = cohortStart + unlockAfterDays
 *   dueAt       = min(visibleFrom + dueDays, learner's program end)
 * A task that opens outside the learner's duration, or leaves them fewer than
 * 5 days, is neither shown nor counted. See backend `internshipTaskWindow.ts`.
 *
 * Questions must have usageType "task" or "both" in the question bank.
 *
 * **scoreThreshold** — minimum total points to pass; must not exceed **totalScore**.
 */
export interface InternshipTask {
  _id?: string;
  title: string;
  description?: string;

  /** IDs of questions from the question bank (usageType: "task" | "both"). */
  questions: string[];

  /** Computed sum of all question scores — stored for fast reads. */
  totalScore: number;

  /** Minimum aggregate marks required to pass (≤ totalScore). */
  scoreThreshold: number;

  /** Internship success points awarded once the learner passes (marks ≥ scoreThreshold). */
  successPoints: number;

  /**
   * Days after the COHORT start when this task becomes visible.
   * 0 = available immediately when the cohort begins.
   */
  unlockAfterDays: number;

  /**
   * Length of the submission window in days, measured from `unlockAfterDays`
   * (NOT an offset from the cohort start — see migrate-task-due-days.ts).
   */
  dueDays: number;

  isActive: boolean;
  createdBy?: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}

/** Response shape with questions and creator populated. */
export interface InternshipTaskResponse
  extends Omit<InternshipTask, "questions" | "createdBy"> {
  questions: InternshipQuestionResponse[];
  createdBy: User;
}

// ─── Paginated list payload ───────────────────────────────────────────────────

export interface ListInternshipTasksResult {
  tasks: InternshipTaskResponse[];
  total: number;
  page: number;
  totalPages: number;
}

/** Slim question row returned on task template detail (admin). */
export type InternshipTaskQuestionSummary = {
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  isActive: boolean;
  category: string | null;
};

/** Admin GET /internship-tasks/admin/:id — populated questions + creator. */
export type InternshipTaskTemplateDetail = {
  _id: string;
  title: string;
  description: string;
  questions: InternshipTaskQuestionSummary[];
  totalScore: number;
  scoreThreshold: number;
  successPoints: number;
  unlockAfterDays: number;
  dueDays: number;
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
