import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Clock } from "lucide-react";
import { MAX_NOTE_LENGTH } from "@/hooks/useVideoNotes";

/**
 * The editor panel, shared by both note paths.
 *
 * `timestampLabel` arrives as a prop rather than being read from the video
 * context, which is what lets the same component serve editing (where the
 * anchor is fixed and merely displayed) as well as composing. It also keeps
 * this component off the ticking context entirely.
 */
const AddNotes = ({
  onClose,
  onSave,
  onNoteContentChange,
  noteContent,
  timestampLabel,
  isSaving = false,
  saveLabel = "Save",
}: {
  onClose: () => void;
  onSave: () => void;
  onNoteContentChange: (content: string) => void;
  noteContent: string;
  timestampLabel: string;
  isSaving?: boolean;
  saveLabel?: string;
}) => {
  const canSave = noteContent.trim().length > 0 && !isSaving;

  return (
    <div className="bg-white rounded-xl w-full border border-[#00000021] p-3">
      {/* Anchor */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-base font-plus-jakarta font-bold text-[#2B1508]">
          Note
        </span>
        <span className="flex items-center gap-2 bg-[#0000000D] rounded-lg px-3 py-1 text-black">
          <Clock className="size-4" />
          <span className="text-sm font-semibold font-plus-jakarta">
            {timestampLabel}
          </span>
        </span>
      </div>

      <TextArea
        placeholder="Start typing your note..."
        onChange={(e) => onNoteContentChange(e.target.value)}
        className="min-h-[110px]"
        lockHeight
        value={noteContent}
        maxLength={MAX_NOTE_LENGTH}
        showWordCount
        autoFocus
      />

      <div className="flex justify-end gap-3 mt-3">
        <WhiteButton
          type="button"
          glow={false}
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </WhiteButton>
        <OrangeButton
          type="button"
          glow={false}
          onClick={onSave}
          disabled={!canSave}
        >
          {isSaving ? "Saving..." : saveLabel}
        </OrangeButton>
      </div>
    </div>
  );
};

export default AddNotes;
