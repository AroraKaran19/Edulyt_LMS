import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { toast } from "react-toastify";

// Types for FAQ responses
export interface FAQ {
  _id?: string;
  question: string;
  answer: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

export interface FAQResponse {
  success: boolean;
  message: string;
  data?:
    | FAQ
    | FAQ[]
    | { faqs: FAQ[]; total: number; page: number; totalPages: number };
  error?: string;
}

export interface FAQListResponse {
  faqs: FAQ[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FAQFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export const useFAQ = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Get all FAQs with pagination and search
  const getFAQs = useCallback(
    async (filters: FAQFilters = {}): Promise<FAQListResponse | null> => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);

        const response = await apiClient.get(`/faq?${params.toString()}`);

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch FAQs"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to fetch FAQs";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get FAQ by ID
  const getFAQById = useCallback(async (id: string): Promise<FAQ | null> => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.get(`/faq/${id}`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || "Failed to fetch FAQ");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to fetch FAQ";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new FAQ (Admin only)
  const createFAQ = useCallback(
    async (faqData: {
      question: string;
      answer: string;
    }): Promise<FAQ | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.post("/faq", faqData);

        if (response.data.success) {
          toast.success("FAQ created successfully");
          return response.data.data;
        } else {
          toast.error(response.data.error?.message || "Failed to create FAQ");
          throw new Error(
            response.data.error?.message || "Failed to create FAQ"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to create FAQ";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update FAQ (Admin only)
  const updateFAQ = useCallback(
    async (
      id: string,
      faqData: { question?: string; answer?: string }
    ): Promise<FAQ | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(`/faq/${id}`, faqData);

        if (response.data.success) {
          toast.success("FAQ updated successfully");
          return response.data.data;
        } else {
          toast.error(response.data.error?.message || "Failed to update FAQ");
          throw new Error(
            response.data.error?.message || "Failed to update FAQ"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to update FAQ";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Delete FAQ (Admin only)
  const deleteFAQ = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.delete(`/faq/${id}`);

      if (response.data.success) {
        toast.success("FAQ deleted successfully");
        return true;
      } else {
        toast.error(response.data.error?.message || "Failed to delete FAQ");
        throw new Error(response.data.error?.message || "Failed to delete FAQ");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to delete FAQ";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Admin-specific methods
  const getAdminFAQs = useCallback(
    async (filters: FAQFilters = {}): Promise<FAQListResponse | null> => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);

        const response = await apiClient.get(`/faq/admin?${params.toString()}`);

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch admin FAQs"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to fetch admin FAQs";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getAdminFAQById = useCallback(
    async (id: string): Promise<FAQ | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/faq/admin/${id}`);

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch admin FAQ"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to fetch admin FAQ";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateAdminFAQ = useCallback(
    async (
      id: string,
      faqData: { question?: string; answer?: string }
    ): Promise<FAQ | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(`/faq/admin/${id}`, faqData);

        if (response.data.success) {
          toast.success("FAQ updated successfully");
          return response.data.data;
        } else {
          toast.error(
            response.data.error?.message || "Failed to update admin FAQ"
          );
          throw new Error(
            response.data.error?.message || "Failed to update admin FAQ"
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to update admin FAQ";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteAdminFAQ = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.delete(`/faq/admin/${id}`);

      if (response.data.success) {
        toast.success("FAQ deleted successfully");
        return true;
      } else {
        toast.error(
          response.data.error?.message || "Failed to delete admin FAQ"
        );
        throw new Error(
          response.data.error?.message || "Failed to delete admin FAQ"
        );
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to delete admin FAQ";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Utility functions
  const searchFAQs = useCallback(
    async (
      searchTerm: string,
      page: number = 1,
      limit: number = 10
    ): Promise<FAQListResponse | null> => {
      return getFAQs({ search: searchTerm, page, limit });
    },
    [getFAQs]
  );

  const getFAQsByPage = useCallback(
    async (
      page: number,
      limit: number = 10
    ): Promise<FAQListResponse | null> => {
      return getFAQs({ page, limit });
    },
    [getFAQs]
  );

  // Validation utilities
  const validateFAQ = useCallback(
    (faqData: {
      question?: string;
      answer?: string;
    }): { valid: boolean; error?: string } => {
      if (!faqData.question || faqData.question.trim().length === 0) {
        return {
          valid: false,
          error: "Question is required and cannot be empty",
        };
      }

      if (!faqData.answer || faqData.answer.trim().length === 0) {
        return {
          valid: false,
          error: "Answer is required and cannot be empty",
        };
      }

      if (faqData.question.length < 10) {
        return {
          valid: false,
          error: "Question must be at least 10 characters long",
        };
      }

      if (faqData.answer.length < 20) {
        return {
          valid: false,
          error: "Answer must be at least 20 characters long",
        };
      }

      if (faqData.question.length > 500) {
        return {
          valid: false,
          error: "Question must be less than 500 characters",
        };
      }

      if (faqData.answer.length > 2000) {
        return {
          valid: false,
          error: "Answer must be less than 2000 characters",
        };
      }

      return { valid: true };
    },
    []
  );

  return {
    // State
    isLoading,
    error,

    // Public methods
    getFAQs,
    getFAQById,
    searchFAQs,
    getFAQsByPage,

    // Admin methods
    createFAQ,
    updateFAQ,
    deleteFAQ,
    getAdminFAQs,
    getAdminFAQById,
    updateAdminFAQ,
    deleteAdminFAQ,

    // Utilities
    validateFAQ,

    // Reset error
    clearError: () => setError(""),
  };
};
