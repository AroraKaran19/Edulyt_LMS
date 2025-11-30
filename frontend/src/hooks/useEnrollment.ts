import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { Enrollment } from "@/types/enrollment";

export interface CheckEnrollmentParams {
  courseId: string;
}

import { PartialAccessControl } from "@/types/enrollment";

export interface EnrollmentStatus {
  isEnrolled: boolean;
  enrollment?: Enrollment;
  status?: "active" | "completed" | "dropped" | "paused";
  canAccess: boolean;
  accessControl?: PartialAccessControl | null;
}

const useEnrollment = () => {
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

  const checkEnrollment = useCallback(
    async (params: CheckEnrollmentParams): Promise<EnrollmentStatus | null> => {
      return handleRequest(
        async () => {
          const response = await apiClient.get(
            `/enrollments/check/${params.courseId}`
          );
          return response.data.data;
        },
        "Failed to check enrollment status"
      );
    },
    [handleRequest]
  );

  const getUserEnrollments = useCallback(
    async (params: {
      status?: string;
      page?: number;
      limit?: number;
    } = {}): Promise<{
      enrollments: Enrollment[];
      total: number;
      page: number;
      totalPages: number;
    } | null> => {
      return handleRequest(
        async () => {
          const queryParams = new URLSearchParams();
          if (params.status) queryParams.append("status", params.status);
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.limit) queryParams.append("limit", params.limit.toString());

          const response = await apiClient.get(
            `/enrollments/user?${queryParams.toString()}`
          );
          return response.data.data;
        },
        "Failed to fetch user enrollments"
      );
    },
    [handleRequest]
  );

  const createEnrollment = useCallback(
    async (data: {
      courseId: string;
      enrollmentSource?: "direct" | "gift" | "promotion" | "trial";
      promotionCode?: string;
      giftFrom?: string;
      isTrial?: boolean;
      trialDurationDays?: number;
    }): Promise<Enrollment | null> => {
      return handleRequest(
        async () => {
          const response = await apiClient.post("/enrollments", data);
          return response.data.data;
        },
        "Failed to create enrollment"
      );
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
        completed?: boolean;
        timeSpent?: number;
      }
    ): Promise<Enrollment | null> => {
      return handleRequest(
        async () => {
          const response = await apiClient.put(
            `/enrollments/${enrollmentId}/progress`,
            progressData
          );
          return response.data.data;
        },
        "Failed to update enrollment progress"
      );
    },
    [handleRequest]
  );

  const pauseEnrollment = useCallback(
    async (enrollmentId: string): Promise<Enrollment | null> => {
      return handleRequest(
        async () => {
          const response = await apiClient.put(
            `/enrollments/${enrollmentId}/pause`
          );
          return response.data.data;
        },
        "Failed to pause enrollment"
      );
    },
    [handleRequest]
  );

  const resumeEnrollment = useCallback(
    async (enrollmentId: string): Promise<Enrollment | null> => {
      return handleRequest(
        async () => {
          const response = await apiClient.put(
            `/enrollments/${enrollmentId}/resume`
          );
          return response.data.data;
        },
        "Failed to resume enrollment"
      );
    },
    [handleRequest]
  );

  const deleteEnrollment = useCallback(
    async (enrollmentId: string): Promise<boolean> => {
      const result = await handleRequest(
        async () => {
          await apiClient.delete(`/enrollments/${enrollmentId}`);
          return true;
        },
        "Failed to delete enrollment"
      );
      return result !== null;
    },
    [handleRequest]
  );

  // Validation functions
  const validateEnrollmentData = useCallback((data: {
    courseId: string;
    enrollmentSource?: string;
    promotionCode?: string;
    giftFrom?: string;
  }): string[] => {
    const errors: string[] = [];

    if (!data.courseId) {
      errors.push("Course ID is required");
    }

    if (data.enrollmentSource && !["direct", "gift", "promotion"].includes(data.enrollmentSource)) {
      errors.push("Invalid enrollment source");
    }

    return errors;
  }, []);

  return {
    // State
    isLoading,
    error,

    // Actions
    checkEnrollment,
    getUserEnrollments,
    createEnrollment,
    updateEnrollmentProgress,
    pauseEnrollment,
    resumeEnrollment,
    deleteEnrollment,

    // Validation
    validateEnrollmentData,
  };
};

export default useEnrollment;
