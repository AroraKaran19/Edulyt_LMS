"use client";

import Pagination from "@/components/admin/Pagination";

export const REPORT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/** Rows-per-page selector + range summary + pagination. */
export default function ReportTableFooter({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  loading,
  summary,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  loading: boolean;
  summary: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-[#475467]">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
          >
            {REPORT_PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-gray-500">{summary}</span>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        disabled={loading}
      />
    </div>
  );
}
