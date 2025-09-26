import { useState, useCallback } from "react";
import { Course } from "@/types/course";

export interface CourseResponse {
  success: boolean;
  data?: {
    course: Course;
    courseId?: string;
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

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }

  // Get all courses with optimization options
  const getAllCourses = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      search: string = "",
      category?: string,
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

  // Update course metadata
  const updateCourseMetadata = useCallback(
    async (courseId: string, courseData: any): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/metadata`, {
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
          err instanceof Error ? err.message : "Failed to update course metadata";
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
    async (
      courses: Course["_id"][],
      isActive: boolean
    ): Promise<CourseResponse> => {
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

  // Chunked course creation functions
  const createCourseMetadata = useCallback(
    async (courseMetadata: any): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

        const response = await fetch(`${baseUrl}/courses/chunked/metadata`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(courseMetadata),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        let errorMessage = "Failed to create course metadata";

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage =
              "Request timeout - Course metadata creation took too long. Please try again.";
          } else {
            errorMessage = err.message;
          }
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
    [baseUrl]
  );


  const addCourseLessons = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessons: any[]
    ): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

        const response = await fetch(
          `${baseUrl}/courses/chunked/${courseId}/lessons`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ moduleId, lessons }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        let errorMessage = "Failed to add course lessons";

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage =
              "Request timeout - Adding course lessons took too long. Please try again.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        return {
          success: false,
          message: "Failed to add course lessons",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  const finalizeCourseCreation = useCallback(
    async (courseId: string): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

        const response = await fetch(
          `${baseUrl}/courses/chunked/${courseId}/finalize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        let errorMessage = "Failed to finalize course creation";

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage =
              "Request timeout - Finalizing course creation took too long. Please try again.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        return {
          success: false,
          message: "Failed to finalize course creation",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );


  // Individual module operations (real-time)
  const addSingleCourseModule = useCallback(
    async (courseId: string, moduleData: any): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(moduleData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to add module");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to add module";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  const updateSingleCourseModule = useCallback(
    async (courseId: string, moduleId: string, moduleData: any): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(moduleData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to update module");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update module";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  const deleteSingleCourseModule = useCallback(
    async (courseId: string, moduleId: string): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to delete module");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete module";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // ===================
  // LESSON CRUD OPERATIONS
  // ===================

  // Add a single lesson to module (real-time)
  const addSingleCourseLesson = useCallback(
    async (courseId: string, moduleId: string, lessonData: any): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}/lessons`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lessonData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to add lesson");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to add lesson";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Update a single lesson in module (real-time)
  const updateSingleCourseLesson = useCallback(
    async (courseId: string, moduleId: string, lessonId: string, lessonData: any): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lessonData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to update lesson");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update lesson";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Delete a single lesson from module (real-time)
  const deleteSingleCourseLesson = useCallback(
    async (courseId: string, moduleId: string, lessonId: string): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to delete lesson");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete lesson";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // ===================
  // CONTENT CRUD OPERATIONS
  // ===================

  // Add a single content to lesson (real-time)
  const addSingleCourseContent = useCallback(
    async (courseId: string, moduleId: string, lessonId: string, contentData: any): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contentData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to add content");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to add content";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Update a single content in lesson (real-time)
  const updateSingleCourseContent = useCallback(
    async (courseId: string, moduleId: string, lessonId: string, contentId: string, contentData: any): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents/${contentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contentData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to update content");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update content";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Delete a single content from lesson (real-time)
  const deleteSingleCourseContent = useCallback(
    async (courseId: string, moduleId: string, lessonId: string, contentId: string): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents/${contentId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to delete content");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete content";
        setError(errorMessage);
        throw error;
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
    getCourseByIdAdmin,
    createCourse,
    updateCourse,
    updateCourseMetadata,
    updateCourseStatus,
    updateCourseStatusBulk,
    deleteCourseById,
    // Reset error
    clearError: () => setError(""),
    // Course creation methods
    createCourseMetadata,
    addCourseLessons,
    finalizeCourseCreation,
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
