import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { CaTaskAdminDetail, CaTaskAdminRow, CaTaskAttemptView, CaTaskMineRow } from "@/types/ca-task";

const errorMessage = (e: unknown, fallback: string): string => {
  const err = e as { response?: { data?: { error?: { message?: string }; message?: string } } };
  return err?.response?.data?.error?.message ?? err?.response?.data?.message ?? fallback;
};

export default function useCaTasks() {
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
    () => run(async () => ((await apiClient.get(ENDPOINTS.caTasks.mine)).data?.data?.tasks ?? []) as CaTaskMineRow[], "Could not load your tasks"),
    [run],
  );

  const getAttempt = useCallback(
    (taskId: string) => run(async () => (await apiClient.get(ENDPOINTS.caTasks.byId(taskId))).data?.data as CaTaskAttemptView, "Could not load this task"),
    [run],
  );

  const submit = useCallback(
    (taskId: string, answers: { questionId: string; selectedOptions?: string[]; fileUrl?: string; comment?: string }[]) =>
      run(async () => (await apiClient.post(ENDPOINTS.caTasks.submit(taskId), { answers })).data?.data as CaTaskAttemptView, "Could not submit"),
    [run],
  );

  const listAdmin = useCallback(
    () => run(async () => ((await apiClient.get(ENDPOINTS.admin.caTasks.list)).data?.data?.tasks ?? []) as CaTaskAdminRow[], "Could not load tasks"),
    [run],
  );

  const getAdmin = useCallback(
    (id: string) => run(async () => (await apiClient.get(ENDPOINTS.admin.caTasks.byId(id))).data?.data as CaTaskAdminDetail, "Could not load the task"),
    [run],
  );

  const createAdmin = useCallback(
    (body: Record<string, unknown>) => run(async () => (await apiClient.post(ENDPOINTS.admin.caTasks.create, body)).data?.data as CaTaskAdminDetail, "Could not create the task"),
    [run],
  );

  const updateAdmin = useCallback(
    (id: string, body: Record<string, unknown>) => run(async () => (await apiClient.patch(ENDPOINTS.admin.caTasks.byId(id), body)).data?.data as CaTaskAdminDetail, "Could not update the task"),
    [run],
  );

  const deleteAdmin = useCallback(
    (id: string) => run(async () => (await apiClient.delete(ENDPOINTS.admin.caTasks.byId(id)), true), "Could not delete the task"),
    [run],
  );

  return { isLoading, listMine, getAttempt, submit, listAdmin, getAdmin, createAdmin, updateAdmin, deleteAdmin };
}
