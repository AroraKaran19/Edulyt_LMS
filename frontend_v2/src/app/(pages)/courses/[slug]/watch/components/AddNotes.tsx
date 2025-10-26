import TextArea from "@/components/ui/inputs/TextArea";
import { Bold, ChevronDown, Clock, Italic, List } from "lucide-react";

const AddNotes = ({
  onClose,
  onSave,
  onNoteContentChange,
  noteContent,
}: {
  onClose: () => void;
  onSave: () => void;
  onNoteContentChange: (content: string) => void;
  noteContent: string;
}) => {
  return (
    <div className="bg-white rounded-lg w-full mt-8 p-2 shadow-[0px_4px_10.7px_0px_#00000012_inset]">
      {/* Header/Toolbar */}
      <div className=" bg-white border border-[#00000021] shadow-[0px_-3px_3.7px_0px_#0146E721_inset] px-4 py-2 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-4rounded-2xl">
          {/* Style Dropdown */}
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-base font-plus-jakarta font-bold text-[#2B1508]">
              Style
            </span>
            <ChevronDown className="size-6 text-[#2B1508]" />
          </div>
          <span className="border border-r border-[#00000029]"></span>

          {/* Formatting Icons */}
          <div className="flex items-center gap-2">
            <button title="Bold" className="p-1 hover:bg-gray-200 rounded">
              <Bold className="size-6 text-[#2B1508]" />
            </button>
            <button title="Italic" className="p-1 hover:bg-gray-200 rounded">
              <Italic className="size-6 text-[#2B1508]" />
            </button>
            <button title="List" className="p-1 hover:bg-gray-200 rounded">
              <List className="size-6 text-[#2B1508]" />
            </button>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 bg-[#0000000D] rounded-lg px-3 py-1">
          <Clock className="size-4 text-white" fill="#000000" />
          <span className="text-base font-semibold font-plus-jakarta text-black">
            00:01
          </span>
        </div>
      </div>

      {/* Content Area */}
      <TextArea
        placeholder="Start typing your note..."
        onChange={(e) => onNoteContentChange(e.target.value)}
        className="bg-white border resize-none mt-1 border-[#00000026] rounded-lg p-4 flex items-center justify-center min-h-[100px]"
        value={noteContent}
      />

      {/* Footer */}
      <div className="bg-gray-100 px-4 py-3 rounded-b-lg flex justify-end gap-3">
        <button
          type="button"
          title="Cancel"
          onClick={onClose}
          className="cursor-pointer px-8 py-2 bg-white text-[#F5691D] rounded-lg hover:bg-orange-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          title="Save"
          onClick={onSave}
          className="cursor-pointer px-8 py-2 bg-[#F5691D] text-white rounded-lg hover:bg-[#F5691D] transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default AddNotes;
