import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { toast } from "react-toastify";
import { PartnerCollege } from "@/types/partner-college";

export interface PartnerCollegeListResponse {
  partnerColleges: PartnerCollege[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PartnerCollegeFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export const usePartnerCollege = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const getPartnerColleges = useCallback(
    async (
      filters: PartnerCollegeFilters = {},
    ): Promise<PartnerCollegeListResponse | null> => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);

        const response = await apiClient.get(
          `/partner-colleges?${params.toString()}`,
        );

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch partner colleges",
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to fetch partner colleges";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getPartnerCollegeById = useCallback(
    async (id: string): Promise<PartnerCollege | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/partner-colleges/${id}`);

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(
            response.data.error?.message || "Failed to fetch partner college",
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to fetch partner college";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const createPartnerCollege = useCallback(
    async (
      partnerCollegeData: Omit<PartnerCollege, "_id">,
    ): Promise<PartnerCollege | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.post(
          "/partner-colleges",
          partnerCollegeData,
        );

        if (response.data.success) {
          toast.success("Partner college created successfully");
          return response.data.data;
        } else {
          toast.error(
            response.data.error?.message || "Failed to create partner college",
          );
          throw new Error(
            response.data.error?.message || "Failed to create partner college",
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to create partner college";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updatePartnerCollege = useCallback(
    async (
      id: string,
      partnerCollegeData: Partial<PartnerCollege>,
    ): Promise<PartnerCollege | null> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.put(
          `/partner-colleges/${id}`,
          partnerCollegeData,
        );

        if (response.data.success) {
          toast.success("Partner college updated successfully");
          return response.data.data;
        } else {
          toast.error(
            response.data.error?.message || "Failed to update partner college",
          );
          throw new Error(
            response.data.error?.message || "Failed to update partner college",
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to update partner college";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deletePartnerCollege = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiClient.delete(`/partner-colleges/${id}`);

        if (response.data.success) {
          toast.success("Partner college deleted successfully");
          return true;
        } else {
          toast.error(
            response.data.error?.message || "Failed to delete partner college",
          );
          throw new Error(
            response.data.error?.message || "Failed to delete partner college",
          );
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to delete partner college";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    isLoading,
    error,
    getPartnerColleges,
    getPartnerCollegeById,
    createPartnerCollege,
    updatePartnerCollege,
    deletePartnerCollege,
    clearError: () => setError(""),
  };
};
