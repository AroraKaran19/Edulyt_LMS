"use client";

import { useState } from "react";
import { Calendar, Check, Download, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { cn } from "@/lib/utils";
import type { ExcelRow } from "@/lib/exportToExcel";
import {
  fetchAllPages,
  fetchRowRange,
  type PageFetcher,
} from "@/lib/fetchAllPages";
import { istDateOnlyToUtcIso, istEndOfDayToUtcIso } from "@/lib/ist";

export interface ExportStatusOption {
  value: string;
  label: string;
  group?: string;
}

export interface ExportDateRange {
  enrolledFrom?: string;
  enrolledTo?: string;
}

type Scope = "current" | "pages" | "dates";
type Phase = "fetching" | "generating";

// Workbook generation is synchronous, so let the loader paint before it blocks.
const nextPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => setTimeout(resolve, 0)),
  );

interface Props<T> {
  fileName: string;
  statusOptions: ExportStatusOption[];
  defaultStatuses: string[];
  currentRows: T[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  /** Largest `limit` the list endpoint accepts. */
  chunkSize: number;
  fetchTablePage: PageFetcher<T>;
  fetchRangePage: (
    range: ExportDateRange,
    statuses: string[],
  ) => PageFetcher<T>;
  statusOf: (row: T) => string;
  toExcelRow: (row: T) => ExcelRow;
  defaultDateFrom?: string;
  defaultDateTo?: string;
  disabled?: boolean;
}

const SCOPES: { value: Scope; label: string }[] = [
  { value: "current", label: "Current page" },
  { value: "pages", label: "Specific pages" },
  { value: "dates", label: "Enrollment date range" },
];

const inputClass =
  "border border-gray-300 rounded-xl bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all shadow-sm";

export default function EnrollmentExport<T>({
  fileName,
  statusOptions,
  defaultStatuses,
  currentRows,
  currentPage,
  totalPages,
  pageSize,
  chunkSize,
  fetchTablePage,
  fetchRangePage,
  statusOf,
  toExcelRow,
  defaultDateFrom = "",
  defaultDateTo = "",
  disabled = false,
}: Props<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("current");
  const [pageFrom, setPageFrom] = useState("");
  const [pageTo, setPageTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [progress, setProgress] = useState(0);
  const [rowCount, setRowCount] = useState(0);

  const busy = phase !== null;

  const open = () => {
    setScope("current");
    setPageFrom(String(currentPage));
    setPageTo(String(currentPage));
    setDateFrom(defaultDateFrom);
    setDateTo(defaultDateTo);
    setStatuses(defaultStatuses);
    setPhase(null);
    setIsOpen(true);
  };

  const close = () => {
    if (!busy) setIsOpen(false);
  };

  const toggleStatus = (value: string) =>
    setStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );

  const from = Number(pageFrom);
  const to = Number(pageTo);
  const matchingOnPage = currentRows.filter((r) =>
    statuses.includes(statusOf(r)),
  ).length;

  let error: string | null = null;
  if (statuses.length === 0) error = "Pick at least one status.";
  else if (scope === "pages") {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < 1)
      error = "Enter whole page numbers.";
    else if (from > to) error = "The first page must not be after the last.";
    else if (to > totalPages)
      error = `There ${totalPages === 1 ? "is" : "are"} only ${totalPages} page${totalPages === 1 ? "" : "s"}.`;
  } else if (scope === "dates" && dateFrom && dateTo && dateFrom > dateTo) {
    error = "The start date must not be after the end date.";
  }

  const fileSuffix =
    scope === "current"
      ? `page-${currentPage}`
      : scope === "pages"
        ? from === to
          ? `page-${from}`
          : `pages-${from}-${to}`
        : dateFrom || dateTo
          ? `${dateFrom || "start"}-to-${dateTo || "today"}`
          : "all-dates";

  const runExport = async () => {
    if (error || busy) return;
    setProgress(0);
    setPhase(scope === "current" ? "generating" : "fetching");
    const onProgress = (done: number, total: number) =>
      setProgress(Math.round((done / Math.max(1, total)) * 100));
    try {
      const keep = (rows: T[]) =>
        rows.filter((r) => statuses.includes(statusOf(r)));
      let rows: T[];
      if (scope === "current") {
        rows = keep(currentRows);
      } else if (scope === "pages") {
        rows = keep(
          await fetchRowRange(
            fetchTablePage,
            (from - 1) * pageSize,
            to * pageSize,
            chunkSize,
            onProgress,
          ),
        );
      } else {
        const range: ExportDateRange = {
          enrolledFrom: istDateOnlyToUtcIso(dateFrom) ?? undefined,
          enrolledTo: istEndOfDayToUtcIso(dateTo) ?? undefined,
        };
        rows = await fetchAllPages(
          fetchRangePage(range, statuses),
          chunkSize,
          onProgress,
        );
      }
      if (!rows.length) {
        toast.info("No enrollments match these options.");
        return;
      }
      setRowCount(rows.length);
      setPhase("generating");
      const { exportRowsToExcel } = await import("@/lib/exportToExcel");
      await nextPaint();
      exportRowsToExcel(rows.map(toExcelRow), {
        fileName: `${fileName}-${fileSuffix}`,
        sheetName: "Enrollments",
      });
      toast.success(
        `Exported ${rows.length} enrollment${rows.length === 1 ? "" : "s"}.`,
      );
      setIsOpen(false);
    } catch (e) {
      console.error("Excel export failed:", e);
      toast.error("Could not export to Excel.");
    } finally {
      setPhase(null);
    }
  };

  const groups = Array.from(new Set(statusOptions.map((o) => o.group ?? "")));

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={disabled}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#F77124] bg-white px-3 py-2 text-sm font-semibold text-[#F77124] transition-colors hover:bg-[#FFF4EB] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        <Download className="size-4" />
        Export to Excel
      </button>

      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Export enrollments"
        className="max-w-xl"
      >
        <div className="space-y-6">
          <fieldset
            disabled={busy}
            className={cn("space-y-6", busy && "opacity-60")}
          >
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-gray-900">
                What to export
              </legend>
              {SCOPES.map((s) => {
                const selected = scope === s.value;
                return (
                  <label
                    key={s.value}
                    className={cn(
                      "block cursor-pointer rounded-xl border p-3 transition-colors",
                      selected
                        ? "border-orange-400 bg-orange-50/60"
                        : "border-gray-200 hover:border-orange-300",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="export-scope"
                        value={s.value}
                        checked={selected}
                        onChange={() => setScope(s.value)}
                        className="mt-0.5 accent-orange-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {s.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {s.value === "current" &&
                            `Page ${currentPage} of ${totalPages}. ${matchingOnPage} of ${currentRows.length} rows match the statuses below.`}
                          {s.value === "pages" &&
                            `Pages as numbered in the table, ${pageSize} rows each.`}
                          {s.value === "dates" &&
                            "Every enrollment in the window, across all pages. Leave a side empty to keep it open."}
                        </p>

                        {selected && s.value === "pages" && (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={totalPages}
                              value={pageFrom}
                              onChange={(e) => setPageFrom(e.target.value)}
                              aria-label="First page"
                              className={cn(inputClass, "w-24 px-3 py-2")}
                            />
                            <span className="text-sm text-gray-400">to</span>
                            <input
                              type="number"
                              min={1}
                              max={totalPages}
                              value={pageTo}
                              onChange={(e) => setPageTo(e.target.value)}
                              aria-label="Last page"
                              className={cn(inputClass, "w-24 px-3 py-2")}
                            />
                            <span className="text-xs text-gray-500">
                              of {totalPages}
                            </span>
                          </div>
                        )}

                        {selected && s.value === "dates" && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {[
                              {
                                value: dateFrom,
                                set: setDateFrom,
                                label: "From",
                              },
                              { value: dateTo, set: setDateTo, label: "To" },
                            ].map((d, i) => (
                              <div
                                key={d.label}
                                className="flex items-center gap-2"
                              >
                                {i === 1 && (
                                  <span className="text-sm text-gray-400">
                                    to
                                  </span>
                                )}
                                <div className="relative">
                                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="date"
                                    value={d.value}
                                    onChange={(e) => d.set(e.target.value)}
                                    aria-label={`Enrolled ${d.label.toLowerCase()}`}
                                    className={cn(
                                      inputClass,
                                      "w-40 py-2 pl-9 pr-3",
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </fieldset>

            <fieldset>
              <div className="mb-1 flex items-center justify-between gap-3">
                <legend className="text-sm font-semibold text-gray-900">
                  Statuses
                </legend>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() =>
                      setStatuses(statusOptions.map((o) => o.value))
                    }
                    className="text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatuses([])}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p className="mb-3 text-xs text-gray-500">
                {scope === "dates"
                  ? "Replaces the table's status filter. Your search and other filters still apply."
                  : "Rows on the chosen pages are narrowed to these statuses."}
              </p>
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group || "all"}>
                    {group && (
                      <p className="mb-1.5 text-xs font-medium text-gray-500">
                        {group}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {statusOptions
                        .filter((o) => (o.group ?? "") === group)
                        .map((o) => {
                          const on = statuses.includes(o.value);
                          return (
                            <button
                              key={o.value}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggleStatus(o.value)}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                                on
                                  ? "border-orange-400 bg-orange-50 text-orange-800"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-orange-300",
                              )}
                            >
                              {on && <Check className="h-3 w-3" />}
                              {o.label}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          </fieldset>

          {busy && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4"
            >
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-orange-600" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-orange-900">
                    {phase === "fetching"
                      ? "Fetching enrollments…"
                      : `Generating Excel file for ${rowCount} enrollment${rowCount === 1 ? "" : "s"}…`}
                  </p>
                  {phase === "fetching" && (
                    <span className="text-xs font-semibold tabular-nums text-orange-700">
                      {progress}%
                    </span>
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-100">
                  {phase === "fetching" ? (
                    <div
                      className="h-full rounded-full bg-orange-500 transition-[width] duration-300"
                      style={{ width: `${Math.max(4, progress)}%` }}
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-full bg-orange-500" />
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-h-5 text-sm text-rose-600">
              {busy ? null : error}
            </p>
            <div className="flex justify-end gap-3">
              <WhiteButton onClick={close} disabled={busy}>
                Cancel
              </WhiteButton>
              <button
                type="button"
                onClick={runExport}
                disabled={!!error || busy}
                aria-busy={busy}
                className={cn(
                  "inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
                  busy && "disabled:cursor-wait disabled:opacity-100",
                )}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {busy ? "Exporting…" : "Export"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
