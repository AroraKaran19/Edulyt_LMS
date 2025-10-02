import { useState, useCallback } from "react";
import { Course } from "@/types/course";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";

export interface CourseResponse {
  success: boolean;
  data?: Course;
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

  // Get all courses with optimization options
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

        const response = await apiClient.get(`/courses?${params}`);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch courses";
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
    []
  );




  // Update course metadata
  const updateCourseMetadata = useCallback(
    async (courseId: string, courseData: any): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(`/courses/${courseId}/metadata`, courseData);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to update course metadata";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to update course metadata",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update course status
  const updateCourseStatus = useCallback(
    async (courseId: string, status: boolean): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(`/courses/status/${courseId}`, { isActive: status });
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to update course status";
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
    []
  );

  // Update course status in bulk
  const updateCourseStatusBulk = useCallback(
    async (
      courses: Course["_id"][],
      isActive: boolean
    ): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put("/courses/status/bulk", { courses, isActive });
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to update course status in bulk";
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
    []
  );

  // Delete course
  const deleteCourseById = useCallback(
    async (courseId: string): Promise<CourseListResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.delete(`/courses/${courseId}`);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to delete course";
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
    []
  );

  // Get course by ID (Admin version - includes inactive courses)
  const getCourseByIdAdmin = useCallback(
    async (courseId: string): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/courses/admin/id/${courseId}`);
        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch course";
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
    []
  );

  // Chunked course creation functions
  const createCourseMetadata = useCallback(
    async (courseMetadata: any): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

        const response = await apiClient.post("/courses/chunked/metadata", courseMetadata, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result = response.data;

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err: any) {
        let errorMessage = "Failed to create course metadata";

        if (err?.name === "AbortError") {
          errorMessage = "Request timeout - Course metadata creation took too long. Please try again.";
        } else {
          errorMessage = err?.response?.data?.message || err?.message || "Failed to create course metadata";
        }

        setError(errorMessage);
        return {
          success: false,
          message: "Failed to create course metadata",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Individual module operations (real-time)
  const addSingleCourseModule = useCallback(
    async (courseId: string, moduleData: any): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.post(`/courses/${courseId}/modules`, moduleData);
        const result = response.data;

        if (!result.success) {
          toast.error(result.error.message || "Failed to add module");
          return {
            success: false,
            message: result.error.message || "Failed to add module",
            error: result.error.message || "Failed to add module",
          };
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to add module";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to add module",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateSingleCourseModule = useCallback(
    async (
      courseId: string,
      moduleId: string,
      moduleData: any
    ): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(`/courses/${courseId}/modules/${moduleId}`, moduleData);
        const result = response.data;

        if (!result.success) {
          toast.error(result.error.message || "Failed to update module");
          return {
            success: false,
            message: result.error.message || "Failed to update module",
            error: result.error.message || "Failed to update module",
          };
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to update module";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to update module",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteSingleCourseModule = useCallback(
    async (courseId: string, moduleId: string): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.delete(`/courses/${courseId}/modules/${moduleId}`);
        const result = response.data;

        if (!result.success) {
          toast.error(result.error.message || "Failed to delete module");
          return {
            success: false,
            message: result.error.message || "Failed to delete module",
            error: result.error.message || "Failed to delete module",
          };
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete module";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ===================
  // LESSON CRUD OPERATIONS
  // ===================

  // Add a single lesson to module (real-time)
  const addSingleCourseLesson = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonData: any
    ): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.post(`/courses/${courseId}/modules/${moduleId}/lessons`, lessonData);
        const result = response.data;

        if (!result.success) {
          toast.error(result.error.message || "Failed to add lesson");
          return {
            success: false,
            message: result.error.message || "Failed to add lesson",
            error: result.error.message || "Failed to add lesson",
          };
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to add lesson";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to add lesson",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update a single lesson in module (real-time)
  const updateSingleCourseLesson = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string,
      lessonData: any
    ): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, lessonData);
        const result = response.data;

        if (!result.success) {
          toast.error(result.error.message || "Failed to update lesson");
          return {
            success: false,
            message: result.error.message || "Failed to update lesson",
            error: result.error.message || "Failed to update lesson",
          };
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to update lesson";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to update lesson",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Delete a single lesson from module (real-time)
  const deleteSingleCourseLesson = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string
    ): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
        const result = response.data;

        if (!result.success) {
          toast.error(result.error.message || "Failed to delete lesson");
          return {
            success: false,
            message: result.error.message || "Failed to delete lesson",
            error: result.error.message || "Failed to delete lesson",
          };
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete lesson";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to delete lesson",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ===================
  // CONTENT CRUD OPERATIONS
  // ===================

  // Add a single content to lesson (real-time)
  const addSingleCourseContent = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string,
      contentData: any
    ): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.post(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents`, contentData);
        const result = response.data;

        if (!result.success) {
          toast.error(result.error.message || "Failed to add content");
          return {
            success: false,
            message: result.error.message || "Failed to add content",
            error: result.error.message || "Failed to add content",
          };
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to add content";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to add content",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update a single content in lesson (real-time)
  const updateSingleCourseContent = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string,
      contentId: string,
      contentData: any
    ): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents/${contentId}`, contentData);
        const result = response.data;

        if (!result.success) {
          toast.error(result.error.message || "Failed to update content");
          return {
            success: false,
            message: result.error.message || "Failed to update content",
            error: result.error.message || "Failed to update content",
          };
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to update content";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to update content",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Delete a single content from lesson (real-time)
  const deleteSingleCourseContent = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string,
      contentId: string
    ): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents/${contentId}`);
        const result = response.data;

        if (!result.success) {
          toast.error(result.error.message || "Failed to delete content");
          return {
            success: false,
            message: result.error.message || "Failed to delete content",
            error: result.error.message || "Failed to delete content",
          };
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete content";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to delete content",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    // State
    isLoading,
    error,

    // Methods
    getAllCourses,
    getCourseByIdAdmin,
    updateCourseMetadata,
    updateCourseStatus,
    updateCourseStatusBulk,
    deleteCourseById,
    // Reset error
    clearError: () => setError(""),
    // Course creation methods
    createCourseMetadata,
    // Individual module operations (real-time)
    addSingleCourseModule,
    updateSingleCourseModule,
    deleteSingleCourseModule,
    // Individual lesson operations (real-time)
    addSingleCourseLesson,
    updateSingleCourseLesson,
    deleteSingleCourseLesson,
    // Individual content operations (real-time)
    addSingleCourseContent,
    updateSingleCourseContent,
    deleteSingleCourseContent,
  };
};
