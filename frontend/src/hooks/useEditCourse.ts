import { useState, useCallback } from "react";

export interface EditCourseResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export const useEditCourse = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Update course metadata
  const updateCourseMetadata = useCallback(
    async (courseId: string, courseData: any): Promise<EditCourseResponse> => {
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

  // Add a single module to course (real-time)
  const addSingleCourseModule = useCallback(
    async (courseId: string, moduleData: any): Promise<EditCourseResponse> => {
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
        return {
          success: false,
          message: "Failed to add module",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Update a single module in course (real-time)
  const updateSingleCourseModule = useCallback(
    async (courseId: string, moduleId: string, moduleData: any): Promise<EditCourseResponse> => {
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
        return {
          success: false,
          message: "Failed to update module",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Delete a single module from course (real-time)
  const deleteSingleCourseModule = useCallback(
    async (courseId: string, moduleId: string): Promise<EditCourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to delete module");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete module";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to delete module",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Add a single lesson to module (real-time)
  const addSingleCourseLesson = useCallback(
    async (courseId: string, moduleId: string, lessonData: any): Promise<EditCourseResponse> => {
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
        return {
          success: false,
          message: "Failed to add lesson",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Update a single lesson in module (real-time)
  const updateSingleCourseLesson = useCallback(
    async (courseId: string, moduleId: string, lessonId: string, lessonData: any): Promise<EditCourseResponse> => {
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
        return {
          success: false,
          message: "Failed to update lesson",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Delete a single lesson from module (real-time)
  const deleteSingleCourseLesson = useCallback(
    async (courseId: string, moduleId: string, lessonId: string): Promise<EditCourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to delete lesson");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete lesson";
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
    [baseUrl]
  );

  // Add a single content to lesson (real-time)
  const addSingleCourseContent = useCallback(
    async (courseId: string, moduleId: string, lessonId: string, contentData: any): Promise<EditCourseResponse> => {
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
        return {
          success: false,
          message: "Failed to add content",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Update a single content in lesson (real-time)
  const updateSingleCourseContent = useCallback(
    async (courseId: string, moduleId: string, lessonId: string, contentId: string, contentData: any): Promise<EditCourseResponse> => {
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
        return {
          success: false,
          message: "Failed to update content",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Delete a single content from lesson (real-time)
  const deleteSingleCourseContent = useCallback(
    async (courseId: string, moduleId: string, lessonId: string, contentId: string): Promise<EditCourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents/${contentId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to delete content");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete content";
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
    [baseUrl]
  );

  // Finalize course editing
  const finalizeCourseEditing = useCallback(
    async (courseId: string): Promise<EditCourseResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/finalize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to finalize course editing";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to finalize course editing",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  return {
    isLoading,
    error,
    updateCourseMetadata,
    addSingleCourseModule,
    updateSingleCourseModule,
    deleteSingleCourseModule,
    addSingleCourseLesson,
    updateSingleCourseLesson,
    deleteSingleCourseLesson,
    addSingleCourseContent,
    updateSingleCourseContent,
    deleteSingleCourseContent,
    finalizeCourseEditing,
  };
};
