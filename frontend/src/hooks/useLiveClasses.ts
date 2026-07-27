import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  CreateLiveClassData,
  LiveClass,
  LiveClassAttendanceResponse,
  LiveClassResponse,
  StudentLiveClassesPage,
  UpdateLiveClassData,
} from "@/types/live-classes";

/** Pulls the most specific message the API returned. */
function errorMessage(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { error?: { message?: string }; message?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error?.message ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
}

export const useLiveClasses = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      fallbackMessage: string,
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await requestFn();
      } catch (err: unknown) {
        setError(errorMessage(err, fallbackMessage));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ===================
  // Admin & Instructor
  // ===================

  /** Server-side paginated + searched list. */
  const getAllLiveClasses = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      opts: { courseId?: string; search?: string } = {},
    ): Promise<LiveClassResponse | null> =>
      handleRequest(async () => {
        const response = await apiClient.get(ENDPOINTS.liveClasses.adminList, {
          params: {
            page,
            limit,
            ...(opts.courseId ? { courseId: opts.courseId } : {}),
            ...(opts.search ? { search: opts.search } : {}),
          },
        });
        return response.data.data as LiveClassResponse;
      }, "Failed to fetch live classes"),
    [handleRequest],
  );

  const getOngoingLiveClasses = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
    ): Promise<LiveClassResponse | null> =>
      handleRequest(async () => {
        const response = await apiClient.get(ENDPOINTS.liveClasses.ongoing, {
          params: { page, limit },
        });
        return response.data.data as LiveClassResponse;
      }, "Failed to fetch ongoing live classes"),
    [handleRequest],
  );

  const getInstructorLiveClasses = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      courseId?: string,
    ): Promise<LiveClassResponse | null> =>
      handleRequest(async () => {
        const response = await apiClient.get(
          ENDPOINTS.liveClasses.instructorList,
          { params: { page, limit, ...(courseId ? { courseId } : {}) } },
        );
        return response.data.data as LiveClassResponse;
      }, "Failed to fetch instructor live classes"),
    [handleRequest],
  );

  const createLiveClass = useCallback(
    async (data: CreateLiveClassData): Promise<LiveClass | null> =>
      handleRequest(async () => {
        const response = await apiClient.post(
          ENDPOINTS.liveClasses.create,
          data,
        );
        return response.data.data as LiveClass;
      }, "Failed to create live class"),
    [handleRequest],
  );

  const updateLiveClass = useCallback(
    async (
      liveClassId: string,
      data: UpdateLiveClassData,
    ): Promise<LiveClass | null> =>
      handleRequest(async () => {
        const response = await apiClient.put(
          ENDPOINTS.liveClasses.update(liveClassId),
          data,
        );
        return response.data.data as LiveClass;
      }, "Failed to update live class"),
    [handleRequest],
  );

  const getLiveClassById = useCallback(
    async (liveClassId: string): Promise<LiveClass | null> =>
      handleRequest(async () => {
        const response = await apiClient.get(
          ENDPOINTS.liveClasses.byId(liveClassId),
        );
        return response.data.data as LiveClass;
      }, "Failed to fetch live class"),
    [handleRequest],
  );

  const deleteLiveClass = useCallback(
    async (liveClassId: string): Promise<boolean> => {
      const result = await handleRequest(async () => {
        await apiClient.delete(ENDPOINTS.liveClasses.remove(liveClassId));
        return true;
      }, "Failed to delete live class");
      return result === true;
    },
    [handleRequest],
  );

  /**
   * Opens attendance link 1 or 2. One-shot — the API rejects a second
   * activation with 409, which is surfaced through `error`.
   */
  const activateLiveClassLink = useCallback(
    async (liveClassId: string, slot: 1 | 2): Promise<LiveClass | null> =>
      handleRequest(async () => {
        const response = await apiClient.post(
          ENDPOINTS.liveClasses.adminActivate(liveClassId, slot),
        );
        return response.data.data as LiveClass;
      }, `Failed to activate attendance ${slot}`),
    [handleRequest],
  );

  /**
   * Roster with each learner's attendance clicks and verdict. Requesting this
   * after both windows have closed is what finalizes attendance server-side.
   */
  const getLiveClassAttendance = useCallback(
    async (liveClassId: string): Promise<LiveClassAttendanceResponse | null> =>
      handleRequest(async () => {
        const response = await apiClient.get(
          ENDPOINTS.liveClasses.adminAttendance(liveClassId),
        );
        return response.data.data as LiveClassAttendanceResponse;
      }, "Failed to fetch attendance"),
    [handleRequest],
  );

  /**
   * Forces one learner's verdict, or `clear` to fall back to the computed one.
   * Returns the whole refreshed roster so counts stay in sync.
   */
  const setAttendanceOverride = useCallback(
    async (
      liveClassId: string,
      userId: string,
      verdict: "present" | "absent" | "clear",
    ): Promise<LiveClassAttendanceResponse | null> =>
      handleRequest(async () => {
        const response = await apiClient.post(
          ENDPOINTS.liveClasses.adminAttendanceOverride(liveClassId),
          { userId, verdict },
        );
        return response.data.data as LiveClassAttendanceResponse;
      }, "Failed to update attendance"),
    [handleRequest],
  );

  // ===================
  // Student
  // ===================

  const getStudentLiveClasses = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
    ): Promise<StudentLiveClassesPage | null> =>
      handleRequest(async () => {
        const response = await apiClient.get(ENDPOINTS.liveClasses.student, {
          params: { page, limit },
        });
        return response.data.data as StudentLiveClassesPage;
      }, "Failed to fetch live classes"),
    [handleRequest],
  );

  return {
    isLoading,
    error,
    clearError,

    getAllLiveClasses,
    getOngoingLiveClasses,
    getInstructorLiveClasses,
    createLiveClass,
    updateLiveClass,
    deleteLiveClass,
    getLiveClassById,
    activateLiveClassLink,
    getLiveClassAttendance,
    setAttendanceOverride,

    getStudentLiveClasses,
  };
};
