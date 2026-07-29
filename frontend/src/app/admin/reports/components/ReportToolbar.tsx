"use client";

import type { ReactNode } from "react";
import { Filter, Search } from "lucide-react";
import type { ReportFilters } from "@/types/report";

interface ReportToolbarProps {
  /** Committed filters (dates apply immediately, `q` is debounced upstream). */
  filters: ReportFilters;
  /** Raw search box value, kept separate so typing stays responsive. */
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onDateChange: (patch: Partial<Pick<ReportFilters, "from" | "to">>) => void;
  onClear: () => void;
  searchPlaceholder?: string;
  /** The export menu. */
  actions?: ReactNode;
}

function todayInputValue(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

/** Date range + search + export row shared by every report page. */
export default function ReportToolbar({
  filters,
  searchInput,
  onSearchInputChange,
  onDateChange,
  onClear,
  searchPlaceholder = "Search by name or email",
  actions,
}: ReportToolbarProps) {
  const max = todayInputValue();
  const hasFilters =
    Boolean(filters.from) || Boolean(filters.to) || Boolean(searchInput);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
      <label className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
        From
        <input
          type="date"
          value={filters.from}
          max={filters.to || max}
          onChange={(e) => onDateChange({ from: e.target.value })}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
        To
        <input
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          max={max}
          onChange={(e) => onDateChange({ to: e.target.value })}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
        />
      </label>

      <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-medium text-[#344054]">
        Search
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
          />
        </div>
      </label>

      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 px-2 py-2 text-xs font-semibold text-gray-500 transition hover:text-orange-700"
        >
          <Filter className="size-3.5" /> Clear
        </button>
      ) : null}

      {actions ? <div className="ml-auto">{actions}</div> : null}
    </div>
  );
}
