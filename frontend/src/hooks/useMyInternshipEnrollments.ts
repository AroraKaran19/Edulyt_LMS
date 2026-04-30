import { useCallback, useState } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { InternshipEnrollmentListRow } from "@/types";

export type MyInternshipEnrollmentsPage = {
  enrollments: InternshipEnrollmentListRow[];
  total: number;
  page: number;
  totalPages: number;
};

export async function fetchMyInternshipEnrollmentsPage(params: {
  page?: number;
  limit?: number;
  search?: string;
  /** Filter by enrollment status (server: comma-separated on `me` list). */
  statuses?: string[];
}): Promise<MyInternshipEnrollmentsPage> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.statuses && params.statuses.length > 0) {
    q.set("statuses", params.statuses.join(","));
  }
  const res = await apiClient.get(
    `${ENDPOINTS.internshipEnrollments.me}?${q.toString()}`,
  );
  return res.data.data as MyInternshipEnrollmentsPage;
}

/** Total count of the learner’s internship enrollments (lightweight: limit 1). */
export async function fetchMyInternshipEnrollmentTotal(): Promise<number> {
  const data = await fetchMyInternshipEnrollmentsPage({ page: 1, limit: 1 });
  return data.total;
}

export function useMyInternshipEnrollments() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (params: {
      page?: number;
      limit?: number;
      search?: string;
      statuses?: string[];
    }): Promise<MyInternshipEnrollmentsPage | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await fetchMyInternshipEnrollmentsPage(params);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ?? "Failed to load internships";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { loadPage, isLoading, error, setError };
}
