import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import {
  CollaborationDomain,
  CollaborationDomainFilters,
  CollaborationDomainResponse,
  CreateCollaborationDomainData,
  UpdateCollaborationDomainData,
} from "@/types/collaborationDomain";

export const useCollaborationDomain = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      errorMessage: string
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await requestFn();
        return response;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error?.message || err?.message || errorMessage;
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get all collaboration domains (admin only)
  const getCollaborationDomains = useCallback(
    async (
      filters: CollaborationDomainFilters = {}
    ): Promise<CollaborationDomainResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.isActive !== undefined)
          params.append("isActive", filters.isActive.toString());

        const response = await apiClient.get(
          `/collaboration-domains?${params.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch collaboration domains");
    },
    [handleRequest]
  );

  // Get collaboration domain by ID
  const getCollaborationDomainById = useCallback(
    async (
      collaborationDomainId: string
    ): Promise<CollaborationDomain | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(
          `/collaboration-domains/${collaborationDomainId}`
        );
        return response.data.data;
      }, "Failed to fetch collaboration domain");
    },
    [handleRequest]
  );

  // Create collaboration domain
  const createCollaborationDomain = useCallback(
    async (
      collaborationData: CreateCollaborationDomainData
    ): Promise<CollaborationDomain | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          "/collaboration-domains",
          collaborationData
        );
        return response.data.data;
      }, "Failed to create collaboration domain");
    },
    [handleRequest]
  );

  // Update collaboration domain
  const updateCollaborationDomain = useCallback(
    async (
      collaborationDomainId: string,
      collaborationData: UpdateCollaborationDomainData
    ): Promise<CollaborationDomain | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(
          `/collaboration-domains/${collaborationDomainId}`,
          collaborationData
        );
        return response.data.data;
      }, "Failed to update collaboration domain");
    },
    [handleRequest]
  );

  // Delete collaboration domain
  const deleteCollaborationDomain = useCallback(
    async (collaborationDomainId: string): Promise<boolean | null> => {
      return handleRequest(async () => {
        await apiClient.delete(
          `/collaboration-domains/${collaborationDomainId}`
        );
        return true;
      }, "Failed to delete collaboration domain");
    },
    [handleRequest]
  );

  return {
    getCollaborationDomains,
    getCollaborationDomainById,
    createCollaborationDomain,
    updateCollaborationDomain,
    deleteCollaborationDomain,
    isLoading,
    error,
    clearError,
  };
};
