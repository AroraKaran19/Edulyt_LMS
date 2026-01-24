import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { QnA, QnAReply } from "@/types/qna";

export interface GetQnAsParams {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: string;
  lessonId?: string;
  contentId?: string;
}

export interface GetQnAsResult {
  qnas: QnA[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateQnAData {
  courseId: string;
  lessonId: string;
  contentId: string;
  message: string;
}

export interface AddReplyData {
  message: string;
}

const useQnA = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      errorMessage: string
    ): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await requestFn();
        return result;
      } catch (err: any) {
        console.error(errorMessage, err);
        const errorMsg =
          err.response?.data?.message || err.message || errorMessage;
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get Q&As with filters
  const getQnAs = useCallback(
    async (params: GetQnAsParams = {}): Promise<GetQnAsResult | null> => {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.courseId) queryParams.append("courseId", params.courseId);
      if (params.lessonId) queryParams.append("lessonId", params.lessonId);
      if (params.contentId) queryParams.append("contentId", params.contentId);

      return handleRequest(async () => {
        const response = await apiClient.get(`/qna?${queryParams.toString()}`);
        const payload = response.data?.data;

        // Backend may return either:
        // 1) data: { qnas: [...], total, page, totalPages }
        // 2) data: [] (when no QnAs found)
        if (Array.isArray(payload)) {
          const page = params.page ?? 1;
          const limit = params.limit ?? payload.length;
          const total = payload.length;
          const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
          return {
            qnas: payload,
            total,
            page,
            totalPages,
          } as GetQnAsResult;
        }

        return payload as GetQnAsResult;
      }, "Failed to fetch Q&As");
    },
    [handleRequest]
  );

  // Get Q&A by ID
  const getQnAById = useCallback(
    async (id: string): Promise<QnA | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/qna/${id}`);
        return response.data.data;
      }, "Failed to fetch Q&A");
    },
    [handleRequest]
  );

  // Create Q&A
  const createQnA = useCallback(
    async (data: CreateQnAData): Promise<QnA | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post("/qna", data);
        return response.data.data;
      }, "Failed to create Q&A");
    },
    [handleRequest]
  );

  // Update Q&A
  const updateQnA = useCallback(
    async (id: string, data: { message: string }): Promise<QnA | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(`/qna/${id}`, data);
        return response.data.data;
      }, "Failed to update Q&A");
    },
    [handleRequest]
  );

  // Delete Q&A
  const deleteQnA = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await handleRequest(async () => {
        await apiClient.delete(`/qna/${id}`);
        return true;
      }, "Failed to delete Q&A");
      return result !== null;
    },
    [handleRequest]
  );

  // Add reply to Q&A
  const addReply = useCallback(
    async (qnaId: string, data: AddReplyData): Promise<QnA | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(`/qna/${qnaId}/reply`, data);
        return response.data.data;
      }, "Failed to add reply");
    },
    [handleRequest]
  );

  // Remove reply from Q&A
  const removeReply = useCallback(
    async (qnaId: string, replyId: string): Promise<boolean> => {
      const result = await handleRequest(async () => {
        await apiClient.delete(`/qna/${qnaId}/reply/${replyId}`);
        return true;
      }, "Failed to remove reply");
      return result !== null;
    },
    [handleRequest]
  );

  // Client-side validation
  const validateQnA = useCallback((data: CreateQnAData): string[] => {
    const errors: string[] = [];

    if (!data.courseId) {
      errors.push("Course ID is required");
    }

    if (!data.lessonId) {
      errors.push("Lesson ID is required");
    }

    if (!data.contentId) {
      errors.push("Content ID is required");
    }

    if (!data.message || data.message.trim().length === 0) {
      errors.push("Message is required");
    } else if (data.message.trim().length < 10) {
      errors.push("Message must be at least 10 characters long");
    } else if (data.message.trim().length > 1000) {
      errors.push("Message must be less than 1000 characters");
    }

    return errors;
  }, []);

  const validateReply = useCallback((data: AddReplyData): string[] => {
    const errors: string[] = [];

    if (!data.message || data.message.trim().length === 0) {
      errors.push("Reply message is required");
    } else if (data.message.trim().length < 5) {
      errors.push("Reply must be at least 5 characters long");
    } else if (data.message.trim().length > 500) {
      errors.push("Reply must be less than 500 characters");
    }

    return errors;
  }, []);

  return {
    // State
    isLoading,
    error,

    // Methods
    getQnAs,
    getQnAById,
    createQnA,
    updateQnA,
    deleteQnA,
    addReply,
    removeReply,

    // Validation
    validateQnA,
    validateReply,

    // Utilities
    clearError: () => setError(null),
  };
};

export default useQnA;
