"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, Hourglass, Ticket } from "lucide-react";
import type { InternshipEnrollmentListRow } from "@/types";
import { cn } from "@/lib/utils";
import ExamCountdownButton from "./ExamCountdownButton";

function statusBadgeClass(status: string) {
  if (status === "enrolled")
    return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "completed")
    return "bg-slate-200 text-slate-900 border-slate-300";
  if (status === "in_merit_pool" || status === "exam_attempted")
    return "bg-amber-200/90 text-amber-950 border-amber-300";
  if (status === "exam_registered")
    return "bg-sky-100 text-sky-900 border-sky-200";
  if (status === "payment_pending")
    return "bg-orange-200 text-orange-950 border-orange-300";
  if (
    status === "dropped" ||
    status === "revoked" ||
    status === "admin_rejected"
  )
    return "bg-stone-200 text-stone-800 border-stone-300";
  if (status === "paused")
    return "bg-violet-100 text-violet-900 border-violet-200";
  return "bg-stone-100 text-stone-800 border-stone-200";
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function formatCohortDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

type Props = { row: InternshipEnrollmentListRow };

/** Only when exam is registered but NOT yet submitted — show countdown + button. */
const EXAM_ACTION_STATUSES = new Set(["exam_registered"]);
/** Submitted / awaiting outcome — show passive waiting chip, no button. */
const EXAM_WAITING_STATUSES = new Set(["exam_attempted", "in_merit_pool"]);

export default function DashboardInternshipCard({ row }: Props) {
  const title =
    row.internshipSnapshot?.title ||
    row.internship?.title ||
    "Internship program";
  const slug =
    row.internship?.slug?.trim() || row.internshipSnapshot?.slug?.trim() || "";
  const batchName = row.batchSnapshot?.name?.trim() || "Cohort";
  const start = formatCohortDate(row.batchSnapshot?.internshipStartDate);
  const pathLabel =
    row.enrollmentType === "paid"
      ? "Paid seat"
      : row.enrollmentType === "merit"
        ? "Exam"
        : "Program";

  const showExamAction = EXAM_ACTION_STATUSES.has(row.status);
  const showExamWaiting = EXAM_WAITING_STATUSES.has(row.status);
  const ENROLLED_STATUSES = new Set(["enrolled", "completed", "paused"]);
  const programHref = slug
    ? ENROLLED_STATUSES.has(row.status)
      ? `/dashboard/internships/${encodeURIComponent(slug)}`
      : `/internships/${encodeURIComponent(slug)}`
    : null;

  return (
    <div
      className={cn(
        "group relative flex min-h-[168px] overflow-hidden rounded-2xl border-2 border-dashed border-amber-400/50",
        "bg-linear-to-br from-amber-50 via-orange-50/80 to-amber-100/40",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_8px_24px_-12px_rgba(120,60,20,0.18)]",
      )}
    >
      {/* Vertical ticket rail */}
      <div
        className="flex w-12 shrink-0 flex-col items-center justify-between border-r-2 border-dashed border-amber-400/40 bg-stone-900 py-4 text-center"
        aria-hidden
      >
        <Ticket className="h-4 w-4 text-amber-200" strokeWidth={2} />
        <span
          className="text-[0.6rem] font-bold uppercase leading-tight text-amber-100/90 [writing-mode:vertical-rl] rotate-180 tracking-[0.2em]"
          style={{ textOrientation: "mixed" }}
        >
          Intake
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
        {/* Top info */}
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-900/55">
              Internship
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                statusBadgeClass(row.status),
              )}
            >
              {formatStatusLabel(row.status)}
            </span>
            <span className="inline-flex items-center rounded-md border border-amber-800/20 bg-amber-950/5 px-2 py-0.5 text-[11px] font-medium text-amber-950/80">
              {pathLabel}
            </span>
          </div>
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-stone-900 sm:text-lg">
            {title}
          </h2>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-sm text-stone-800">{batchName}</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-stone-600">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-stone-500" />
              <span className="font-mono">Starts {start}</span>
            </span>
          </div>
        </div>

        {/* Bottom action */}
        <div className="mt-4 border-t border-dashed border-amber-800/15 pt-3">
          {showExamAction ? (
            /* Exam registered but not yet submitted — countdown + take exam */
            <div className="flex items-end justify-between gap-3">
              <p className="text-[11px] text-stone-500">
                {(() => {
                  const now = Date.now();
                  const start = row.examStartAt ? new Date(row.examStartAt).getTime() : null;
                  const end = row.examEndAt ? new Date(row.examEndAt).getTime() : null;
                  if (end && now > end) return "The exam window has closed";
                  if (start && now < start) return "Exam window hasn't opened yet";
                  return "Complete the entrance exam to confirm your seat";
                })()}
              </p>
              <ExamCountdownButton
                enrollmentId={row._id}
                examStartAt={row.examStartAt}
                examEndAt={row.examEndAt}
                examResultAt={row.examResultAt}
                size="card"
              />
            </div>
          ) : showExamWaiting ? (
            /* Exam already submitted / in merit pool — no action, just a waiting chip */
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-stone-500">
                {row.status === "exam_attempted"
                  ? "Exam submitted — results pending"
                  : "You're in the merit pool — selection pending"}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900">
                <Hourglass className="h-3 w-3" />
                Awaiting outcome
              </span>
            </div>
          ) : (
            /* Enrolled / other: standard open-program link */
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-stone-500">
                {row.internshipSuccessPoints > 0 ? (
                  <>
                    <span className="font-mono text-stone-700">
                      {row.internshipSuccessPoints}
                    </span>{" "}
                    success points
                  </>
                ) : (
              "Track your cohort on the program page"
              )}
            </p>
            {programHref ? (
              <Link
                href={programHref}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-950 underline-offset-2 transition hover:text-orange-700 hover:underline shrink-0"
              >
                {ENROLLED_STATUSES.has(row.status) ? "View tasks" : "Open program"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              ) : (
                <span className="text-xs text-stone-400">
                  Program link unavailable
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
