import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import type {
  CreatePartnershipImportConfigData,
  PartnershipImportConfig,
  PartnershipImportConfigListResponse,
  PartnershipWhitelistEntry,
  PartnershipWhitelistListResponse,
  UpdatePartnershipImportConfigData,
  CollaborationWhitelistStatus,
} from "@/types/partnershipImportConfig";

export const usePartnershipImportConfig = () => {
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
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ||
          (err as Error)?.message ||
          errorMessage;
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const listConfigs = useCallback(
    async (params: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: boolean;
    }): Promise<PartnershipImportConfigListResponse | null> => {
      return handleRequest(async () => {
        const q = new URLSearchParams();
        if (params.page) q.set("page", String(params.page));
        if (params.limit) q.set("limit", String(params.limit));
        if (params.search) q.set("search", params.search);
        if (params.isActive !== undefined)
          q.set("isActive", String(params.isActive));
        const response = await apiClient.get(
          `/partnership-import-configs?${q.toString()}`
        );
        return response.data.data as PartnershipImportConfigListResponse;
      }, "Failed to load partnership import configs");
    },
    [handleRequest]
  );

  const getConfigById = useCallback(
    async (id: string): Promise<PartnershipImportConfig | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(
          `/partnership-import-configs/${id}`
        );
        return response.data.data as PartnershipImportConfig;
      }, "Failed to load config");
    },
    [handleRequest]
  );

  const createConfig = useCallback(
    async (
      data: CreatePartnershipImportConfigData
    ): Promise<PartnershipImportConfig | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          "/partnership-import-configs",
          data
        );
        return response.data.data as PartnershipImportConfig;
      }, "Failed to create config");
    },
    [handleRequest]
  );

  const updateConfig = useCallback(
    async (
      id: string,
      data: UpdatePartnershipImportConfigData
    ): Promise<PartnershipImportConfig | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(
          `/partnership-import-configs/${id}`,
          data
        );
        return response.data.data as PartnershipImportConfig;
      }, "Failed to update config");
    },
    [handleRequest]
  );

  const deleteConfig = useCallback(
    async (id: string): Promise<boolean | null> => {
      return handleRequest(async () => {
        await apiClient.delete(`/partnership-import-configs/${id}`);
        return true;
      }, "Failed to delete config");
    },
    [handleRequest]
  );

  const getWhitelistStats = useCallback(
    async (
      configId: string,
      options?: { silent?: boolean }
    ): Promise<Record<string, number> | null> => {
      const fetchStats = async () => {
        const response = await apiClient.get(
          `/partnership-import-configs/${configId}/whitelist/stats`
        );
        return response.data.data as Record<string, number>;
      };
      if (options?.silent) {
        try {
          return await fetchStats();
        } catch {
          return null;
        }
      }
      return handleRequest(fetchStats, "Failed to load whitelist stats");
    },
    [handleRequest]
  );

  const listWhitelist = useCallback(
    async (
      configId: string,
      params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: CollaborationWhitelistStatus;
      }
    ): Promise<PartnershipWhitelistListResponse | null> => {
      return handleRequest(async () => {
        const q = new URLSearchParams();
        if (params.page) q.set("page", String(params.page));
        if (params.limit) q.set("limit", String(params.limit));
        if (params.search) q.set("search", params.search);
        if (params.status) q.set("status", params.status);
        const response = await apiClient.get(
          `/partnership-import-configs/${configId}/whitelist?${q.toString()}`
        );
        return response.data.data as PartnershipWhitelistListResponse;
      }, "Failed to load whitelist");
    },
    [handleRequest]
  );

  const importWhitelist = useCallback(
    async (
      configId: string,
      body: {
        mode: "append" | "replace";
        rows: { email: string; studentName?: string; studentId?: string }[];
      }
    ): Promise<{ inserted: number; updated: number; expired: number } | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          `/partnership-import-configs/${configId}/whitelist/import`,
          body
        );
        return response.data.data as {
          inserted: number;
          updated: number;
          expired: number;
        };
      }, "Failed to import whitelist");
    },
    [handleRequest]
  );

  const deleteWhitelistEntry = useCallback(
    async (configId: string, entryId: string): Promise<boolean | null> => {
      return handleRequest(async () => {
        await apiClient.delete(
          `/partnership-import-configs/${configId}/whitelist/${entryId}`
        );
        return true;
      }, "Failed to delete entry");
    },
    [handleRequest]
  );

  const retryWhitelistEntry = useCallback(
    async (
      configId: string,
      entryId: string
    ): Promise<PartnershipWhitelistEntry | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          `/partnership-import-configs/${configId}/whitelist/${entryId}/retry`
        );
        return response.data.data as PartnershipWhitelistEntry;
      }, "Failed to retry entry");
    },
    [handleRequest]
  );

  return {
    isLoading,
    error,
    clearError,
    listConfigs,
    getConfigById,
    createConfig,
    updateConfig,
    deleteConfig,
    getWhitelistStats,
    listWhitelist,
    importWhitelist,
    deleteWhitelistEntry,
    retryWhitelistEntry,
  };
};
