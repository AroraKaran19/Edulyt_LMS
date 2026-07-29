"use client";

import { cn } from "@/lib/utils";

export interface ReportStat {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "credit" | "debit";
}

const TONE_CLASS: Record<NonNullable<ReportStat["tone"]>, string> = {
  neutral: "text-[#1D2939]",
  credit: "text-emerald-700",
  debit: "text-red-700",
};

/**
 * Totals strip. Every figure covers the whole filtered set, not the visible
 * page, so it never contradicts the table below it.
 */
export default function ReportStats({
  stats,
  loading = false,
}: {
  stats: ReportStat[];
  loading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {s.label}
          </p>
          <p
            className={cn(
              "mt-1 text-xl font-bold tabular-nums sm:text-2xl",
              TONE_CLASS[s.tone ?? "neutral"],
              loading && "opacity-40",
            )}
          >
            {loading ? "—" : s.value}
          </p>
          {s.hint ? (
            <p className="mt-0.5 text-[11px] text-gray-400">{s.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
