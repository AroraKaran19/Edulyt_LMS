"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, Clock } from "lucide-react";
import {
  getExamWindowState,
  isExamResultDatePast,
  type ExamWindowState,
} from "@/lib/internshipEntranceFlow";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) {
    return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatResultDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "—";
  }
}

type Props = {
  enrollmentId: string;
  examStartAt?: string;
  examEndAt?: string;
  /** ISO string — when results will be announced. Shown instead of button once window closes. */
  examResultAt?: string;
  /** Size variant — "card" is smaller, "banner" is slightly larger */
  size?: "card" | "banner";
};

export default function ExamCountdownButton({
  enrollmentId,
  examStartAt,
  examEndAt,
  examResultAt,
  size = "card",
}: Props) {
  const [windowState, setWindowState] = useState<ExamWindowState>(() =>
    getExamWindowState(examStartAt, examEndAt),
  );
  const [countdown, setCountdown] = useState<string>("");
  const [resultDatePast, setResultDatePast] = useState<boolean>(() =>
    isExamResultDatePast(examResultAt),
  );

  useEffect(() => {
    const tick = () => {
      const state = getExamWindowState(examStartAt, examEndAt);
      setWindowState(state);
      setResultDatePast(isExamResultDatePast(examResultAt));
      if (state === "not_yet" && examStartAt) {
        const ms = new Date(examStartAt).getTime() - Date.now();
        setCountdown(formatCountdown(ms));
      } else if (state === "open" && examEndAt) {
        const ms = new Date(examEndAt).getTime() - Date.now();
        setCountdown(formatCountdown(ms));
      } else {
        setCountdown("");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [examStartAt, examEndAt, examResultAt]);

  const examHref = `/dashboard/internships/exam/${encodeURIComponent(enrollmentId)}`;
  const isBanner = size === "banner";

  // ── Closed: just show the result date, nothing else ──────────────────────
  if (windowState === "closed") {
    return (
      <div className={`flex flex-col items-end gap-1 shrink-0 ${isBanner ? "" : ""}`}>
        <span
          className={`flex items-center gap-1.5 font-medium ${
            isBanner ? "text-sm text-stone-600" : "text-xs text-stone-500"
          }`}
        >
          Exam window closed
        </span>
        {examResultAt && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl border border-amber-300/70 bg-amber-50 font-semibold text-amber-950 ${
              isBanner ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"
            }`}
          >
            <CalendarCheck className={isBanner ? "w-4 h-4" : "w-3.5 h-3.5"} />
            {resultDatePast
              ? "Results going live shortly"
              : `Results on ${formatResultDate(examResultAt)}`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      {/* Timer label */}
      {windowState === "not_yet" && countdown && (
        <div
          className={`flex items-center gap-1.5 font-mono font-bold tabular-nums ${
            isBanner ? "text-sm text-amber-950" : "text-xs text-amber-900"
          }`}
        >
          <Clock className={`shrink-0 ${isBanner ? "w-4 h-4" : "w-3.5 h-3.5"}`} />
          <span>Opens in {countdown}</span>
        </div>
      )}
      {windowState === "open" && countdown && (
        <div
          className={`flex items-center gap-1.5 font-mono font-bold tabular-nums ${
            isBanner ? "text-sm text-emerald-800" : "text-xs text-emerald-700"
          }`}
        >
          <Clock className={`shrink-0 ${isBanner ? "w-4 h-4" : "w-3.5 h-3.5"}`} />
          <span>Closes in {countdown}</span>
        </div>
      )}

      {/* Button */}
      {windowState === "open" ? (
        <Link
          href={examHref}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 font-bold text-amber-200 hover:bg-stone-800 transition ${
            isBanner ? "px-5 py-2.5 text-sm" : "px-3 py-2 text-xs"
          }`}
        >
          Take entrance exam
          <ArrowUpRight className={isBanner ? "w-4 h-4" : "w-3.5 h-3.5"} />
        </Link>
      ) : (
        /* not_yet */
        <span
          aria-disabled="true"
          title="Exam has not opened yet"
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-200/70 font-bold text-stone-400 cursor-not-allowed select-none ${
            isBanner ? "px-5 py-2.5 text-sm" : "px-3 py-2 text-xs"
          }`}
        >
          <Clock className={isBanner ? "w-4 h-4" : "w-3.5 h-3.5"} />
          Exam not open yet
        </span>
      )}
    </div>
  );
}
