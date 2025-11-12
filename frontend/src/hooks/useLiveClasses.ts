import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import {
  LiveClass,
  LiveClassResponse,
  CreateLiveClassData,
  UpdateLiveClassData,
} from "@/types";

export const useLiveClasses = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      errorMessage: string
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await requestFn();
        return response;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error?.message || 
          err?.response?.data?.message ||
          err?.message || 
          errorMessage;
        setError(msg);
        // Return null but the error is stored in state and can be accessed
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ===================
  // Admin & Instructor Methods
  // ===================

  /**
   * Get all live classes (Admin only)
   */
  const getAllLiveClasses = useCallback(
    async (
      page: number = 1,
      limit: number = 10
    ): Promise<LiveClassResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        const response = await apiClient.get(
          `/live-classes/admin?${params.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch live classes");
    },
    [handleRequest]
  );

  /**
   * Get all ongoing live classes (Admin only)
   */
  const getOngoingLiveClasses = useCallback(
    async (
      page: number = 1,
      limit: number = 10
    ): Promise<LiveClassResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        const response = await apiClient.get(
          `/live-classes/ongoing?${params.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch ongoing live classes");
    },
    [handleRequest]
  );

  /**
   * Get instructor's live classes
   */
  const getInstructorLiveClasses = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      courseId?: string
    ): Promise<LiveClassResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (courseId) {
          params.append("courseId", courseId);
        }

        const response = await apiClient.get(
          `/live-classes/instructor?${params.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch instructor live classes");
    },
    [handleRequest]
  );

  /**
   * Create a new live class
   */
  const createLiveClass = useCallback(
    async (data: CreateLiveClassData): Promise<LiveClass | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post("/live-classes", data);
        return response.data.data;
      }, "Failed to create live class");
    },
    [handleRequest]
  );

  /**
   * Update an existing live class
   */
  const updateLiveClass = useCallback(
    async (
      liveClassId: string,
      data: Partial<CreateLiveClassData>
    ): Promise<LiveClass | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(
          `/live-classes/${liveClassId}`,
          data
        );
        return response.data.data;
      }, "Failed to update live class");
    },
    [handleRequest]
  );

  /**
   * Get live class by ID
   */
  const getLiveClassById = useCallback(
    async (liveClassId: string): Promise<LiveClass | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/live-classes/${liveClassId}`);
        return response.data.data;
      }, "Failed to fetch live class");
    },
    [handleRequest]
  );

  /**
   * Delete a live class
   */
  const deleteLiveClass = useCallback(
    async (liveClassId: string): Promise<boolean> => {
      return handleRequest(async () => {
        await apiClient.delete(`/live-classes/${liveClassId}`);
        return true;
      }, "Failed to delete live class") !== null;
    },
    [handleRequest]
  );

  // ===================
  // Student Methods
  // ===================

  /**
   * Get student's live classes (for enrolled courses)
   */
  const getStudentLiveClasses = useCallback(
    async (
      page: number = 1,
      limit: number = 10
    ): Promise<LiveClassResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        const response = await apiClient.get(
          `/live-classes/student?${params.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch student live classes");
    },
    [handleRequest]
  );

  return {
    // State
    isLoading,
    error,
    clearError,

    // Admin & Instructor Methods
    getAllLiveClasses,
    getOngoingLiveClasses,
    getInstructorLiveClasses,
    createLiveClass,
    updateLiveClass,
    deleteLiveClass,
    getLiveClassById,

    // Student Methods
    getStudentLiveClasses,
  };
};
