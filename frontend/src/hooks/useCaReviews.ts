import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { CaReviewQueueRow } from "@/types/ca-task";

const errorMessage = (e: unknown, fallback: string): string => {
  const err = e as { response?: { data?: { error?: { message?: string }; message?: string } } };
  return err?.response?.data?.error?.message ?? err?.response?.data?.message ?? fallback;
};

export default function useCaReviews() {
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>, failure: string): Promise<T | null> => {
    setIsLoading(true);
    try {
      return await fn();
    } catch (e) {
      toast.error(errorMessage(e, failure));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const list = useCallback(
    () => run(async () => ((await apiClient.get(ENDPOINTS.caReviews.list)).data?.data?.reviews ?? []) as CaReviewQueueRow[], "Could not load the review queue"),
    [run],
  );

  const review = useCallback(
    (submissionId: string, questionId: string, body: { verdict: "approved" | "rejected"; awardedScore?: number; note?: string }) =>
      run(
        async () =>
          (await apiClient.post(ENDPOINTS.caReviews.review(submissionId, questionId), body)).data?.data as { finalized: boolean },
        "Could not save the review",
      ),
    [run],
  );

  return { isLoading, list, review };
}
