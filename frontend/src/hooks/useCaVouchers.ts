import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  CaVoucherCoursesPage,
  CaVoucherEnrollmentsPage,
  CaVoucherMe,
  CaVoucherRequestTab,
  CaVoucherRequestsPage,
} from "@/types/ca-voucher";

type ApiError = { response?: { data?: { error?: { message?: string; code?: string }; message?: string } } };

const errorMessage = (e: unknown, fallback: string): string => {
  const err = e as ApiError;
  return err?.response?.data?.error?.message ?? err?.response?.data?.message ?? fallback;
};

const admin = ENDPOINTS.admin.caVouchers;

export type CaVoucherRequestResult = { ok: true } | { ok: false; unavailable: boolean; message: string };

/** CA side. Reads return null on failure so the desk can draw its own states. */
export function useCaVoucher() {
  const getMe = useCallback(async (): Promise<CaVoucherMe | null> => {
    try {
      return ((await apiClient.get(ENDPOINTS.caVouchers.me)).data?.data ?? null) as CaVoucherMe | null;
    } catch {
      return null;
    }
  }, []);

  const listCourses = useCallback(
    async (search: string, page: number, signal?: AbortSignal): Promise<CaVoucherCoursesPage | null> => {
      try {
        const res = await apiClient.get(ENDPOINTS.caVouchers.courses, {
          params: { search: search || undefined, page, limit: 12 },
          signal,
        });
        return (res.data?.data ?? null) as CaVoucherCoursesPage | null;
      } catch {
        return null;
      }
    },
    [],
  );

  const requestCourse = useCallback(async (courseId: string): Promise<CaVoucherRequestResult> => {
    try {
      await apiClient.post(ENDPOINTS.caVouchers.request, { courseId });
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        unavailable: (e as ApiError)?.response?.data?.error?.code === "CA_VOUCHER_UNAVAILABLE",
        message: errorMessage(e, "Could not send your request. Try again."),
      };
    }
  }, []);

  return { getMe, listCourses, requestCourse };
}

export interface CaVoucherListQuery {
  search?: string;
  page: number;
  limit?: number;
}

/** Admin side. Failures toast and resolve to null. */
export default function useCaVouchers() {
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

  const listRequests = useCallback(
    (query: CaVoucherListQuery & { status: CaVoucherRequestTab }) =>
      run(
        async () =>
          (await apiClient.get(admin.requests, { params: { limit: 20, ...query } })).data?.data as CaVoucherRequestsPage,
        "Could not load voucher requests",
      ),
    [run],
  );

  const approve = useCallback(
    (id: string) => run(async () => (await apiClient.post(admin.approve(id)), true), "Could not approve the request"),
    [run],
  );

  const decline = useCallback(
    (id: string, reason?: string) =>
      run(
        async () => (await apiClient.post(admin.decline(id), reason ? { reason } : {}), true),
        "Could not decline the request",
      ),
    [run],
  );

  const remove = useCallback(
    (id: string) => run(async () => (await apiClient.delete(admin.request(id)), true), "Could not delete the request"),
    [run],
  );

  const listEnrollments = useCallback(
    (query: CaVoucherListQuery) =>
      run(
        async () =>
          (await apiClient.get(admin.enrollments, { params: { limit: 20, ...query } })).data
            ?.data as CaVoucherEnrollmentsPage,
        "Could not load voucher enrollments",
      ),
    [run],
  );

  const revoke = useCallback(
    (id: string) => run(async () => (await apiClient.post(admin.revoke(id)), true), "Could not revoke the enrollment"),
    [run],
  );

  return { isLoading, listRequests, approve, decline, remove, listEnrollments, revoke };
}
