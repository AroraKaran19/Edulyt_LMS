"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, ChevronDown, Download, FileText, X } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

interface ReportExportMenuProps {
  /** Rows currently rendered — exported client-side, no server round-trip. */
  pageRowCount: number;
  /** Builds and downloads a CSV of the visible page. */
  onExportCurrentPage: () => void;
  /**
   * Fetches every row in `[from, to]` from the server as a CSV. Dates are
   * `YYYY-MM-DD`; either may be empty for an open-ended bound.
   */
  onExportRange: (from: string, to: string) => Promise<void>;
  /** Prefills the range modal with the filters already applied to the table. */
  initialFrom?: string;
  initialTo?: string;
  disabled?: boolean;
}

/** Today in `YYYY-MM-DD`, used to stop anyone picking a future end date. */
function todayInputValue(): string {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export default function ReportExportMenu({
  pageRowCount,
  onExportCurrentPage,
  onExportRange,
  initialFrom = "",
  initialTo = "",
  disabled = false,
}: ReportExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openRangeModal = () => {
    setFrom(initialFrom);
    setTo(initialTo);
    setOpen(false);
    setRangeOpen(true);
  };

  const submitRange = async () => {
    if (from && to && from > to) {
      toast.error("Start date must not be after the end date.");
      return;
    }
    setBusy(true);
    try {
      await onExportRange(from, to);
      setRangeOpen(false);
    } catch (err: unknown) {
      const e = err as { serverMessage?: string; message?: string };
      toast.error(e?.serverMessage ?? e?.message ?? "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const max = todayInputValue();

  return (
    <>
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-[#344054] transition hover:border-[#F77124] hover:text-[#F77124] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4" />
          Export CSV
          <ChevronDown className="size-3.5" />
        </button>

        {open ? (
          <div className="absolute right-0 z-50 mt-1 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <button
              type="button"
              disabled={pageRowCount === 0}
              onClick={() => {
                onExportCurrentPage();
                setOpen(false);
              }}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="mt-0.5 size-4 shrink-0 text-[#F77124]" />
              <span>
                <span className="block text-sm font-semibold text-[#1D2939]">
                  Current page
                </span>
                <span className="block text-xs text-gray-500">
                  {pageRowCount === 0
                    ? "Nothing on this page to export"
                    : `The ${pageRowCount} row${pageRowCount === 1 ? "" : "s"} shown below`}
                </span>
              </span>
            </button>

            <div className="border-t border-gray-100" />

            <button
              type="button"
              onClick={openRangeModal}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-orange-50"
            >
              <CalendarRange className="mt-0.5 size-4 shrink-0 text-[#F77124]" />
              <span>
                <span className="block text-sm font-semibold text-[#1D2939]">
                  Select date range
                </span>
                <span className="block text-xs text-gray-500">
                  Every matching row between two dates
                </span>
              </span>
            </button>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={rangeOpen}
        onClose={() => {
          if (!busy) setRangeOpen(false);
        }}
        title="Export date range"
        className="mx-4 w-full max-w-md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Exports every row whose activity falls in this window, not just the
            page on screen. Leave a field empty for an open-ended bound.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
              Start date
              <input
                type="date"
                value={from}
                max={to || max}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
              End date
              <input
                type="date"
                value={to}
                min={from || undefined}
                max={max}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
              />
            </label>
          </div>

          {!from && !to ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              No dates set, so this exports all-time data. Large exports can take
              a while.
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <WhiteButton
              type="button"
              glow={false}
              onClick={() => setRangeOpen(false)}
              disabled={busy}
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              onClick={() => void submitRange()}
              disabled={busy}
            >
              {busy ? "Preparing…" : "Download CSV"}
            </OrangeButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
