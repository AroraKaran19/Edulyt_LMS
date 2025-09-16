import { useState, useCallback } from "react";

// Types for API responses
export interface StepResponse {
  success: boolean;
  message: string;
  data?: {
    courseId?: string;
    updated?: boolean;
    step?: string;
  };
  error?: string;
}

export const useCourseSteps = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Step 1: Save basic course information
  const saveBasicInfo = useCallback(
    async (courseData: {
      title: string;
      description: string;
      shortDescription?: string;
      category: string;
      subcategory?: string;
      audience: string;
      language: string;
      duration: string;
      curriculum?: string;
      curriculumSource?: "upload" | "url";
      curriculumS3Key?: string;
    }): Promise<StepResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/step/basic-info`, {
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
          err instanceof Error ? err.message : "Failed to save basic information";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to save basic information",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Step 2: Save learning objectives
  const saveLearningObjectives = useCallback(
    async (courseId: string, courseData: {
      whatYouWillLearn: string;
      skills: string[];
      highlights: Array<{ title: string; description: string; }>;
      features?: string[];
    }): Promise<StepResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/step/${courseId}/learning-objectives`, {
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
          err instanceof Error ? err.message : "Failed to save learning objectives";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to save learning objectives",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Step 3: Save media (thumbnail and preview video)
  const saveMedia = useCallback(
    async (courseId: string, courseData: {
      thumbnail: string;
      thumbnailSource?: "upload" | "url";
      thumbnailS3Key?: string;
      previewVideoUrl?: string;
      previewVideoSource?: "upload" | "url";
      previewVideoS3Key?: string;
    }): Promise<StepResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/step/${courseId}/media`, {
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
          err instanceof Error ? err.message : "Failed to save media";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to save media",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Step 4: Save target audience and requirements
  const saveAudienceRequirements = useCallback(
    async (courseId: string, courseData: {
      skillLevel: string;
      whoShouldJoin: string;
      prerequisites?: string[];
      careerPaths: string[];
    }): Promise<StepResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/step/${courseId}/audience`, {
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
          err instanceof Error ? err.message : "Failed to save audience requirements";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to save audience requirements",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Step 5: Save pricing plans
  const savePricing = useCallback(
    async (courseId: string, courseData: {
      plans: {
        elite?: any;
        essential?: any;
      };
      discount?: any;
      scholarship?: boolean;
      scholarshipDescription?: string;
    }): Promise<StepResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/step/${courseId}/pricing`, {
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
          err instanceof Error ? err.message : "Failed to save pricing";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to save pricing",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Step 6: Save additional content (testimonials, FAQs)
  const saveAdditionalContent = useCallback(
    async (courseId: string, courseData: {
      testimonials?: any[];
      faqs: any[];
      prerequisites?: string[];
    }): Promise<StepResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/step/${courseId}/additional-content`, {
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
          err instanceof Error ? err.message : "Failed to save additional content";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to save additional content",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Step 7: Save course modules and lessons
  const saveCourseContent = useCallback(
    async (courseId: string, courseData: {
      modules: any[];
    }): Promise<StepResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/step/${courseId}/content`, {
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
          err instanceof Error ? err.message : "Failed to save course content";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to save course content",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Step 8: Finalize course (set as active and complete)
  const finalizeCourse = useCallback(
    async (courseId: string): Promise<StepResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/step/${courseId}/finalize`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: true }),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to finalize course";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to finalize course",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  // Get current course step data
  const getCourseStep = useCallback(
    async (courseId: string): Promise<StepResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/courses/step/${courseId}`, {
          method: "GET",
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
          err instanceof Error ? err.message : "Failed to get course data";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to get course data",
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
    
    // Step-by-step save functions
    saveBasicInfo,
    saveLearningObjectives,
    saveMedia,
    saveAudienceRequirements,
    savePricing,
    saveAdditionalContent,
    saveCourseContent,
    finalizeCourse,
    
    // Utility functions
    getCourseStep,
    clearError: () => setError(""),
  };
};
