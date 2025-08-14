import { useState, useCallback } from "react";
import { Course } from "@/types/course";

export interface CourseResponse {
  success: boolean;
  data?: {
    course: Course;
  };
  message?: string;
  error?: string;
  errors?: string[];
}

export interface CourseListResponse {
  success: boolean;
  data?: {
    courses: Course[];
    pagination: {
      totalPages: number;
      total: number;
    };
  };
  message?: string;
  error?: string;
}

export const useCourses = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Get all courses
  const getAllCourses = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      search: string = "",
      category?: string
    ): Promise<CourseListResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
        });

        if (category) {
          params.append("category", category);
        }

        const response = await fetch(`${baseUrl}/courses?${params}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch courses";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch courses",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Get course by slug
  const getCourseBySlug = useCallback(
    async (slug: string): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${slug}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch course";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch course",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Get course by ID
  const getCourseById = useCallback(
    async (courseId: string): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/id/${courseId}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch course";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch course",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Create course
  const createCourse = useCallback(
    async (courseData: any): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(courseData),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create course";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to create course",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Update course
  const updateCourse = useCallback(
    async (courseId: string, courseData: any): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(courseData),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update course";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to update course",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Update course status
  const updateCourseStatus = useCallback(
    async (courseId: string, status: boolean): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/status/${courseId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: status }),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update course status";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to update course status",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Update course status in bulk
  const updateCourseStatusBulk = useCallback(
    async (courses: Course["_id"][], isActive: boolean): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/status/bulk`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ courses, isActive }),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update course status in bulk";
        setError(errorMessage);
        console.error("Error updating course status in bulk:", errorMessage);
        return {
          success: false,
          message: "Failed to update course status in bulk",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Delete course
  const deleteCourseById = useCallback(
    async (courseId: string): Promise<CourseListResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete course";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to delete course",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Get course by ID (Admin version - includes inactive courses)
  const getCourseByIdAdmin = useCallback(
    async (courseId: string): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/admin/id/${courseId}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch course";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch course",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  return {
    // State
    isLoading,
    error,

    // Methods
    getAllCourses,
    getCourseBySlug,
    getCourseById,
    getCourseByIdAdmin,
    createCourse,
    updateCourse,
    updateCourseStatus,
    updateCourseStatusBulk,
    deleteCourseById,
    // Reset error
    clearError: () => setError(""),
  };
};
