"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import type { CaReviewQueueRow } from "@/types/ca-task";

type PendingQuestion = CaReviewQueueRow["pendingQuestions"][number];

export default function ReviewAnswerCard({
  row,
  question,
  selected,
  onToggleSelect,
  onReview,
}: {
  row: CaReviewQueueRow;
  question: PendingQuestion;
  selected: boolean;
  onToggleSelect: () => void;
  onReview: (
    submissionId: string,
    questionId: string,
    body: { verdict: "approved" | "rejected"; awardedScore?: number; note?: string },
  ) => Promise<void>;
}) {
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const approve = async () => {
    const parsed = Number(score);
    if (score.trim() === "" || Number.isNaN(parsed) || parsed < 0 || parsed > question.maxScore) {
      return;
    }
    setBusy("approve");
    await onReview(row.submissionId, question.questionId, { verdict: "approved", awardedScore: parsed, note });
    setBusy(null);
  };

  const reject = async () => {
    if (!note.trim()) return;
    setBusy("reject");
    await onReview(row.submissionId, question.questionId, { verdict: "rejected", note });
    setBusy(null);
  };

  return (
    <div
      className={
        selected
          ? "rounded-xl border border-orange-300 bg-orange-50/40 p-4"
          : "rounded-xl border border-gray-200 bg-white p-4"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Select ${row.applicantName}'s answer`}
            className="mt-0.5 size-4 accent-orange-500"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-900">{row.applicantName}</span>
            <span className="block text-xs text-gray-500">{row.taskTitle}</span>
          </span>
        </label>
        {question.currentFile ? (
          <a
            href={question.currentFile}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
          >
            <ExternalLink className="size-3.5" /> View submission
          </a>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-gray-800">{question.questionText}</p>
      {question.learnerComment ? (
        <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700 whitespace-pre-wrap">{question.learnerComment}</p>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
        <Input
          label={`Score (out of ${question.maxScore})`}
          type="number"
          min={0}
          max={question.maxScore}
          className="max-sm:text-base"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
        <TextArea label="Note (required to reject)" className="max-sm:text-base" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <WhiteButton type="button" glow={false} disabled={busy !== null} onClick={() => void reject()}>
          {busy === "reject" ? "Rejecting..." : "Reject"}
        </WhiteButton>
        <OrangeButton type="button" glow={false} disabled={busy !== null} onClick={() => void approve()}>
          {busy === "approve" ? "Approving..." : "Approve"}
        </OrangeButton>
      </div>
    </div>
  );
}
