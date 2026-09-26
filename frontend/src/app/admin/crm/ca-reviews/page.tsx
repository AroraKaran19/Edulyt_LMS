"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import useCaReviews from "@/hooks/useCaReviews";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import BulkReviewDialog, {
  type BulkReviewInput,
  type BulkReviewOutcome,
} from "@/components/admin/BulkReviewDialog";
import ReviewAnswerCard from "./components/ReviewAnswerCard";
import type { CaReviewQueueRow } from "@/types/ca-task";

/** Mirrors MAX_BULK_CA_REVIEW on the server. */
const MAX_BULK = 50;

const keyOf = (submissionId: string, questionId: string) => `${submissionId}:${questionId}`;

export default function CaReviewsPage() {
  const { list, review, isLoading } = useCaReviews();
  const [rows, setRows] = useState<CaReviewQueueRow[]>([]);
  // Queue key to the applicant's name, for the skipped list after a bulk run.
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = async () => {
    const found = (await list()) ?? [];
    setRows(found);
    // Answers reviewed elsewhere drop out of the queue, so drop them from the selection too.
    const live = new Set(
      found.flatMap((r) => r.pendingQuestions.map((q) => keyOf(r.submissionId, q.questionId))),
    );
    setSelected((prev) => new Map([...prev].filter(([key]) => live.has(key))));
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReview = async (
    submissionId: string,
    questionId: string,
    body: { verdict: "approved" | "rejected"; awardedScore?: number; note?: string },
  ) => {
    const result = await review(submissionId, questionId, body);
    if (!result) return;
    toast.success(result.finalized ? "Reviewed. The task is now finalized." : "Reviewed");
    void load();
  };

  const answers = rows.flatMap((row) =>
    row.pendingQuestions.map((q) => ({ row, q, key: keyOf(row.submissionId, q.questionId) })),
  );
  const allSelected = answers.length > 0 && answers.every((a) => selected.has(a.key));

  const toggle = (key: string, name: string) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < MAX_BULK) next.set(key, name);
      else toast.info(`You can review up to ${MAX_BULK} at a time`);
      return next;
    });

  const toggleAll = () =>
    setSelected(
      allSelected
        ? new Map()
        : new Map(answers.slice(0, MAX_BULK).map((a) => [a.key, a.row.applicantName])),
    );

  const runBulkReview = async ({
    verdict,
    percent,
    note,
  }: BulkReviewInput): Promise<BulkReviewOutcome> => {
    const items = [...selected.keys()].map((key) => {
      const [submissionId, questionId] = key.split(":");
      return { submissionId, questionId };
    });
    const res = await apiClient.post(ENDPOINTS.caReviews.bulk, {
      items,
      verdict: verdict === "approve" ? "approved" : "rejected",
      percent,
      note,
    });
    const results = (res.data?.data?.results ?? []) as {
      submissionId: string;
      questionId: string;
      ok: boolean;
      error?: string;
    }[];
    return {
      reviewed: results.filter((r) => r.ok).length,
      failed: results
        .filter((r) => !r.ok)
        .map((r) => ({
          label: selected.get(keyOf(r.submissionId, r.questionId)) ?? r.submissionId,
          error: r.error ?? "Could not review",
        })),
    };
  };

  return (
    <div className="p-4 pb-24 sm:p-6 sm:pb-24">
      <h1 className="text-2xl font-bold text-gray-900">CA reviews</h1>
      <p className="mt-1 text-sm text-gray-600">Pending file answers from Campus Ambassador tasks.</p>

      {answers.length > 0 && (
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="size-4 accent-orange-500"
          />
          Select all{answers.length > MAX_BULK ? ` (first ${MAX_BULK})` : ""}
        </label>
      )}

      <div className="mt-3 flex flex-col gap-4">
        {isLoading && rows.length === 0 ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : answers.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Nothing is waiting for review.
          </p>
        ) : (
          answers.map(({ row, q, key }) => (
            <ReviewAnswerCard
              key={key}
              row={row}
              question={q}
              selected={selected.has(key)}
              onToggleSelect={() => toggle(key, row.applicantName)}
              onReview={onReview}
            />
          ))
        )}
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-orange-200 bg-white px-4 py-2.5 shadow-2xl">
          <span className="border-r border-gray-200 pr-3 text-sm font-semibold text-gray-800">
            {selected.size} selected
          </span>
          <WhiteButton type="button" glow={false} onClick={() => setSelected(new Map())}>
            Clear
          </WhiteButton>
          <OrangeButton type="button" glow={false} onClick={() => setBulkOpen(true)}>
            Review selected
          </OrangeButton>
        </div>
      )}

      <BulkReviewDialog
        isOpen={bulkOpen}
        count={selected.size}
        noun="answer"
        rejectLabel="Reject"
        approveHint="Each answer gets this share of its own marks, rounded down. A task whose last pending answer is approved here is finalized, and CA points are added if it passed."
        rejectHint="Each answer scores 0 with your note. If it was the task's last pending answer, the task is finalized and can no longer be resubmitted."
        onSubmit={runBulkReview}
        onClose={(changed) => {
          setBulkOpen(false);
          if (changed) {
            setSelected(new Map());
            void load();
          }
        }}
      />
    </div>
  );
}
