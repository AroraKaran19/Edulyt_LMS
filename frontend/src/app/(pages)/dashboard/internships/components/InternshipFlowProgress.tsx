import { cn } from "@/lib/utils";

/** The learner-facing journey, in order. The progress bar fills up to the
 *  stage the enrollment has currently reached. */
const STAGES = [
  "Register",
  "Entrance exam",
  "Selection",
  "Documents",
  "Tasks",
  "Certificate",
] as const;

/** Shorter labels for the per-segment captions so they fit under the bar. */
const STAGE_LABELS = [
  "Register",
  "Exam",
  "Selection",
  "Docs",
  "Tasks",
  "Certificate",
] as const;

/** Furthest stage reached for a given enrollment status (index into STAGES).
 *  Paid-path learners skip exam/selection; those segments simply read as
 *  cleared once they're past them. */
function stageIndexForStatus(status: string): number {
  switch (status) {
    case "payment_pending":
      return 0;
    case "exam_registered":
      return 1;
    case "exam_attempted":
    case "in_merit_pool":
    case "admin_rejected":
      return 2;
    case "offer_letter_pending":
    case "pending_documentation":
    case "docs_under_review":
    case "re_pending_documentation":
      return 3;
    case "enrolled":
    case "paused":
      return 4;
    case "completed":
      return 5;
    default:
      return 0;
  }
}

type Props = {
  status: string;
  /** Merit no-show or admin rejection — mark the current stage as blocked. */
  failedOrMissed?: boolean;
  className?: string;
};

/**
 * Compact progress bar showing where the learner is in the internship flow
 * (Register → Entrance exam → Selection → Documents → Internship → Certificate).
 * The reached stages fill green; the current one is the brightest.
 */
export default function InternshipFlowProgress({
  status,
  failedOrMissed = false,
  className,
}: Props) {
  // A withdrawn/revoked enrollment has no meaningful position in the flow.
  if (status === "dropped" || status === "revoked") return null;

  const idx = stageIndexForStatus(status);
  const currentLabel = failedOrMissed
    ? status === "admin_rejected"
      ? "Not selected"
      : "Entry closed"
    : status === "completed"
      ? "Completed"
      : STAGES[idx];

  return (
    <div className={cn("pt-1", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[11px] font-semibold",
            failedOrMissed ? "text-rose-600" : "text-emerald-700",
          )}
        >
          {currentLabel}
        </span>
        <span className="text-[10px] font-medium text-stone-400">
          Step {Math.min(idx + 1, STAGES.length)} of {STAGES.length}
        </span>
      </div>
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STAGES.length}
        aria-valuenow={idx + 1}
        aria-label={`Internship stage: ${currentLabel}`}
      >
        {STAGES.map((stage, i) => (
          <div
            key={stage}
            title={stage}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < idx && "bg-emerald-300",
              i === idx && (failedOrMissed ? "bg-rose-500" : "bg-emerald-500"),
              i > idx && "bg-stone-200",
            )}
          />
        ))}
      </div>
      {/* Per-segment labels so each step is identifiable at a glance. */}
      <div className="mt-1 flex gap-1">
        {STAGE_LABELS.map((label, i) => (
          <span
            key={label}
            title={STAGES[i]}
            className={cn(
              "flex-1 truncate text-center text-[9px] leading-tight",
              i < idx && "font-medium text-emerald-600",
              i === idx &&
                (failedOrMissed
                  ? "font-bold text-rose-600"
                  : "font-bold text-emerald-700"),
              i > idx && "text-stone-400",
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
