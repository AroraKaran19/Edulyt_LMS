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

export function entranceAttentionSummary(status: string): string {
  return STATUS_USER_SUMMARY[status] ?? "Next steps for this program are in progress.";
}

export function entranceAttentionLabel(status: string): string {
  if (status === "exam_registered") return "Entrance exam scheduled / pending";
  if (status === "exam_attempted") return "Exam submitted — pending outcome";
  if (status === "in_merit_pool") return "In merit pool — selection pending";
  return "Pending";
}
