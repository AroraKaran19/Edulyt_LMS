import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { toast } from "react-toastify";

export interface AuthenticationMedia {
  _id: string;
  imageUrl: string;
  order: number;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticationMediaResponse {
  media: AuthenticationMedia[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateAuthenticationMediaData {
  imageUrl: string;
  order: number;
  link?: string;
}

export interface UpdateAuthenticationMediaData {
  imageUrl?: string;
  order?: number;
  link?: string;
}

export const useAuthenticationMedia = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      errorMessage: string
    ): Promise<T | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await requestFn();
        return response;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          errorMessage;
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get all authentication media
  const getAllAuthenticationMedia = useCallback(
    async (
      page: number = 1,
      limit: number = 100
    ): Promise<AuthenticationMediaResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        const response = await apiClient.get(
          `/authentication-media?${params.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch authentication media");
    },
    [handleRequest]
  );

  // Get authentication media by ID
  const getAuthenticationMediaById = useCallback(
    async (id: string): Promise<AuthenticationMedia | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/authentication-media/${id}`);
        return response.data.data;
      }, "Failed to fetch authentication media");
    },
    [handleRequest]
  );

  // Create authentication media
  const createAuthenticationMedia = useCallback(
    async (
      data: CreateAuthenticationMediaData
    ): Promise<AuthenticationMedia | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post("/authentication-media", data);
        toast.success("Authentication media created successfully");
        return response.data.data;
      }, "Failed to create authentication media");
    },
    [handleRequest]
  );

  // Update authentication media
  const updateAuthenticationMedia = useCallback(
    async (
      id: string,
      data: UpdateAuthenticationMediaData
    ): Promise<AuthenticationMedia | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(`/authentication-media/${id}`, data);
        toast.success("Authentication media updated successfully");
        return response.data.data;
      }, "Failed to update authentication media");
    },
    [handleRequest]
  );

  // Delete authentication media
  const deleteAuthenticationMedia = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await handleRequest(async () => {
        await apiClient.delete(`/authentication-media/${id}`);
        toast.success("Authentication media deleted successfully");
        return true;
      }, "Failed to delete authentication media");
      return result ?? false;
    },
    [handleRequest]
  );

  // Reorder authentication media
  const reorderAuthenticationMedia = useCallback(
    async (mediaIds: string[]): Promise<AuthenticationMedia[] | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          "/authentication-media/reorder",
          { mediaIds }
        );
        toast.success("Authentication media reordered successfully");
        return response.data.data;
      }, "Failed to reorder authentication media");
    },
    [handleRequest]
  );

  return {
    isLoading,
    error,
    getAllAuthenticationMedia,
    getAuthenticationMediaById,
    createAuthenticationMedia,
    updateAuthenticationMedia,
    deleteAuthenticationMedia,
    reorderAuthenticationMedia,
  };
};

