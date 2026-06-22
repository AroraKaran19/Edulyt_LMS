"use client";

import React from "react";
import { cn } from "@/lib/utils";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

const DEFAULT_WINDOW = 5;

/** Page indices to show as direct buttons (sliding window around current). */
export function visiblePageNumbers(
  current: number,
  total: number,
  windowSize: number,
): number[] {
  if (total < 1) return [1];
  if (total <= windowSize) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = start + windowSize - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - windowSize + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Called with the 1-based page to navigate to. */
  onPageChange: (page: number) => void;
  /** Optional left-aligned summary (e.g. "120 rows total" or "Showing 1–20 of 64"). */
  summary?: React.ReactNode;
  /** Disable every control (e.g. while a page is loading). */
  disabled?: boolean;
  /** How many numbered buttons to show around the current page. */
  windowSize?: number;
  className?: string;
}

/**
 * Shared admin list pagination: First · Previous · numbered window ·
 * "Page x of y" · Next · Last. Renders nothing for a single page so callers can
 * drop it in unconditionally.
 */
const Pagination = ({
  page,
  totalPages,
  onPageChange,
  summary,
  disabled = false,
  windowSize = DEFAULT_WINDOW,
  className,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const atStart = disabled || page <= 1;
  const atEnd = disabled || page >= totalPages;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3",
        summary ? "sm:justify-between" : "sm:justify-end",
        className,
      )}
    >
      {summary != null && (
        <p className="text-sm text-gray-600 order-2 sm:order-1">{summary}</p>
      )}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end sm:flex-wrap sm:gap-2 order-1 sm:order-2">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <WhiteButton
            glow={false}
            type="button"
            className="px-3! py-1.5! text-orange-600 border-orange-200 hover:bg-orange-50"
            disabled={atStart}
            title="First page"
            onClick={() => onPageChange(1)}
          >
            First
          </WhiteButton>
          <OrangeButton
            glow={false}
            type="button"
            className="px-3! py-1.5!"
            disabled={atStart}
            title="Previous page"
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Previous
          </OrangeButton>
          {visiblePageNumbers(page, totalPages, windowSize).map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(n)}
              className={cn(
                "min-w-9 px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                n === page
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-orange-50/80 hover:border-orange-200",
              )}
            >
              {n}
            </button>
          ))}
          <span className="text-sm text-gray-600 px-1 sm:px-2 whitespace-nowrap tabular-nums">
            Page {page} of {totalPages}
          </span>
          <OrangeButton
            glow={false}
            type="button"
            className="px-3! py-1.5!"
            disabled={atEnd}
            title="Next page"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            Next
          </OrangeButton>
          <WhiteButton
            glow={false}
            type="button"
            className="px-3! py-1.5! text-orange-600 border-orange-200 hover:bg-orange-50"
            disabled={atEnd}
            title="Last page"
            onClick={() => onPageChange(totalPages)}
          >
            Last
          </WhiteButton>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
