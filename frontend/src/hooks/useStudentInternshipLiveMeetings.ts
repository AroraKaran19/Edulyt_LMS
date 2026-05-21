"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  StudentLiveMeetingItem,
  StudentLiveMeetingsPage,
} from "@/types/internship-live-meeting";

interface Options {
  /** Items per page. Server caps at 50. */
  limit?: number;
}

interface UseStudentInternshipLiveMeetingsResult {
  items: StudentLiveMeetingItem[];
  isLoading: boolean;
  isAppending: boolean;
  hasMore: boolean;
  total: number;
  error: string | null;
  /** Load the next page (no-op if already loading or no more). */
  loadMore: () => Promise<void>;
  /** Refetch from page 1, replacing the list. */
  refresh: () => Promise<void>;
}

/**
 * Paginated live-meetings feed for the learner's enrolled program (by slug),
 * newest-first. Drives the "Live Classes" tab's infinite-scroll list.
 */
export default function useStudentInternshipLiveMeetings(
  slug: string,
  { limit = 10 }: Options = {},
): UseStudentInternshipLiveMeetingsResult {
  const [items, setItems] = useState<StudentLiveMeetingItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppending, setIsAppending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Tracks the latest in-flight request so stale responses are ignored. */
  const activeRequest = useRef(0);

  const fetchPage = useCallback(
    async (target: number, append: boolean) => {
      if (!slug) return;
      const reqId = ++activeRequest.current;
      if (append) setIsAppending(true);
      else setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<{ data: StudentLiveMeetingsPage }>(
          ENDPOINTS.internshipEnrollments.meProgramLiveMeetingsBySlug(slug),
          { params: { page: target, limit } },
        );
        if (reqId !== activeRequest.current) return;
        const data = res.data?.data;
        const next = data?.items ?? [];
        setItems((prev) => (append ? [...prev, ...next] : next));
        setPage(data?.page ?? target);
        setTotalPages(data?.totalPages ?? 1);
        setTotal(data?.total ?? 0);
      } catch (err: unknown) {
        if (reqId !== activeRequest.current) return;
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Could not load live classes";
        setError(msg);
        if (!append) {
          setItems([]);
          setTotalPages(1);
          setTotal(0);
        }
      } finally {
        if (reqId !== activeRequest.current) return;
        if (append) setIsAppending(false);
        else setIsLoading(false);
      }
    },
    [slug, limit],
  );

  useEffect(() => {
    void fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (isLoading || isAppending) return;
    if (page >= totalPages) return;
    await fetchPage(page + 1, true);
  }, [fetchPage, isLoading, isAppending, page, totalPages]);

  const refresh = useCallback(async () => {
    await fetchPage(1, false);
  }, [fetchPage]);

  return {
    items,
    isLoading,
    isAppending,
    hasMore: page < totalPages,
    total,
    error,
    loadMore,
    refresh,
  };
}
