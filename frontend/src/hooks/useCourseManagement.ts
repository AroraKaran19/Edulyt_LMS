import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { Course } from "@/types/course";
import type {
  AdminCourseOptionsResponse,
  CourseFilters,
} from "@/hooks/useCourse";

export interface GetCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  audience?: "college-students" | "professionals";
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface GetCoursesResult {
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
}

const useCourseManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      errorMessage: string,
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
    [],
  );

  const getCourses = useCallback(
    async (params: GetCoursesParams = {}): Promise<GetCoursesResult | null> => {
      return handleRequest(async () => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.category) queryParams.append("category", params.category);
        if (params.audience) queryParams.append("audience", params.audience);
        if (params.isActive !== undefined)
          queryParams.append("isActive", params.isActive.toString());
        if (params.isFeatured !== undefined)
          queryParams.append("isFeatured", params.isFeatured.toString());

        const response = await apiClient.get(
          `/courses/admin?${queryParams.toString()}`,
        );
        return response.data.data;
      }, "Failed to fetch courses");
    },
    [handleRequest],
  );

  const getCourseById = useCallback(
    async (courseId: string): Promise<Course | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/courses/admin/id/${courseId}`);
        return response.data.data;
      }, "Failed to fetch course");
    },
    [handleRequest],
  );

  const getAdminCourseOptions = useCallback(
    async (
      filters: CourseFilters = {},
    ): Promise<AdminCourseOptionsResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.searchTitleOnly) params.append("searchTitleOnly", "true");
        if (filters.categories) params.append("categories", filters.categories);
        if (filters.instructors)
          params.append("instructors", filters.instructors);
        if (filters.audience) params.append("audience", filters.audience);
        if (filters.isActive !== undefined)
          params.append("isActive", filters.isActive.toString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

        const response = await apiClient.get(
          `/courses/admin/options?${params.toString()}`,
        );
        return response.data.data;
      }, "Failed to fetch admin course options");
    },
    [handleRequest],
  );

  return {
    // State
    isLoading,
    error,

    // Actions
    getCourses,
    getCourseById,
    getAdminCourseOptions,
  };
};

export default useCourseManagement;
