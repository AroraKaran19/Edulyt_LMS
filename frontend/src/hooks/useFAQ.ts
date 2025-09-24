import { useState, useCallback } from "react";
import { FAQ } from "@/types";

export interface FAQResponse {
  success: boolean;
  data?: FAQ & { _id: string };
  message?: string;
  error?: string;
  errors?: string[];
}

export interface FAQListResponse {
  success: boolean;
  data?: {
    faqs: (FAQ & { _id: string })[];
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

export interface FAQsArrayResponse {
  success: boolean;
  data?: (FAQ & { _id: string })[];
  message?: string;
  error?: string;
}

export const useFAQ = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  /**
   * Get all FAQs with pagination and search
   */
  const getAllFAQs = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      search: string = ""
    ): Promise<FAQListResponse> => {
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

        const response = await fetch(`${baseUrl}/faqs?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: FAQListResponse = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to fetch FAQs");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch FAQs";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch FAQs",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Create a new FAQ
   */
  const createFAQ = useCallback(
    async (faqData: {
      question: string;
      answer: string;
    }): Promise<FAQResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/faqs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(faqData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const result: FAQResponse = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to create FAQ");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create FAQ";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to create FAQ",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Update an existing FAQ
   */
  const updateFAQ = useCallback(
    async (
      id: string,
      updateData: {
        question?: string;
        answer?: string;
      }
    ): Promise<FAQResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/faqs/${id}`, {
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

        const result: FAQResponse = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to update FAQ");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update FAQ";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to update FAQ",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Delete an FAQ
   */
  const deleteFAQ = useCallback(
    async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/faqs/${id}`, {
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
          setError(result.error || result.message || "Failed to delete FAQ");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete FAQ";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to delete FAQ",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Get FAQ by ID
   */
  const getFAQById = useCallback(
    async (id: string): Promise<FAQResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/faqs/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: FAQResponse = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to fetch FAQ");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch FAQ";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch FAQ",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Get FAQs by array of IDs
   */
  const getFAQsByIds = useCallback(
    async (ids: string[]): Promise<FAQsArrayResponse> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${baseUrl}/faqs/by-ids`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: FAQsArrayResponse = await response.json();

        if (!result.success) {
          setError(result.error || result.message || "Failed to fetch FAQs");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch FAQs";
        setError(errorMessage);
        return {
          success: false,
          message: "Failed to fetch FAQs",
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  /**
   * Fetch FAQs with simplified return for UI components
   * (matches the previous service function signature)
   */
  const fetchFAQs = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      search: string = ""
    ): Promise<{ faqs: (FAQ & { _id: string })[]; total: number }> => {
      const result = await getAllFAQs(page, limit, search);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch FAQs");
      }

      return {
        faqs: result.data.faqs,
        total: result.data.pagination.totalItems,
      };
    },
    [getAllFAQs]
  );

  /**
   * Create FAQ with simplified return for UI components
   * (matches the previous service function signature)
   */
  const createFAQSimple = useCallback(
    async (faqData: {
      question: string;
      answer: string;
    }): Promise<FAQ & { _id: string }> => {
      const result = await createFAQ(faqData);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create FAQ");
      }

      return result.data;
    },
    [createFAQ]
  );

  return {
    // State
    isLoading,
    error,

    // Full API methods (with full response objects)
    getAllFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    getFAQById,
    getFAQsByIds,

    // Simplified methods (for backward compatibility with existing components)
    fetchFAQs,
    createFAQSimple,

    // Utility
    clearError: () => setError(""),
  };
};
