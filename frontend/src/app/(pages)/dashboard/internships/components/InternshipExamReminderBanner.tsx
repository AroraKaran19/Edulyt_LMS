"use client";

import { CalendarDays } from "lucide-react";
import type { InternshipEnrollmentListRow } from "@/types";
import { getExamWindowState } from "@/lib/internshipEntranceFlow";
import { cn } from "@/lib/utils";
import ExamCountdownButton from "./ExamCountdownButton";

type Props = {
  enrollment: InternshipEnrollmentListRow;
};

/**
 * The exam is a scheduled, gated event, so the banner reads as a "gate pass":
 * a state-coloured accent rail, the program on the body, and the live countdown
 * framed like a detachable ticket stub. The rail/dot colour encodes where the
 * exam window stands (upcoming / open / closed) — structure carrying meaning
 * rather than decoration.
 */
const STATE_STYLES = {
  not_yet: {
    rail: "from-amber-400 to-orange-400",
    dot: "bg-amber-500",
    stub: "bg-amber-50/70",
    perforation: "border-amber-300",
    eyebrow: "text-amber-700",
    word: "Scheduled",
  },
  open: {
    rail: "from-emerald-400 to-green-500",
    dot: "bg-emerald-500",
    stub: "bg-emerald-50/60",
    perforation: "border-emerald-300",
    eyebrow: "text-emerald-700",
    word: "Open now",
  },
  closed: {
    rail: "from-stone-300 to-stone-400",
    dot: "bg-stone-400",
    stub: "bg-stone-50",
    perforation: "border-stone-300",
    eyebrow: "text-stone-500",
    word: "Awaiting results",
  },
} as const;

export default function InternshipExamReminderBanner({ enrollment }: Props) {
  const title =
    enrollment.internshipSnapshot?.title ||
    enrollment.internship?.title ||
    "Program";

  const state = getExamWindowState(
    enrollment.examStartAt,
    enrollment.examEndAt,
  );
  const s = STATE_STYLES[state];

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
      role="status"
    >
      {/* State rail — the exam window's status, read at a glance. */}
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1.5 bg-linear-to-b", s.rail)}
      />

      <div className="flex flex-col sm:flex-row sm:items-stretch">
        {/* Ticket body: what and which cohort */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-3 pl-5 pr-4">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full", s.dot)} />
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-[0.16em]",
                s.eyebrow,
              )}
            >
              Entrance exam
            </span>
            <span className="text-[11px] font-semibold text-stone-300">·</span>
            <span className="text-[11px] font-semibold text-stone-500">
              {s.word}
            </span>
          </div>
          <p className="truncate text-[15px] font-bold text-stone-900">
            {title}
          </p>
          {enrollment.batchSnapshot?.name && (
            <p className="flex items-center gap-1.5 truncate text-xs text-stone-500">
              <CalendarDays className="size-3.5 shrink-0 text-stone-400" />
              {enrollment.batchSnapshot.name}
            </p>
          )}
        </div>

        {/* Ticket stub: the live countdown is the hero, framed by a perforation */}
        <div
          className={cn(
            "flex items-center justify-end border-t border-dashed px-4 py-3 sm:border-t-0 sm:border-l sm:px-5",
            s.perforation,
            s.stub,
          )}
        >
          <ExamCountdownButton
            enrollmentId={enrollment._id}
            examStartAt={enrollment.examStartAt}
            examEndAt={enrollment.examEndAt}
            examResultAt={enrollment.examResultAt}
            size="banner"
          />
        </div>
      </div>
    </div>
  );
}
