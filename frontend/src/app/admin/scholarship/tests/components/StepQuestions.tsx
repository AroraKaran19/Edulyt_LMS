"use client";

import { useState } from "react";
import { ListPlus, Lock, X } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import QuestionPickerModal, {
  type PickerQuestion,
} from "@/components/admin/internships/QuestionPickerModal";

type Props = {
  selected: PickerQuestion[];
  setSelected: (qs: PickerQuestion[]) => void;
  /** True once the campaign has been attempted: the paper is frozen. */
  locked: boolean;
};

export default function StepQuestions({
  selected,
  setSelected,
  locked,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const count = selected.length;

  if (locked) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Locked.</span> Someone has already
            taken this test, so changing the questions would mean different
            candidates answered different papers.
          </p>
        </div>
        <div className="text-sm text-gray-700 tabular-nums">
          {count} question{count === 1 ? "" : "s"} in this test.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Questions <span className="text-red-500">*</span>
        </span>
        <span className="text-xs text-gray-500 tabular-nums">
          {count} selected
        </span>
      </div>

      <WhiteButton
        type="button"
        glow={false}
        onClick={() => setPickerOpen(true)}
        className="inline-flex items-center justify-center gap-2"
      >
        <ListPlus className="w-4 h-4" />
        {count === 0 ? "Add from question bank" : "Add or remove questions"}
      </WhiteButton>

      {/* The picker has no prop for a default category, so "Scholarship"
          cannot be pre-selected without changing that shared component. */}
      <p className="text-xs text-gray-500 -mt-1">
        Filter to the <span className="font-medium">Scholarship</span> category
        inside the picker to find questions written for these campaigns.
      </p>

      {count > 0 ? (
        <ul className="rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
          {selected.map((q) => (
            <li key={q._id} className="flex items-start gap-3 px-3 py-2 text-sm">
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 line-clamp-1">
                  {q.questionText || "Untitled"}
                </p>
                {q.category ? (
                  <span className="inline-flex mt-0.5 px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {q.category}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() =>
                  setSelected(selected.filter((x) => x._id !== q._id))
                }
                className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                aria-label="Remove question"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <p className="text-sm text-gray-700">
          There is no pass mark. Anyone who reaches the end of the test earns the
          coupon, whatever they scored.
        </p>
      </div>

      <QuestionPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        usageFor="exam"
        selected={selected}
        onApply={(qs) => setSelected(qs)}
      />
    </div>
  );
}
