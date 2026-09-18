"use client";

import { useState } from "react";
import { StickyNote, X } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { type Lead } from "./types";

/** Matches the cap the note write applies server-side, so nothing is silently cut. */
const NOTE_MAX = 2000;

/**
 * The note on its own, for editing straight from a row. The full details modal
 * carries the same field; this one exists so logging a call does not mean
 * loading everything else about the lead first.
 */
export default function LeadNoteModal({
  leadId,
  leadName,
  initialNote,
  scope = "admin",
  onClose,
  onSaved,
}: {
  leadId: string;
  leadName: string;
  initialNote: string;
  scope?: "admin" | "mine";
  onClose: () => void;
  onSaved: (lead: Lead) => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const base = scope === "mine" ? "/leads/mine" : "/leads/admin";
      const res = await apiClient.patch(`${base}/${leadId}`, { note });
      onSaved(res.data?.data?.lead as Lead);
      toast.success(note.trim() ? "Note saved" : "Note cleared");
    } catch (e) {
      const err = e as {
        response?: { data?: { message?: string; error?: { message?: string } } };
      };
      toast.error(
        err?.response?.data?.error?.message ??
          err?.response?.data?.message ??
          "Could not save this note",
      );
      setSaving(false);
    }
  };

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
              <StickyNote className="size-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Note</h2>
              <p className="text-xs text-gray-500">{leadName}</p>
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

        <div className="px-5 py-5">
          <textarea
            id="lead-row-note"
            rows={5}
            autoFocus
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened on the call?"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400"
          />
          <p className="mt-1.5 text-right text-xs text-gray-400">
            {note.length}/{NOTE_MAX}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <WhiteButton type="button" glow={false} onClick={onClose}>
            Cancel
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            disabled={saving || note === initialNote}
            onClick={save}
          >
            {saving ? "Saving…" : "Save note"}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
}
