"use client";

import { useState } from "react";
import { UserCheck, X } from "lucide-react";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

/** Sentinel for "take this lead off whoever has it", distinct from "nothing picked". */
const UNASSIGN = "__unassign__";

/**
 * Assignment lives in a modal rather than a control inside the table: the table
 * scrolls horizontally, which clips any dropdown opened in a cell.
 */
export default function AssignLeadsModal({
  count,
  fetchAssignees,
  saving,
  onClose,
  onConfirm,
}: {
  count: number;
  fetchAssignees: (
    page: number,
    search: string,
  ) => Promise<{ items: { value: string; label: string }[]; totalPages: number }>;
  saving: boolean;
  onClose: () => void;
  onConfirm: (assigneeId: string | null, resetStatus: boolean) => void;
}) {
  const [target, setTarget] = useState("");
  const [targetLabel, setTargetLabel] = useState("");
  const [resetStatus, setResetStatus] = useState(false);

  /** Unassign is offered as the first row of page 1, never inside a search. */
  const fetchWithUnassign = async (page: number, search: string) => {
    const result = await fetchAssignees(page, search);
    if (page === 1 && !search.trim()) {
      return {
        ...result,
        items: [
          { value: UNASSIGN, label: "Unassign (return to the pool)" },
          ...result.items,
        ],
      };
    }
    return result;
  };

  const picked = Boolean(target);
  const isUnassign = target === UNASSIGN;

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <UserCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Assign leads</h2>
              <p className="text-xs text-gray-500">
                {count} lead{count === 1 ? "" : "s"} selected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          <InfiniteScrollSelect
            label="Sales person"
            value={target}
            onChange={(v) => {
              const next = String(v);
              setTarget(next);
              setTargetLabel(next === UNASSIGN ? "Unassign" : "");
            }}
            fetchOptions={fetchWithUnassign}
            selectedLabel={targetLabel || undefined}
            placeholder="Choose who works these leads"
            searchPlaceholder="Search by name or email..."
            emptyMessage="No sales users found"
            dropdownPortal
          />
          <p className="text-xs text-gray-500">
            They will see these under My leads and can change their status. Only
            an admin can reassign them afterwards.
          </p>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 px-3.5 py-3">
            <input
              type="checkbox"
              checked={resetStatus}
              onChange={(e) => setResetStatus(e.target.checked)}
              className="mt-0.5 size-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm">
              <span className="font-medium text-gray-900">
                Reset the status first
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Sends {count === 1 ? "the lead" : "every selected lead"} back to
                New / New Lead and clears the note, so the new owner starts
                fresh. The status history and who converted what are kept.
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <WhiteButton type="button" glow={false} onClick={onClose}>
            Cancel
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            disabled={saving || !picked}
            onClick={() => onConfirm(isUnassign ? null : target, resetStatus)}
          >
            {saving ? "Assigning…" : isUnassign ? "Unassign" : "Assign"}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
}
