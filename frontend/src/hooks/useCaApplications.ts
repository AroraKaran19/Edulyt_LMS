import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { AmbassadorKind } from "@/hooks/useCrm";
import type {
  CaApplicationRow,
  CaApplicationsPage,
  CaAttachOutcome,
  CaDirectoryPage,
  CaDirectoryState,
  CaOwner,
} from "@/types/ca-application";

const errorMessage = (e: unknown, fallback: string): string => {
  const err = e as { response?: { data?: { error?: { message?: string }; message?: string } } };
  return err?.response?.data?.error?.message ?? err?.response?.data?.message ?? fallback;
};

const base = ENDPOINTS.caApplications;

export interface CaListQuery {
  status: "pending" | "approved";
  referrer?: string;
  q?: string;
  page: number;
  limit?: number;
}

export interface CaDirectoryQuery {
  state?: CaDirectoryState;
  search?: string;
  ownerUserId?: string;
  kind?: string;
  page: number;
  limit?: number;
}

export default function useCaApplications() {
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
    (query: CaListQuery) =>
      run(async () => {
        const res = await apiClient.get(base, { params: { limit: 20, ...query } });
        return res.data?.data as CaApplicationsPage;
      }, "Could not load applications"),
    [run],
  );

  const listDirectory = useCallback(
    (query: CaDirectoryQuery) =>
      run(async () => {
        const res = await apiClient.get(ENDPOINTS.caApplications.directory, { params: { limit: 20, ...query } });
        return res.data?.data as CaDirectoryPage;
      }, "Could not load the CA directory"),
    [run],
  );

  const detail = useCallback(
    (id: string) =>
      run(async () => (await apiClient.get(`${base}/${id}`)).data?.data as CaApplicationRow, "Could not load the application"),
    [run],
  );

  const reveal = useCallback(
    (id: string) =>
      run(
        async () =>
          (await apiClient.post(`${base}/${id}/reveal`)).data?.data as {
            payout: { method: "upi" | "details"; value: string } | null;
          },
        "Could not reveal the payout details",
      ),
    [run],
  );

  const owners = useCallback(
    () => run(async () => ((await apiClient.get(`${base}/owners`)).data?.data?.owners ?? []) as CaOwner[], "Could not load teams"),
    [run],
  );

  const approve = useCallback(
    (id: string, kind: AmbassadorKind, ownerUserId?: string) =>
      run(
        async () =>
          (await apiClient.post(`${base}/${id}/approve`, { kind, ownerUserId })).data?.data as {
            application: CaApplicationRow;
            outcome: CaAttachOutcome;
          },
        "Could not approve",
      ),
    [run],
  );

  const decline = useCallback(
    (id: string) => run(async () => (await apiClient.delete(`${base}/${id}`), true), "Could not decline"),
    [run],
  );

  const changeOwner = useCallback(
    (id: string, ownerUserId: string) =>
      run(async () => (await apiClient.patch(`${base}/${id}/owner`, { ownerUserId })).data?.data as CaApplicationRow, "Could not move the application"),
    [run],
  );

  const retryDocuments = useCallback(
    (id: string) =>
      run(
        async () => (await apiClient.post(`${base}/${id}/documents/retry`)).data?.data as { retried: number },
        "Could not retry the documents",
      ),
    [run],
  );

  const setHold = useCallback(
    (id: string, hold: boolean) =>
      run(async () => (await apiClient.patch(`${base}/${id}/hold`, { hold })).data?.data as CaApplicationRow, "Could not update the hold"),
    [run],
  );

  const team = useCallback(
    (ownerUserId?: string) =>
      run(
        async () =>
          ((await apiClient.get(`${base}/team`, { params: ownerUserId ? { ownerUserId } : undefined })).data?.data
            ?.applications ?? []) as CaApplicationRow[],
        "Could not load the team's tenure details",
      ),
    [run],
  );

  const changeDuration = useCallback(
    (id: string, durationMonths: number) =>
      run(
        async () => (await apiClient.patch(ENDPOINTS.caApplications.changeDuration(id), { durationMonths })).data?.data as CaApplicationRow,
        "Could not change the duration",
      ),
    [run],
  );

  const setCertificateOverride = useCallback(
    (id: string, override: "pass" | "fail" | null) =>
      run(
        async () =>
          (await apiClient.patch(ENDPOINTS.caApplications.certificateOverride(id), { override })).data
            ?.data as CaApplicationRow,
        "Could not update the certificate override",
      ),
    [run],
  );

  return {
    isLoading,
    list,
    listDirectory,
    detail,
    reveal,
    owners,
    approve,
    decline,
    changeOwner,
    setHold,
    retryDocuments,
    team,
    changeDuration,
    setCertificateOverride,
  };
}
