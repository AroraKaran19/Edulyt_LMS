import { useState, useCallback } from "react";
import { Testimonial } from "@/types";

export interface TestimonialResponse {
  success: boolean;
  data?: Testimonial & { _id: string };
  message?: string;
  error?: string;
  errors?: string[];
}

export interface TestimonialListResponse {
  success: boolean;
  data?: {
    testimonials: (Testimonial & { _id: string })[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message?: string;
  error?: string;
}

export interface TestimonialsArrayResponse {
  success: boolean;
  data?: (Testimonial & { _id: string })[];
  message?: string;
  error?: string;
}

export const useTestimonial = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  /**
   * Get all testimonials with pagination and search
   */
  const getAllTestimonials = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      search: string = ""
    ): Promise<TestimonialListResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (search.trim()) {
          params.append("search", search.trim());
        }

        const response = await fetch(`${baseUrl}/testimonials?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: TestimonialListResponse = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to fetch testimonials");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch testimonials";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch testimonials",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Create a new testimonial
   */
  const createTestimonial = useCallback(
    async (testimonialData: {
      name: string;
      currentRole: string;
      currentCompany: string;
      linkedin: string;
      pastRole: string;
      pastCompany: string;
      college: string;
      profileImage: string;
      verified?: boolean;
    }): Promise<TestimonialResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/testimonials`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testimonialData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const result: TestimonialResponse = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to create testimonial");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create testimonial";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to create testimonial",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Update an existing testimonial
   */
  const updateTestimonial = useCallback(
    async (
      id: string,
      updateData: Partial<Testimonial>
    ): Promise<TestimonialResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/testimonials/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const result: TestimonialResponse = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to update testimonial");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update testimonial";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to update testimonial",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Delete a testimonial
   */
  const deleteTestimonial = useCallback(
    async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/testimonials/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to delete testimonial");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete testimonial";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to delete testimonial",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Get testimonial by ID
   */
  const getTestimonialById = useCallback(
    async (id: string): Promise<TestimonialResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/testimonials/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: TestimonialResponse = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to fetch testimonial");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch testimonial";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch testimonial",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Get testimonials by array of IDs
   */
  const getTestimonialsByIds = useCallback(
    async (ids: string[]): Promise<TestimonialsArrayResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/testimonials/by-ids`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: TestimonialsArrayResponse = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to fetch testimonials");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch testimonials";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch testimonials",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Fetch testimonials with simplified return for UI components
   * (matches the previous service function signature)
   */
  const fetchTestimonials = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      search: string = ""
    ): Promise<{ testimonials: (Testimonial & { _id: string })[]; total: number }> => {
      const result = await getAllTestimonials(page, limit, search);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch testimonials");
      }

      return {
        testimonials: result.data.testimonials,
        total: result.data.pagination.totalItems,
      };
    },
    [getAllTestimonials]
  );

  /**
   * Create testimonial with simplified return for UI components
   * (matches the previous service function signature)
   */
  const createTestimonialSimple = useCallback(
    async (testimonialData: {
      name: string;
      currentRole: string;
      currentCompany: string;
      linkedin: string;
      pastRole: string;
      pastCompany: string;
      college: string;
      profileImage: string;
      verified?: boolean;
    }): Promise<Testimonial & { _id: string }> => {
      const result = await createTestimonial(testimonialData);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create testimonial");
      }

      return result.data;
    },
    [createTestimonial]
  );

  return {
    // State
    isLoading,
    error,

    // Full API methods (with full response objects)
    getAllTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    getTestimonialById,
    getTestimonialsByIds,

    // Simplified methods (for backward compatibility with existing components)
    fetchTestimonials,
    createTestimonialSimple,

    // Utility
    clearError: () => setError(""),
  };
};
