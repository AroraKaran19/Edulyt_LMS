import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

export interface QuestionCategoryRow {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionCategoryListResponse {
  categories: QuestionCategoryRow[];
  total: number;
  page: number;
  totalPages: number;
}

export function useQuestionCategory() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleRequest = useCallback(
    async <T>(requestFn: () => Promise<T>, fallbackMsg: string): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await requestFn();
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ??
          (err as Error)?.message ??
          fallbackMsg;
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const listQuestionCategories = useCallback(
    async (opts: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: boolean;
    } = {}): Promise<QuestionCategoryListResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (opts.page) params.append("page", String(opts.page));
        if (opts.limit) params.append("limit", String(opts.limit));
        if (opts.search) params.append("search", opts.search);
        if (opts.isActive !== undefined)
          params.append("isActive", String(opts.isActive));
        const res = await apiClient.get(
          `${ENDPOINTS.questionCategories.list}?${params.toString()}`,
        );
        return res.data?.data as QuestionCategoryListResponse;
      }, "Failed to fetch question categories");
    },
    [handleRequest],
  );

  const getActiveQuestionCategories = useCallback(
    async (opts: { page?: number; limit?: number; search?: string } = {}) =>
      listQuestionCategories({ ...opts, isActive: true }),
    [listQuestionCategories],
  );

  const getQuestionCategoryById = useCallback(
    async (id: string): Promise<QuestionCategoryRow | null> => {
      return handleRequest(async () => {
        const res = await apiClient.get(ENDPOINTS.questionCategories.byId(id));
        return res.data?.data as QuestionCategoryRow;
      }, "Failed to fetch question category");
    },
    [handleRequest],
  );

  const createQuestionCategory = useCallback(
    async (name: string): Promise<QuestionCategoryRow | null> => {
      return handleRequest(async () => {
        const res = await apiClient.post(ENDPOINTS.questionCategories.create, {
          name,
        });
        return res.data?.data as QuestionCategoryRow;
      }, "Failed to create question category");
    },
    [handleRequest],
  );

  const updateQuestionCategory = useCallback(
    async (
      id: string,
      updates: { name?: string; isActive?: boolean },
    ): Promise<QuestionCategoryRow | null> => {
      return handleRequest(async () => {
        const res = await apiClient.patch(
          ENDPOINTS.questionCategories.update(id),
          updates,
        );
        return res.data?.data as QuestionCategoryRow;
      }, "Failed to update question category");
    },
    [handleRequest],
  );

  const deleteQuestionCategory = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await handleRequest(async () => {
        await apiClient.delete(ENDPOINTS.questionCategories.delete(id));
        return true;
      }, "Failed to delete question category");
      return result === true;
    },
    [handleRequest],
  );

  return {
    isLoading,
    error,
    clearError,
    listQuestionCategories,
    getActiveQuestionCategories,
    getQuestionCategoryById,
    createQuestionCategory,
    updateQuestionCategory,
    deleteQuestionCategory,
  };
}
