import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { CaMeetingAdminRow, CaMeetingAttendanceResponse, CaMeetingMineItem } from "@/types/ca-meeting";

const errorMessage = (e: unknown, fallback: string): string => {
  const err = e as { response?: { data?: { error?: { message?: string }; message?: string } } };
  return err?.response?.data?.error?.message ?? err?.response?.data?.message ?? fallback;
};

export default function useCaMeetings() {
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

  const listMine = useCallback(
    () => run(async () => ((await apiClient.get(ENDPOINTS.caMeetings.mine)).data?.data?.meetings ?? []) as CaMeetingMineItem[], "Could not load your meetings"),
    [run],
  );

  const attend = useCallback(
    (token: string) =>
      run(
        async () =>
          (await apiClient.post(ENDPOINTS.caMeetings.attend(token))).data?.data as {
            ok: true;
            slot: 1 | 2;
            alreadyMarked: boolean;
            meetingName: string;
          },
        "Could not record attendance",
      ),
    [run],
  );

  const listAdmin = useCallback(
    (page?: number, limit?: number) =>
      run(
        async () =>
          (await apiClient.get(ENDPOINTS.admin.caMeetings.list, { params: { page, limit } })).data?.data as {
            meetings: CaMeetingAdminRow[];
            total: number;
            page: number;
            totalPages: number;
          },
        "Could not load meetings",
      ),
    [run],
  );

  const createAdmin = useCallback(
    (body: Record<string, unknown>) =>
      run(async () => (await apiClient.post(ENDPOINTS.admin.caMeetings.create, body)).data?.data as CaMeetingAdminRow, "Could not create the meeting"),
    [run],
  );

  const updateAdmin = useCallback(
    (id: string, body: Record<string, unknown>) =>
      run(async () => (await apiClient.patch(ENDPOINTS.admin.caMeetings.byId(id), body)).data?.data as CaMeetingAdminRow, "Could not update the meeting"),
    [run],
  );

  const activateAdmin = useCallback(
    (id: string, slot: 1 | 2) =>
      run(async () => (await apiClient.post(ENDPOINTS.admin.caMeetings.activate(id, slot))).data?.data as CaMeetingAdminRow, "Could not activate the link"),
    [run],
  );

  const getAttendanceAdmin = useCallback(
    (id: string) =>
      run(async () => (await apiClient.get(ENDPOINTS.admin.caMeetings.attendance(id))).data?.data as CaMeetingAttendanceResponse, "Could not load attendance"),
    [run],
  );

  const overrideAdmin = useCallback(
    (id: string, applicationId: string, verdict: "present" | "absent" | "clear") =>
      run(
        async () =>
          (await apiClient.post(ENDPOINTS.admin.caMeetings.attendanceOverride(id), { applicationId, verdict })).data
            ?.data as CaMeetingAttendanceResponse,
        "Could not override attendance",
      ),
    [run],
  );

  const deleteAdmin = useCallback(
    (id: string) => run(async () => (await apiClient.delete(ENDPOINTS.admin.caMeetings.byId(id)), true), "Could not delete the meeting"),
    [run],
  );

  return {
    isLoading,
    listMine,
    attend,
    listAdmin,
    createAdmin,
    updateAdmin,
    activateAdmin,
    getAttendanceAdmin,
    overrideAdmin,
    deleteAdmin,
  };
}
