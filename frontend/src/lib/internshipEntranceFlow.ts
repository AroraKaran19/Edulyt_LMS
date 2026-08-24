/**
 * Merit-path stages where the learner still has an action to take
 * (exam not yet submitted). Used for dashboard reminders and the entrance-exam
 * banner. `exam_attempted` and `in_merit_pool` are excluded — nothing
 * actionable there. `pending_documentation` is NOT included here because the
 * dashboard card already renders a dedicated "Submit documents" CTA for it;
 * adding it would mis-fire the entrance-exam banner.
 */
export const ENTRANCE_EXAM_ATTENTION_STATUSES = [
  "exam_registered",
] as const;

export type EntranceExamAttentionStatus =
  (typeof ENTRANCE_EXAM_ATTENTION_STATUSES)[number];

const STATUS_USER_SUMMARY: Record<string, string> = {
  exam_registered:
    "You’re registered for the entrance exam. The timer shows when it opens; use the button to start it during the window.",
  exam_attempted:
    "Your exam has been submitted. We’ll update your status when scoring or selection is complete.",
  in_merit_pool:
    "You’re in the merit pool. Seat confirmation is pending from the program team.",
};

export type ExamWindowState = "not_yet" | "open" | "closed";

/**
 * Where "now" falls relative to the entrance-exam window. Shared with
 * ExamCountdownButton so the banner label and the button can't disagree about
 * whether the window has closed.
 */
export function getExamWindowState(
  examStartAt?: string,
  examEndAt?: string,
): ExamWindowState {
  const now = Date.now();
  const start = examStartAt ? new Date(examStartAt).getTime() : null;
  const end = examEndAt ? new Date(examEndAt).getTime() : null;
  if (start && now < start) return "not_yet";
  if (end && now > end) return "closed";
  return "open";
}

export function entranceAttentionSummary(
  status: string,
  examEndAt?: string,
): string {
  // Once the window has passed, a still-`exam_registered` learner is awaiting
  // results — not "registered, exam ahead".
  if (
    status === "exam_registered" &&
    getExamWindowState(undefined, examEndAt) === "closed"
  ) {
    return "The entrance exam window has closed. We’ll update your status once results are announced.";
  }
  return STATUS_USER_SUMMARY[status] ?? "Next steps for this program are in progress.";
}

export function entranceAttentionLabel(
  status: string,
  examEndAt?: string,
): string {
  if (status === "exam_registered") {
    // "scheduled / pending" implies the exam is still to be taken. Once the
    // window has closed, the learner is waiting on results instead.
    return getExamWindowState(undefined, examEndAt) === "closed"
      ? "Awaiting results"
      : "Entrance exam scheduled / pending";
  }
  if (status === "exam_attempted") return "Exam submitted — pending outcome";
  if (status === "in_merit_pool") return "In merit pool — selection pending";
  return "Pending";
}

/**
 * Whether the announced result date has already gone by. Nothing flips an
 * unattempted `exam_registered` enrollment automatically, so a learner can sit
 * on a closed exam window weeks past the date the UI promised results. The
 * countdown pill uses this to stop naming a date that has already passed.
 */
export function isExamResultDatePast(examResultAt?: string): boolean {
  if (!examResultAt) return false;
  const at = new Date(examResultAt).getTime();
  return Number.isFinite(at) && Date.now() > at;
}

/** Days past the announced result date that the entrance-exam banner keeps standing. */
export const RESULT_BANNER_GRACE_DAYS = 7;

/**
 * Whether the entrance-exam banner has outlived its purpose: the result date
 * plus its grace window has gone by with the enrollment still unresolved.
 * No announced date means no window to expire, so the banner stays.
 */
export function isExamResultBannerExpired(examResultAt?: string): boolean {
  if (!examResultAt) return false;
  const at = new Date(examResultAt).getTime();
  if (!Number.isFinite(at)) return false;
  return Date.now() > at + RESULT_BANNER_GRACE_DAYS * 24 * 60 * 60 * 1000;
}
