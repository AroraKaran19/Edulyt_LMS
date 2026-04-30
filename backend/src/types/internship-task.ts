import { User } from ".";
import type { InternshipQuestionResponse } from "./internship-question";

// ─── Task template ────────────────────────────────────────────────────────────

/**
 * Reusable **task template** — not tied to a single internship.
 * Many internships can reference the same template; each learner submission
 * stores `internshipId`, `batchId`, and `taskId` for backtracking.
 *
 * Like exams, scheduling is **relative to each user's enrollmentDate** when
 * the template is applied in a given internship/batch context:
 *   visibleFrom = enrollmentDate + unlockAfterDays
 *   dueAt       = enrollmentDate + dueDays
 *
 * Questions must have usageType "task" or "both" in the question bank.
 *
 * **scoreThreshold** — minimum total points a learner must reach to pass;
 * must not exceed **totalScore** (sum of linked question scores).
 */
export type TaskType = "attendance" | "task";

export interface InternshipTask {
  _id?: string;
  title: string;
  description?: string;
  taskType: TaskType;

  /** IDs of questions from the question bank (usageType: "task" | "both"). */
  questions: string[];

  /** Computed sum of all question scores — stored for fast reads. */
  totalScore: number;

  /** Minimum aggregate score required to pass (≤ totalScore). */
  scoreThreshold: number;

  /**
   * Days after a user's enrollmentDate when this task becomes visible.
   * 0 = available immediately on enrollment.
   */
  unlockAfterDays: number;

  /**
   * Days after a user's enrollmentDate when this task is due.
   * Must be >= unlockAfterDays.
   */
  dueDays: number;

  isActive: boolean;
  createdBy: User["_id"];
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
