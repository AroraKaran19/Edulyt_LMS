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

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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
          body: JSON.stringify({ courseIds: courses, isActive }),
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

  const addCourseModules = useCallback(
    async (courseId: string, modules: any[]): Promise<any> => {
      setIsLoading(true);
      setError("");

      try {
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

        const response = await fetch(
          `${baseUrl}/courses/chunked/${courseId}/modules`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(modules),
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
        let errorMessage = "Failed to add course modules";

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage =
              "Request timeout - Adding course modules took too long. Please try again.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        return {
          success: false,
          message: "Failed to add course modules",
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

  const createCourseChunked = useCallback(
    async (courseData: any): Promise<CourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        // Step 1: Create course metadata
        const { modules, ...metadata } = courseData;
        const metadataResult = await createCourseMetadata(metadata);

        if (!metadataResult.success) {
          throw new Error(
            metadataResult.message || "Failed to create course metadata"
          );
        }

        const courseId = metadataResult.data?.courseId;
        if (!courseId) {
          throw new Error("Course ID not returned from metadata creation");
        }

        // Step 2: Add modules one by one
        if (modules && Array.isArray(modules) && modules.length > 0) {
          for (const courseModule of modules) {
            const { lessons, ...moduleData } = courseModule;

            // Add module without lessons first
            const moduleResult = await addCourseModules(courseId, [moduleData]);
            if (!moduleResult.success) {
              throw new Error(
                `Failed to add module: ${courseModule.title || "Untitled"}`
              );
            }

            const moduleIds = moduleResult.data?.moduleIds;
            if (!moduleIds || moduleIds.length === 0) {
              throw new Error("Module ID not returned from module creation");
            }

            const moduleId = moduleIds[0];

            // Step 3: Add lessons in batches (5-10 at a time)
            if (lessons && Array.isArray(lessons) && lessons.length > 0) {
              const BATCH_SIZE = 5; // Process 5 lessons at a time

              for (let i = 0; i < lessons.length; i += BATCH_SIZE) {
                const lessonBatch = lessons.slice(i, i + BATCH_SIZE);

                const lessonResult = await addCourseLessons(
                  courseId,
                  moduleId,
                  lessonBatch
                );
                if (!lessonResult.success) {
                  throw new Error(
                    `Failed to add lesson batch ${
                      Math.floor(i / BATCH_SIZE) + 1
                    }`
                  );
                }
              }
            }
          }
        }

        // Step 4: Finalize course creation
        const finalResult = await finalizeCourseCreation(courseId);
        if (!finalResult.success) {
          throw new Error("Failed to finalize course creation");
        }

        return finalResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create course with chunked approach";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to create course with chunked approach",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [
      baseUrl,
      createCourseMetadata,
      addCourseModules,
      addCourseLessons,
      finalizeCourseCreation,
    ]
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
    // Chunked course creation methods
    createCourseChunked,
    createCourseMetadata,
    addCourseModules,
    addCourseLessons,
    finalizeCourseCreation,
  };
};
