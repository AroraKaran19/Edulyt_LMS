import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { Enrollment } from "@/types/enrollment";
import { Course } from "@/types/course";

export interface UserEnrollment {
  enrollment: Enrollment;
  course: Course;
  progress: number;
  showCertificate: boolean;
}

export interface GetUserEnrollmentsParams {
  page?: number;
  limit?: number;
  status?: "active" | "completed" | "dropped" | "revoked" | "paused" | "all";
  search?: string;
  sortBy?:
    | "recent"
    | "progress-desc"
    | "progress-asc"
    | "name-asc"
    | "name-desc"
    | "duration-asc"
    | "duration-desc";
  /**
   * Exclude enrollments whose course is retired or deleted. Off by default so
   * My Programs keeps listing them as "no longer available".
   */
  courseActive?: boolean;
}

export interface GetUserEnrollmentsResult {
  enrollments: Enrollment[]; // Backend returns Enrollment[] directly
  total: number;
  page: number;
  totalPages: number;
}

const useUserEnrollments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      errorMessage: string
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await requestFn();
        return result;
      } catch (err: any) {
        const errorMsg = err.response?.data?.error?.message || errorMessage;
        setError(errorMsg);
        console.error(errorMessage, err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getUserEnrollments = useCallback(
    async (
      params: GetUserEnrollmentsParams = {}
    ): Promise<GetUserEnrollmentsResult | null> => {
      return handleRequest(async () => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.status && params.status !== "all")
          queryParams.append("status", params.status);
        if (params.search) queryParams.append("search", params.search);
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.courseActive) queryParams.append("courseActive", "true");

        const response = await apiClient.get(
          `/enrollments/user/me?${queryParams.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch user enrollments");
    },
    [handleRequest]
  );

  const getEnrollmentById = useCallback(
    async (enrollmentId: string): Promise<UserEnrollment | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/enrollments/${enrollmentId}`);
        return response.data.data;
      }, "Failed to fetch enrollment");
    },
    [handleRequest]
  );

  const updateEnrollmentProgress = useCallback(
    async (
      enrollmentId: string,
      progressData: {
        moduleId?: string;
        lessonId?: string;
        contentId?: string;
        contentType?: "video" | "quiz" | "document";
        lastPosition?: number;
      }
    ): Promise<Enrollment | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(
          `/enrollments/${enrollmentId}/progress`,
          progressData
        );
        return response.data.data;
      }, "Failed to update enrollment progress");
    },
    [handleRequest]
  );

  const pauseEnrollment = useCallback(
    async (enrollmentId: string): Promise<Enrollment | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(
          `/enrollments/${enrollmentId}/pause`
        );
        return response.data.data;
      }, "Failed to pause enrollment");
    },
    [handleRequest]
  );

  const resumeEnrollment = useCallback(
    async (enrollmentId: string): Promise<Enrollment | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(
          `/enrollments/${enrollmentId}/resume`
        );
        return response.data.data;
      }, "Failed to resume enrollment");
    },
    [handleRequest]
  );

  const issueCertificate = useCallback(
    async (
      enrollmentId: string
    ): Promise<{ certificateUrl: string } | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          `/enrollments/${enrollmentId}/certificate`
        );
        return response.data.data;
      }, "Failed to issue certificate");
    },
    [handleRequest]
  );

  // Helper function to calculate progress percentage
  const calculateProgress = useCallback((enrollment: Enrollment): number => {
    if (!enrollment.progress) return 0;
    return Math.round(enrollment.progress.overallCompletion || 0);
  }, []);

  // Helper function to check if certificate should be shown
  const shouldShowCertificate = useCallback(
    (enrollment: Enrollment): boolean => {
      return (
        enrollment.status === "completed" &&
        enrollment.certificateIssued === true &&
        enrollment.progress?.overallCompletion === 100
      );
    },
    []
  );

  return {
    // State
    isLoading,
    error,

    // Actions
    getUserEnrollments,
    getEnrollmentById,
    updateEnrollmentProgress,
    pauseEnrollment,
    resumeEnrollment,
    issueCertificate,

    // Helpers
    calculateProgress,
    shouldShowCertificate,
  };
};

export default useUserEnrollments;
