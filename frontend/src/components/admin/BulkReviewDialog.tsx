"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";

export type BulkVerdict = "approve" | "reject";

export type BulkReviewInput = {
  verdict: BulkVerdict;
  /** Share of each answer's own maximum marks, 0 to 100. */
  percent: number;
  note: string;
};

export type BulkReviewOutcome = {
  reviewed: number;
  failed: { label: string; error: string }[];
};

type Props = {
  isOpen: boolean;
  count: number;
  /** "submission" or "answer", pluralised here. */
  noun: string;
  rejectLabel: string;
  /** Shown under the choice, so the reviewer knows what each verdict does. */
  approveHint: string;
  rejectHint: string;
  onClose: (changed: boolean) => void;
  onSubmit: (input: BulkReviewInput) => Promise<BulkReviewOutcome>;
};

const PRESETS = [
  { label: "Full marks", value: 100 },
  { label: "Half", value: 50 },
  { label: "Zero", value: 0 },
];

export default function BulkReviewDialog({
  isOpen,
  count,
  noun,
  rejectLabel,
  approveHint,
  rejectHint,
  onClose,
  onSubmit,
}: Props) {
  const [verdict, setVerdict] = useState<BulkVerdict>("approve");
  const [percent, setPercent] = useState(100);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<BulkReviewOutcome | null>(null);

  const plural = `${noun}${count === 1 ? "" : "s"}`;

  const close = () => {
    if (submitting) return;
    const changed = Boolean(outcome && outcome.reviewed > 0);
    setVerdict("approve");
    setPercent(100);
    setNote("");
    setError("");
    setOutcome(null);
    onClose(changed);
  };

  const submit = async () => {
    if (verdict === "reject" && !note.trim()) {
      setError("Add a note so learners know what to fix.");
      return;
    }
    if (verdict === "approve" && !(percent >= 0 && percent <= 100)) {
      setError("Marks must be between 0% and 100%.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      setOutcome(await onSubmit({ verdict, percent, note: note.trim() }));
    } catch (e) {
      setError(
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "The bulk review did not go through.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={outcome ? "Bulk review finished" : `Review ${count} ${plural}`}
      className="max-w-lg w-full mx-4"
    >
      {outcome ? (
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <CheckCircle2 className="size-4 text-emerald-600" />
            {outcome.reviewed} of {count} {plural} reviewed
          </p>
          {outcome.failed.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="mb-1.5 text-xs font-semibold text-amber-900">
                {outcome.failed.length} skipped
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-amber-900">
                {outcome.failed.map((f, i) => (
                  <li key={`${f.label}-${i}`}>
                    <span className="font-medium">{f.label}:</span> {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end border-t border-gray-100 pt-3">
            <OrangeButton type="button" glow={false} onClick={close}>
              Done
            </OrangeButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {(
              [
                ["approve", "Approve"],
                ["reject", rejectLabel],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={verdict === value}
                onClick={() => setVerdict(value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                  verdict === value
                    ? value === "approve"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-red-400 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {verdict === "approve" ? approveHint : rejectHint}
          </p>

          {verdict === "approve" && (
            <div>
              <label
                htmlFor="bulk-review-percent"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Marks to award
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPercent(p.value)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      percent === p.value
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    id="bulk-review-percent"
                    type="number"
                    min={0}
                    max={100}
                    value={percent}
                    onChange={(e) => setPercent(Number(e.target.value))}
                    className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-gray-500">% of each answer&apos;s marks</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="bulk-review-note"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Note {verdict === "reject" ? "(required)" : "(optional)"}
            </label>
            <textarea
              id="bulk-review-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder={
                verdict === "reject"
                  ? "What should they fix?"
                  : "Shown to every selected learner"
              }
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="size-4" />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <WhiteButton type="button" glow={false} onClick={close} disabled={submitting}>
              Cancel
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              onClick={() => void submit()}
              disabled={submitting}
            >
              {submitting
                ? "Reviewing…"
                : verdict === "approve"
                  ? `Approve ${count}`
                  : `${rejectLabel} for ${count}`}
            </OrangeButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
