import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { User } from "@/types/user";
import { Course } from "@/types/course";
import { Enrollment, PartialAccessControl } from "@/types/enrollment";

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: "student" | "instructor" | "admin" | "super-admin";
  status?: "active" | "inactive" | "blocked";
}

export interface GetUsersResult {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GiftCourseData {
  userId: string;
  courseId: string;
  planType: "elite" | "essential";
  message?: string;
  accessControl?: PartialAccessControl;
}

export interface TrialCourseData {
  userId: string;
  courseId: string;
  trialDurationDays?: number;
  planType?: "elite" | "essential"; // Defaults to essential when not specified
}

const useUserManagement = () => {
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

  const getUsers = useCallback(
    async (params: GetUsersParams = {}): Promise<GetUsersResult | null> => {
      return handleRequest(
        async () => {
          const queryParams = new URLSearchParams();
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.limit) queryParams.append("limit", params.limit.toString());
          if (params.search) queryParams.append("search", params.search);
          if (params.userType) queryParams.append("userType", params.userType);
          if (params.status) queryParams.append("status", params.status);

          const response = await apiClient.get(
            `/users/admin?${queryParams.toString()}`
          );
          return response.data.data;
        },
        "Failed to fetch users"
      );
    },
    [handleRequest]
  );

  const getUserById = useCallback(
    async (userId: string): Promise<User | null> => {
      return handleRequest(
        async () => {
          const response = await apiClient.get(`/users/admin/${userId}`);
          return response.data.data;
        },
        "Failed to fetch user"
      );
    },
    [handleRequest]
  );

  const updateUserStatus = useCallback(
    async (userId: string, status: "active" | "inactive" | "blocked"): Promise<User | null> => {
      return handleRequest(
        async () => {
          const response = await apiClient.put(`/users/admin/${userId}/status`, { status });
          return response.data.data;
        },
        "Failed to update user status"
      );
    },
    [handleRequest]
  );

  const giftCourse = useCallback(
    async (data: GiftCourseData): Promise<Enrollment | null> => {
      try {
        const requestBody: any = {
          userId: data.userId,
          courseId: data.courseId,
          planType: data.planType,
          enrollmentSource: "gift",
        };

        // Only include accessControl if it's provided
        if (data.accessControl) {
          requestBody.accessControl = data.accessControl;
        }

        const response = await apiClient.post("/enrollments", requestBody);
        return response.data.data;
      } catch (error: any) {
        // Extract the specific error message from the backend
        const errorMessage = error.response?.data?.error?.message || "Failed to gift course";
        setError(errorMessage);
        console.error("Gift course error:", error);
        throw new Error(errorMessage); // Throw the error so it can be caught in the component
      }
    },
    [setError]
  );

  const createTrialEnrollment = useCallback(
    async (data: TrialCourseData): Promise<Enrollment | null> => {
      try {
        const requestBody: any = {
          userId: data.userId,
          courseId: data.courseId,
          isTrial: true,
          trialDurationDays: data.trialDurationDays || 7, // Default to 7 days if not specified
          planType: data.planType || "essential", // Default to essential for trial
        };

        const response = await apiClient.post("/enrollments", requestBody);
        return response.data.data;
      } catch (error: any) {
        // Extract the specific error message from the backend
        const errorMessage = error.response?.data?.error?.message || "Failed to create trial enrollment";
        setError(errorMessage);
        console.error("Trial enrollment error:", error);
        throw new Error(errorMessage); // Throw the error so it can be caught in the component
      }
    },
    [setError]
  );

  const getUserEnrollments = useCallback(
    async (userId: string, params: {
      page?: number;
      limit?: number;
      status?: string;
    } = {}): Promise<{
      enrollments: Enrollment[];
      total: number;
      page: number;
      totalPages: number;
    } | null> => {
      return handleRequest(
        async () => {
          const queryParams = new URLSearchParams();
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.limit) queryParams.append("limit", params.limit.toString());
          if (params.status) queryParams.append("status", params.status);

          const response = await apiClient.get(
            `/enrollments/user/${userId}?${queryParams.toString()}`
          );
          return response.data.data;
        },
        "Failed to fetch user enrollments"
      );
    },
    [handleRequest]
  );

  const updateUser = useCallback(
    async (userId: string, updateData: Partial<User>): Promise<User | null> => {
      return handleRequest(
        async () => {
          const response = await apiClient.put(`/users/admin/${userId}`, updateData);
          return response.data.data;
        },
        "Failed to update user"
      );
    },
    [handleRequest]
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<User | null> => {
      return handleRequest(
        async () => {
          const response = await apiClient.delete(`/users/admin/${userId}`);
          return response.data.data;
        },
        "Failed to delete user"
      );
    },
    [handleRequest]
  );

  const changeUserPassword = useCallback(
    async (userId: string, newPassword: string): Promise<boolean> => {
      return handleRequest(
        async () => {
          const response = await apiClient.put(`/users/admin/${userId}/password`, {
            newPassword,
          });
          return response.data.success;
        },
        "Failed to change user password"
      ) as Promise<boolean>;
    },
    [handleRequest]
  );

  // Validation functions
  const validateGiftCourseData = useCallback((data: GiftCourseData): string[] => {
    const errors: string[] = [];

    if (!data.userId) {
      errors.push("User ID is required");
    }

    if (!data.courseId) {
      errors.push("Course ID is required");
    }

    return errors;
  }, []);

  return {
    // State
    isLoading,
    error,

    // Actions
    getUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    deleteUser,
    changeUserPassword,
    giftCourse,
    createTrialEnrollment,
    getUserEnrollments,

    // Validation
    validateGiftCourseData,
  };
};

export default useUserManagement;
