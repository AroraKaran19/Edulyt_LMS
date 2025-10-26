import { useState, useCallback } from "react";
import { Instructor } from "@/types";
import apiClient from "@/configs/apiConfig";

export interface GetInstructorsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetInstructorsResult {
  instructors: Instructor[];
  total: number;
  page: number;
  totalPages: number;
}

export const useInstructor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getInstructors = useCallback(
    async (
      params: GetInstructorsParams = {}
    ): Promise<GetInstructorsResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);

        const response = await apiClient.get(
          `/instructors?${queryParams.toString()}`
        );

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.message || "Failed to fetch instructors"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch instructors";
        setError(errorMessage);
        console.error("Error fetching instructors:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getInstructorById = useCallback(
    async (instructorId: string): Promise<Instructor | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/instructors/${instructorId}`);

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.message || "Failed to fetch instructor"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch instructor";
        setError(errorMessage);
        console.error("Error fetching instructor:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getInstructorsByIds = useCallback(
    async (instructorIds: string[]): Promise<Instructor[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.post("/instructors/batch", {
          instructorIds,
        });

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.message || "Failed to fetch instructors"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch instructors";
        setError(errorMessage);
        console.error("Error fetching instructors:", err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    getInstructors,
    getInstructorById,
    getInstructorsByIds,
    isLoading,
    error,
    clearError,
  };
};
