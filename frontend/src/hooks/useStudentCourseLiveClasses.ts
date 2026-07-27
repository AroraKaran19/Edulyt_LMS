"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  StudentCourseLiveClassesPage,
  StudentLiveClassItem,
} from "@/types/live-classes";

interface Options {
  /** Items per page. Server caps at 50. */
  limit?: number;
}

interface UseStudentCourseLiveClassesResult {
  items: StudentLiveClassItem[];
  isLoading: boolean;
  isAppending: boolean;
  hasMore: boolean;
  total: number;
  /** False when the learner's enrollment isn't on the elite plan. */
  hasAccess: boolean;
  error: string | null;
  /** Load the next page (no-op if already loading or nothing left). */
  loadMore: () => Promise<void>;
  /** Refetch from page 1, replacing the list. */
  refresh: () => Promise<void>;
}

/**
 * Paginated live-classes feed for one enrolled course, newest-first. Drives
 * the course player's "Live Classes" tab with infinite scroll — same shape as
 * the internship program page's feed.
 */
export default function useStudentCourseLiveClasses(
  courseId: string,
  { limit = 10 }: Options = {},
): UseStudentCourseLiveClassesResult {
  const [items, setItems] = useState<StudentLiveClassItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasAccess, setHasAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppending, setIsAppending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Tracks the latest in-flight request so stale responses are ignored. */
  const activeRequest = useRef(0);

  const fetchPage = useCallback(
    async (target: number, append: boolean) => {
      if (!courseId) return;
      const reqId = ++activeRequest.current;
      if (append) setIsAppending(true);
      else setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<{ data: StudentCourseLiveClassesPage }>(
          ENDPOINTS.liveClasses.studentByCourse(courseId),
          { params: { page: target, limit } },
        );
        if (reqId !== activeRequest.current) return;
        const data = res.data?.data;
        const next = data?.liveClasses ?? [];
        setItems((prev) => (append ? [...prev, ...next] : next));
        setPage(data?.page ?? target);
        setTotalPages(data?.totalPages ?? 1);
        setTotal(data?.total ?? 0);
        setHasAccess(data?.hasAccess ?? true);
      } catch (err: unknown) {
        if (reqId !== activeRequest.current) return;
        const e = err as {
          response?: {
            status?: number;
            data?: { error?: { message?: string }; message?: string };
          };
        };
        // 403 here means "not enrolled" — an empty tab, not a red error.
        if (e?.response?.status === 403) {
          setHasAccess(false);
        } else {
          setError(
            e?.response?.data?.error?.message ??
              e?.response?.data?.message ??
              "Could not load live classes",
          );
        }
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
    [courseId, limit],
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
    hasAccess,
    error,
    loadMore,
    refresh,
  };
}
