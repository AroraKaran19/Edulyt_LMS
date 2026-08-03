"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import AddNotes from "./AddNotes";
import { useVideoTimeState } from "../context/VideoTimeContext";
import { formatTime } from "../hooks/useVideoTime";

/**
 * The one component in the Notes tab that subscribes to the ticking playback
 * context, because it is the only one that needs a live position: the
 * placeholder reads "Create a new note at 12:04" and has to keep up.
 *
 * Everything else in the tab reads from the controls context instead, which
 * never changes identity, so mounting the notes list does not drag the whole
 * subtree into a four-times-a-second render loop.
 */
const NoteComposer = ({
  onCreate,
}: {
  /** Resolves true when the note was saved. */
  onCreate: (content: string, timestamp: number) => Promise<boolean>;
}) => {
  const { currentTime, formattedCurrentTime } = useVideoTimeState();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // Frozen when the editor opens, so a note lands where the student was when
  // they decided to write, not wherever playback drifted to while they typed.
  const [anchor, setAnchor] = useState(0);

  const handleOpen = () => {
    setAnchor(currentTime);
    setDraft("");
    setIsOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const ok = await onCreate(draft, anchor);
    setIsSaving(false);
    if (ok) {
      setDraft("");
      setIsOpen(false);
    }
  };

  if (isOpen) {
    return (
      <AddNotes
        noteContent={draft}
        onNoteContentChange={setDraft}
        onSave={handleSave}
        onClose={() => setIsOpen(false)}
        timestampLabel={formatTime(anchor)}
        isSaving={isSaving}
      />
    );
  }

  // Two sibling buttons rather than one wrapping the other: nesting a button
  // inside a button is invalid HTML, and the wide placeholder needs to stay
  // clickable because that is where people aim.
  return (
    <div className="w-full bg-[#F5F5F5] p-1.5 rounded-xl flex gap-2 items-center border border-black/10">
      <button
        type="button"
        onClick={handleOpen}
        className="grow px-2 py-1 text-left text-black/40 cursor-pointer truncate"
      >
        Create a new note at {formattedCurrentTime}
      </button>
      <WhiteButton
        type="button"
        glow={false}
        onClick={handleOpen}
        className="shrink-0 rounded-xl"
      >
        <PlusCircle className="size-5 text-black" />
        <span className="text-base font-bold font-plus-jakarta text-black">
          Add
        </span>
      </WhiteButton>
    </div>
  );
};

export default NoteComposer;
