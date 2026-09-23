"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useCaReviews from "@/hooks/useCaReviews";
import ReviewAnswerCard from "./components/ReviewAnswerCard";
import type { CaReviewQueueRow } from "@/types/ca-task";

export default function CaReviewsPage() {
  const { list, review, isLoading } = useCaReviews();
  const [rows, setRows] = useState<CaReviewQueueRow[]>([]);

  const load = async () => {
    const found = await list();
    setRows(found ?? []);
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

  const total = rows.reduce((n, r) => n + r.pendingQuestions.length, 0);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900">CA reviews</h1>
      <p className="mt-1 text-sm text-gray-600">Pending file answers from Campus Ambassador tasks.</p>

      <div className="mt-5 flex flex-col gap-4">
        {isLoading && rows.length === 0 ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : total === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Nothing is waiting for review.
          </p>
        ) : (
          rows.flatMap((row) =>
            row.pendingQuestions.map((q) => (
              <ReviewAnswerCard key={`${row.submissionId}:${q.questionId}`} row={row} question={q} onReview={onReview} />
            )),
          )
        )}
      </div>
    </div>
  );
}
