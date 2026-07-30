"use client";

import type { ReactNode } from "react";
import { CalendarRange, Loader2, RotateCcw } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export interface DetailStat {
  label: string;
  value: string;
  tone?: "neutral" | "credit" | "debit";
}

export interface DetailLineItem {
  label: string;
  value: number;
  /** Short explanation of where this component comes from. */
  hint?: string;
}

export interface DetailSection {
  title: string;
  /** Secondary line under the title (batch names, dates, and the like). */
  subtitle?: string;
  tone?: "credit" | "debit";
  items: DetailLineItem[];
  total: number;
  /** Shown in place of the item list when the section has no activity. */
  emptyLabel?: string;
}

const TONE_TEXT = {
  neutral: "text-[#1D2939]",
  credit: "text-emerald-700",
  debit: "text-red-700",
} as const;

const SECTION_ACCENT = {
  credit: "border-emerald-200 bg-emerald-50/40",
  debit: "border-red-200 bg-red-50/40",
} as const;

interface ReportRowDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** `YYYY-MM-DD`; empty means unbounded. Omit the handlers to hide the picker. */
  from?: string;
  to?: string;
  onFromChange?: (value: string) => void;
  onToChange?: (value: string) => void;
  onClearDates?: () => void;
  loading?: boolean;
  stats: DetailStat[];
  sections: DetailSection[];
  footnote?: ReactNode;
}

function todayInputValue(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

const num = (n: number) => (n ?? 0).toLocaleString("en-IN");

/**
 * Per-row drill-down. Carries the date-range picker, so a window narrows this
 * one user's figures without touching the table behind it.
 */
export default function ReportRowDetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  from = "",
  to = "",
  onFromChange,
  onToChange,
  onClearDates,
  loading = false,
  stats,
  sections,
  footnote,
}: ReportRowDetailModalProps) {
  const showDates = Boolean(onFromChange && onToChange);
  const max = todayInputValue();
  const scoped = Boolean(from || to);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="mx-4 w-full max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        {subtitle ? (
          <p className="-mt-2 text-sm text-gray-500">{subtitle}</p>
        ) : null}

        {showDates ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <div className="flex flex-wrap items-end gap-3">
              <span className="flex items-center gap-1.5 pb-2 text-xs font-semibold text-[#344054]">
                <CalendarRange className="size-3.5 text-[#F77124]" />
                Date range
              </span>
              <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-500">
                From
                <input
                  type="date"
                  value={from}
                  max={to || max}
                  onChange={(e) => onFromChange?.(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-500">
                To
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  max={max}
                  onChange={(e) => onToChange?.(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
                />
              </label>
              {scoped ? (
                <button
                  type="button"
                  onClick={onClearDates}
                  className="inline-flex items-center gap-1 pb-2 text-[11px] font-semibold text-gray-500 transition hover:text-orange-700"
                >
                  <RotateCcw className="size-3" /> All time
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              {scoped
                ? "Figures below cover the selected window."
                : "Showing all-time figures."}
            </p>
          </div>
        ) : null}

        {/* Summary tiles */}
        <div
          className={cn(
            "grid gap-3",
            stats.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2",
          )}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-200 p-3"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                {s.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-lg font-bold tabular-nums",
                  TONE_TEXT[s.tone ?? "neutral"],
                  loading && "opacity-40",
                )}
              >
                {loading ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Itemised breakdown — every component listed, zeros included, so the
            section total is verifiable at a glance. */}
        <div className="relative flex flex-col gap-3">
          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70">
              <Loader2 className="size-5 animate-spin text-gray-400" />
            </div>
          ) : null}

          {sections.map((section) => (
            <div
              key={section.title}
              className={cn(
                "rounded-xl border p-3",
                section.tone
                  ? SECTION_ACCENT[section.tone]
                  : "border-gray-200 bg-white",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#1D2939]">
                    {section.title}
                  </h3>
                  {section.subtitle ? (
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {section.subtitle}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-bold tabular-nums",
                    TONE_TEXT[section.tone ?? "neutral"],
                  )}
                >
                  {num(section.total)}
                </span>
              </div>

              {section.total === 0 && section.emptyLabel ? (
                <p className="mt-2 text-xs text-gray-500">
                  {section.emptyLabel}
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-gray-200/70">
                  {section.items.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-baseline justify-between gap-3 py-1.5"
                    >
                      <span className="text-xs text-[#475467]">
                        {item.label}
                        {item.hint ? (
                          <span className="block text-[11px] text-gray-400">
                            {item.hint}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          item.value > 0
                            ? "font-semibold text-[#1D2939]"
                            : "text-gray-400",
                        )}
                      >
                        {num(item.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {footnote ? (
          <p className="border-t border-gray-100 pt-3 text-[11px] leading-relaxed text-gray-500">
            {footnote}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
