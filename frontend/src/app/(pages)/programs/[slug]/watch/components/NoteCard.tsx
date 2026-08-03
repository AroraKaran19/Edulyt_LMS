"use client";

import { useState } from "react";
import { Clock, Edit, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import AddNotes from "./AddNotes";
import { VideoNote } from "@/types/notes";
import { formatTime } from "../hooks/useVideoTime";

/**
 * One note. Renders its own edit and delete affordances because a note is only
 * ever actioned by its author, so there is no permission branch to hoist.
 *
 * `canSeek` is false when the note's lecture is no longer part of the active
 * course structure (a deactivated lesson). The note stays fully readable and
 * removable in that state; only the jump is unavailable.
 */
const NoteCard = ({
  note,
  onSeek,
  onUpdate,
  onDelete,
  canSeek,
}: {
  note: VideoNote;
  onSeek: (note: VideoNote) => void;
  onUpdate: (noteId: string, content: string) => Promise<boolean>;
  onDelete: (noteId: string) => Promise<boolean>;
  canSeek: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timestampLabel = formatTime(note.timestamp);

  const handleStartEdit = () => {
    setDraft(note.content);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    const ok = await onUpdate(note._id, draft);
    setIsSaving(false);
    if (ok) setIsEditing(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const ok = await onDelete(note._id);
    setIsDeleting(false);
    if (ok) setIsConfirmingDelete(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-[#0000001A]">
      <div className="flex justify-between items-start gap-3 mb-3">
        <button
          type="button"
          onClick={() => canSeek && onSeek(note)}
          disabled={!canSeek}
          title={
            canSeek
              ? `Jump to ${timestampLabel}`
              : "This lecture is no longer available"
          }
          className={`flex items-center gap-2 bg-[#0000000D] text-black rounded-lg px-3 py-1 transition-colors ${
            canSeek
              ? "cursor-pointer hover:bg-[#F77124] hover:text-white"
              : "cursor-not-allowed opacity-60"
          }`}
        >
          <Clock className="size-4" />
          <span className="text-sm font-semibold font-plus-jakarta">
            {timestampLabel}
          </span>
        </button>

        <div className="flex gap-2 shrink-0">
          <WhiteButton
            glow={false}
            type="button"
            title="Edit"
            className="px-3 py-2 lg:px-3 lg:py-2 rounded-xl"
            onClick={handleStartEdit}
          >
            <Edit className="size-4 text-black" />
          </WhiteButton>
          <WhiteButton
            glow={false}
            type="button"
            title="Delete"
            className="px-3 py-2 lg:px-3 lg:py-2 rounded-xl"
            onClick={() => setIsConfirmingDelete(true)}
          >
            <Trash2 className="size-4 text-black" />
          </WhiteButton>
        </div>
      </div>

      {isEditing ? (
        <AddNotes
          noteContent={draft}
          onNoteContentChange={setDraft}
          onSave={handleSaveEdit}
          onClose={() => setIsEditing(false)}
          timestampLabel={timestampLabel}
          isSaving={isSaving}
        />
      ) : (
        <p className="text-black text-base font-normal leading-relaxed whitespace-pre-wrap wrap-break-word">
          {note.content}
        </p>
      )}

      <Modal
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        title="Delete note?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            This permanently deletes your note at
            <span className="font-semibold"> {timestampLabel}</span>. This
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <WhiteButton
              type="button"
              glow={false}
              disabled={isDeleting}
              onClick={() => setIsConfirmingDelete(false)}
            >
              Cancel
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </OrangeButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NoteCard;
