"use client";

import { Plus, Trash2 } from "lucide-react";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";

/**
 * Mirrors the server's cap in `crmProfile.services`. A lead form with more than
 * two custom questions stops being a lead form.
 */
export const MAX_EXTRA_QUESTIONS = 2;

/** One question as it is being edited. `options` is raw textarea text. */
export type QuestionDraft = {
  label: string;
  type: "text" | "select";
  options: string;
  required: boolean;
};

/** Turns saved questions back into editable drafts. */
export const toDrafts = (
  questions: { label: string; type: "text" | "select"; options: string[]; required: boolean }[],
): QuestionDraft[] =>
  questions.map((q) => ({
    label: q.label,
    type: q.type,
    options: (q.options ?? []).join("\n"),
    required: Boolean(q.required),
  }));

export const emptyDraft = (): QuestionDraft => ({
  label: "",
  type: "text",
  options: "",
  required: false,
});

/**
 * Shared by the staff CRM page and the campus-ambassador page, which offer the
 * same editor to different people. Kept dumb: the pages own the saving, the
 * permission to see it at all, and the copy around it.
 */
export default function ExtraQuestionsEditor({
  questions,
  onChange,
  max,
  disabled = false,
}: {
  questions: QuestionDraft[];
  onChange: (next: QuestionDraft[]) => void;
  max: number;
  disabled?: boolean;
}) {
  const update = (index: number, patch: Partial<QuestionDraft>) =>
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const remove = (index: number) =>
    onChange(questions.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <p className="text-sm text-gray-500">
          No extra questions. Your form asks only the standard fields.
        </p>
      ) : null}

      {questions.map((question, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-gray-500 uppercase">
              Question {index + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Remove
            </button>
          </div>

          <Input
            label="Question"
            value={question.label}
            onChange={(e) => update(index, { label: e.target.value })}
            placeholder="e.g. Which city are you in?"
            disabled={disabled}
          />

          <Select
            label="Answer type"
            options={[
              { value: "text", label: "Free text" },
              { value: "select", label: "Dropdown" },
            ]}
            value={question.type}
            onChange={(v) => update(index, { type: v as "text" | "select" })}
            disabled={disabled}
          />

          {question.type === "select" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Options, one per line
              </label>
              <textarea
                value={question.options}
                onChange={(e) => update(index, { options: e.target.value })}
                rows={4}
                disabled={disabled}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm"
                placeholder={"Delhi\nMumbai\nBengaluru"}
              />
            </div>
          ) : null}

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => update(index, { required: e.target.checked })}
              disabled={disabled}
              className="size-4 rounded border-gray-300 text-orange-600"
            />
            <span className="text-sm text-gray-800">Make it required</span>
          </label>
        </div>
      ))}

      {questions.length < max ? (
        <button
          type="button"
          onClick={() => onChange([...questions, emptyDraft()])}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <Plus className="size-4" />
          Add a question
        </button>
      ) : (
        <p className="text-xs text-gray-500">
          {max} questions is the limit. A lead form with more stops being a lead
          form.
        </p>
      )}
    </div>
  );
}
