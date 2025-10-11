import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import {
  Enrollment,
  EnrollmentResponse,
  EnrollmentListResponse,
  EnrollmentStatsResponse,
  EnrollmentCheckResponse,
  CreateEnrollmentRequest,
  UpdateProgressRequest,
  UpdateStatusRequest,
  EnrollmentQueryParams,
  CourseEnrollmentStats,
  UserEnrollmentStats,
} from "@/types/enrollment";

export const useEnrollment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // ===================
  // ENROLLMENT CRUD OPERATIONS
  // ===================

  /**
   * Create a new enrollment
   */
  const createEnrollment = useCallback(
    async (enrollmentData: CreateEnrollmentRequest): Promise<EnrollmentResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.post("/enrollment", enrollmentData);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
          toast.error(result.error || result.message || "Failed to create enrollment");
        } else {
          toast.success("Successfully enrolled in course!");
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to create enrollment";
        setError(errorMessage);
        toast.error(errorMessage);
        return {
          success: false,
          message: "Failed to create enrollment",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get user's enrollments
   */
  const getUserEnrollments = useCallback(
    async (params?: EnrollmentQueryParams): Promise<EnrollmentListResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const queryParams = new URLSearchParams();
        
        if (params?.status) queryParams.append("status", params.status);
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

        const response = await apiClient.get(`/enrollment/user?${queryParams}`);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch enrollments";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch enrollments",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get course enrollments (admin/instructor only)
   */
  const getCourseEnrollments = useCallback(
    async (courseId: string, params?: EnrollmentQueryParams): Promise<EnrollmentListResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const queryParams = new URLSearchParams();
        
        if (params?.status) queryParams.append("status", params.status);
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

        const response = await apiClient.get(`/enrollment/course/${courseId}?${queryParams}`);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch course enrollments";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch course enrollments",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get specific enrollment for a course
   */
  const getEnrollment = useCallback(
    async (courseId: string): Promise<EnrollmentResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/enrollment/${courseId}`);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch enrollment";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch enrollment",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Check if user is enrolled in a course
   */
  const checkEnrollment = useCallback(
    async (courseId: string): Promise<EnrollmentCheckResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/enrollment/${courseId}/check`);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to check enrollment";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to check enrollment",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete enrollment
   */
  const deleteEnrollment = useCallback(
    async (courseId: string): Promise<EnrollmentResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.delete(`/enrollment/${courseId}`);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
          toast.error(result.error || result.message || "Failed to delete enrollment");
        } else {
          toast.success("Successfully unenrolled from course");
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to delete enrollment";
        setError(errorMessage);
        toast.error(errorMessage);
        return {
          success: false,
          message: "Failed to delete enrollment",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ===================
  // PROGRESS TRACKING
  // ===================

  /**
   * Update enrollment progress for a specific lesson
   */
  const updateEnrollmentProgress = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string,
      progressData: UpdateProgressRequest
    ): Promise<EnrollmentResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(
          `/enrollment/${courseId}/modules/${moduleId}/lessons/${lessonId}/progress`,
          progressData
        );
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
          toast.error(result.error || result.message || "Failed to update progress");
        } else {
          toast.success("Progress updated successfully!");
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to update progress";
        setError(errorMessage);
        toast.error(errorMessage);
        return {
          success: false,
          message: "Failed to update progress",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Mark enrollment as completed
   */
  const completeEnrollment = useCallback(
    async (courseId: string): Promise<EnrollmentResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(`/enrollment/${courseId}/complete`);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
          toast.error(result.error || result.message || "Failed to complete enrollment");
        } else {
          toast.success("Congratulations! Course completed successfully!");
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to complete enrollment";
        setError(errorMessage);
        toast.error(errorMessage);
        return {
          success: false,
          message: "Failed to complete enrollment",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update enrollment status
   */
  const updateEnrollmentStatus = useCallback(
    async (courseId: string, statusData: UpdateStatusRequest): Promise<EnrollmentResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(`/enrollment/${courseId}/status`, statusData);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
          toast.error(result.error || result.message || "Failed to update enrollment status");
        } else {
          toast.success("Enrollment status updated successfully!");
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to update enrollment status";
        setError(errorMessage);
        toast.error(errorMessage);
        return {
          success: false,
          message: "Failed to update enrollment status",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ===================
  // STATISTICS & ANALYTICS
  // ===================

  /**
   * Get course enrollment statistics
   */
  const getCourseEnrollmentStats = useCallback(
    async (courseId: string): Promise<EnrollmentStatsResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/enrollment/stats/course/${courseId}`);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch course enrollment statistics";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch course enrollment statistics",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get user enrollment statistics
   */
  const getUserEnrollmentStats = useCallback(
    async (): Promise<EnrollmentStatsResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get("/enrollment/stats/user");
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch user enrollment statistics";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch user enrollment statistics",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get overall enrollment statistics (admin only)
   */
  const getOverallEnrollmentStats = useCallback(
    async (): Promise<EnrollmentStatsResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get("/enrollment/stats/overall");
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch overall enrollment statistics";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch overall enrollment statistics",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ===================
  // UTILITY FUNCTIONS
  // ===================

  /**
   * Get enrollment progress percentage
   */
  const getEnrollmentProgress = useCallback((enrollment: Enrollment): number => {
    return enrollment.progress.overallCompletion || 0;
  }, []);

  /**
   * Check if enrollment is completed
   */
  const isEnrollmentCompleted = useCallback((enrollment: Enrollment): boolean => {
    return enrollment.status === "completed" || enrollment.progress.overallCompletion === 100;
  }, []);

  /**
   * Check if enrollment is active
   */
  const isEnrollmentActive = useCallback((enrollment: Enrollment): boolean => {
    return enrollment.status === "active";
  }, []);

  /**
   * Get time spent in hours
   */
  const getTimeSpentInHours = useCallback((enrollment: Enrollment): number => {
    return Math.round((enrollment.totalTimeSpent || 0) / 3600 * 100) / 100; // Convert seconds to hours
  }, []);

  /**
   * Get days since enrollment
   */
  const getDaysSinceEnrollment = useCallback((enrollment: Enrollment): number => {
    const now = new Date();
    const enrolledAt = new Date(enrollment.enrolledAt);
    const diffTime = Math.abs(now.getTime() - enrolledAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  /**
   * Get completion rate for a course
   */
  const getCourseCompletionRate = useCallback((stats: CourseEnrollmentStats): number => {
    return stats.completionRate || 0;
  }, []);

  /**
   * Get user's average completion rate
   */
  const getUserAverageCompletionRate = useCallback((stats: UserEnrollmentStats): number => {
    return stats.averageCompletionRate || 0;
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    // State
    isLoading,
    error,

    // Enrollment CRUD
    createEnrollment,
    getUserEnrollments,
    getCourseEnrollments,
    getEnrollment,
    checkEnrollment,
    deleteEnrollment,

    // Progress tracking
    updateEnrollmentProgress,
    completeEnrollment,
    updateEnrollmentStatus,

    // Statistics & Analytics
    getCourseEnrollmentStats,
    getUserEnrollmentStats,
    getOverallEnrollmentStats,

    // Utility functions
    getEnrollmentProgress,
    isEnrollmentCompleted,
    isEnrollmentActive,
    getTimeSpentInHours,
    getDaysSinceEnrollment,
    getCourseCompletionRate,
    getUserAverageCompletionRate,
    clearError,
  };
};
