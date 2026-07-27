/**
 * The single authoritative task-scheduling rule.
 *
 * A task template stores day offsets from the COHORT start; a learner's program
 * window is their own (cohort start + chosen duration in months). Those two were
 * previously reconciled independently in four places, which is how the learner
 * view, the certificate denominator and the submission guard drifted apart.
 * Every consumer now derives its answer from `computeTaskWindow`.
 *
 * Pure by design — no DB access, no Mongoose — so it unit-tests without fixtures.
 */
import { istEndOfDayUtc } from "../utils/ist";

/** A task leaving the learner fewer than this many days is not offered at all. */
export const MIN_TASK_WINDOW_DAYS = 5;

const MS_PER_DAY = 86_400_000;

export type TaskWindowInput = {
  unlockAfterDays?: number;
  dueDays?: number;
};

export type TaskWindow = {
  /** When the task opens: cohort start + unlockAfterDays. */
  visibleFrom: Date;
  /** Deadline, clamped to the learner's program end when it would overflow. */
  dueAt: Date;
  /** True when the deadline was truncated by the program end. */
  isClamped: boolean;
  /** Unlocks inside the window AND leaves >= MIN_TASK_WINDOW_DAYS. */
  isReachable: boolean;
  /**
   * The single instant submissions stop — IST end-of-day of `dueAt`.
   * Both the learner-facing "missed" badge and the server-side submission
   * guard read this, so they cannot disagree.
   */
  closesAt: Date;
};

/** Coerce to a finite, non-negative day count. */
function toDays(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function computeTaskWindow(
  task: TaskWindowInput,
  cohortStart: Date,
  programEnd: Date | null,
): TaskWindow {
  const unlockAfterDays = toDays(task.unlockAfterDays);
  const dueDays = toDays(task.dueDays);

  const visibleFrom = new Date(
    cohortStart.getTime() + unlockAfterDays * MS_PER_DAY,
  );
  const rawDue = new Date(visibleFrom.getTime() + dueDays * MS_PER_DAY);

  const hasWindow =
    programEnd instanceof Date && !Number.isNaN(programEnd.getTime());
  const endMs = hasWindow ? programEnd.getTime() : Infinity;

  const isClamped = rawDue.getTime() > endMs;
  const dueAt = isClamped ? new Date(endMs) : rawDue;

  // No window to enforce (pre-enrollment rows) → nothing is gated.
  const isReachable = !hasWindow
    ? true
    : visibleFrom.getTime() <= endMs &&
      (dueAt.getTime() - visibleFrom.getTime()) / MS_PER_DAY >=
        MIN_TASK_WINDOW_DAYS;

  return {
    visibleFrom,
    dueAt,
    isClamped,
    isReachable,
    closesAt: istEndOfDayUtc(dueAt) ?? dueAt,
  };
}
