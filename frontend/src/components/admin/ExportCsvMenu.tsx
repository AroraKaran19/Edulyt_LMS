"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarRange,
  Check,
  ChevronDown,
  Download,
  FileText,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { cn } from "@/lib/utils";

/**
 * A multi-choice filter offered in the export modal, so the admin narrows the
 * export at export time without disturbing the table behind it.
 */
export interface ExportFilterGroup {
  /** Identifier the selections come back under. */
  key: string;
  label: string;
  /** Short line under the label explaining what unticking does. */
  hint?: string;
  options: { value: string; label: string }[];
  /** Defaults to every option ticked. */
  defaultSelected?: string[];
}

/** `{ [group.key]: selectedValues }` handed back on submit. */
export type ExportFilterSelections = Record<string, string[]>;

interface ExportCsvMenuProps {
  /** Rows currently rendered — exported client-side, no server round-trip. */
  pageRowCount: number;
  /**
   * Builds and downloads a CSV of the visible page, honouring the filter
   * selections the admin confirmed. Ignore the argument when the menu declares
   * no `extraFilters`.
   */
  onExportCurrentPage: (filters: ExportFilterSelections) => void;
  /**
   * Fetches every row in `[from, to]` from the server as a CSV. Dates are
   * `YYYY-MM-DD`; either may be empty for an open-ended bound.
   */
  onExportRange: (
    from: string,
    to: string,
    filters: ExportFilterSelections,
  ) => Promise<void>;
  /**
   * Checkbox groups shown in the confirm modal for BOTH export options, e.g.
   * payment status on the orders export. Every option starts ticked unless
   * `defaultSelected` says otherwise. When omitted, "Current page" downloads
   * immediately with no modal, since there would be nothing to confirm.
   */
  extraFilters?: ExportFilterGroup[];
  /** Prefills the range modal's dates. */
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

type ExportMode = "page" | "range";

export default function ExportCsvMenu({
  pageRowCount,
  onExportCurrentPage,
  onExportRange,
  extraFilters,
  initialFrom = "",
  initialTo = "",
  disabled = false,
}: ExportCsvMenuProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ExportMode | null>(null);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [busy, setBusy] = useState(false);
  const [selections, setSelections] = useState<ExportFilterSelections>({});
  const wrapRef = useRef<HTMLDivElement>(null);

  const groups = extraFilters ?? [];
  const hasGroups = groups.length > 0;

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

  /** Every option ticked, unless the group overrides it. */
  const defaultSelections = useCallback((): ExportFilterSelections => {
    const next: ExportFilterSelections = {};
    for (const g of groups) {
      next[g.key] = g.defaultSelected ?? g.options.map((o) => o.value);
    }
    return next;
  }, [groups]);

  const toggle = (groupKey: string, value: string) => {
    setSelections((prev) => {
      const current = prev[groupKey] ?? [];
      return {
        ...prev,
        [groupKey]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const openModal = (next: ExportMode) => {
    setOpen(false);
    // With nothing to confirm, a current-page export shouldn't cost a click.
    if (next === "page" && !hasGroups) {
      onExportCurrentPage({});
      return;
    }
    setFrom(initialFrom);
    setTo(initialTo);
    setSelections(defaultSelections());
    setMode(next);
  };

  const closeModal = () => {
    if (!busy) setMode(null);
  };

  // A group with nothing ticked can only produce an empty file, so block it
  // rather than hand back a header-only CSV.
  const emptyGroup = groups.find((g) => (selections[g.key] ?? []).length === 0);

  const submit = async () => {
    if (emptyGroup) {
      toast.error(`Select at least one ${emptyGroup.label.toLowerCase()}.`);
      return;
    }

    if (mode === "page") {
      onExportCurrentPage(selections);
      setMode(null);
      return;
    }

    if (from && to && from > to) {
      toast.error("Start date must not be after the end date.");
      return;
    }
    setBusy(true);
    try {
      await onExportRange(from, to, selections);
      setMode(null);
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
              onClick={() => openModal("page")}
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
              onClick={() => openModal("range")}
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
        isOpen={mode !== null}
        onClose={closeModal}
        title={
          mode === "page" ? "Export current page" : "Export date range"
        }
        className="mx-4 w-full max-w-md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            {mode === "page"
              ? `Exports the ${pageRowCount} row${pageRowCount === 1 ? "" : "s"} on screen. Narrow it below before downloading.`
              : "Exports every matching row in this window, not just the page on screen. Leave a date empty for an open-ended bound."}
          </p>

          {mode === "range" ? (
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
          ) : null}

          {groups.map((group) => {
            const selected = selections[group.key] ?? [];
            const allTicked = selected.length === group.options.length;
            return (
              <div
                key={group.key}
                className="rounded-xl border border-gray-200 bg-gray-50/70 p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#344054]">
                      {group.label}
                    </p>
                    {group.hint ? (
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {group.hint}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={allTicked}
                    onClick={() =>
                      setSelections((prev) => ({
                        ...prev,
                        [group.key]: group.options.map((o) => o.value),
                      }))
                    }
                    className="text-[11px] font-semibold text-[#F77124] transition hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
                  >
                    Select all
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {group.options.map((o) => {
                    const checked = selected.includes(o.value);
                    return (
                      <label
                        key={o.value}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition",
                          checked
                            ? "border-[#F77124] bg-white text-[#1D2939]"
                            : "border-gray-300 bg-white text-gray-500 hover:border-gray-400",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border transition",
                            checked
                              ? "border-[#F77124] bg-[#F77124] text-white"
                              : "border-gray-300",
                          )}
                        >
                          {checked ? <Check className="size-3" /> : null}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggle(group.key, o.value)}
                        />
                        {o.label}
                      </label>
                    );
                  })}
                </div>

                {selected.length === 0 ? (
                  <p className="mt-2 text-[11px] font-medium text-red-600">
                    Select at least one to export.
                  </p>
                ) : null}
              </div>
            );
          })}

          {mode === "range" && !from && !to ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              No dates set, so this exports all-time data. Large exports can take
              a while.
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <WhiteButton
              type="button"
              glow={false}
              onClick={closeModal}
              disabled={busy}
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              onClick={() => void submit()}
              disabled={busy || Boolean(emptyGroup)}
            >
              {busy ? "Preparing…" : "Download CSV"}
            </OrangeButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
