import { useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { InternshipResponse } from "@/types/internship";

export interface ListInternshipsAdminResult {
  internships: InternshipResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export const useInternshipAdmin = () => {
  const listAdmin = useCallback(
    async (params: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: boolean;
      audience?: "college-students" | "professionals";
      featured?: boolean;
    }): Promise<ListInternshipsAdminResult | null> => {
      try {
        const q = new URLSearchParams();
        if (params.page) q.append("page", String(params.page));
        if (params.limit) q.append("limit", String(params.limit));
        if (params.search?.trim()) q.append("search", params.search.trim());
        if (params.isActive !== undefined) {
          q.append("isActive", String(params.isActive));
        }
        if (params.audience) q.append("audience", params.audience);
        if (params.featured !== undefined) {
          q.append("featured", String(params.featured));
        }

        const response = await apiClient.get(
          `${ENDPOINTS.internships.admin.all}?${q.toString()}`
        );
        return (response.data?.data ?? null) as ListInternshipsAdminResult | null;
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    []
  );

  const deleteInternship = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`${ENDPOINTS.internships.base}/${id}`);
      return true;
    } catch {
      return false;
    }
  }, []);

  const updateMetadata = useCallback(
    async (
      id: string,
      body: Partial<{ isActive: boolean; featured: boolean }>
    ): Promise<InternshipResponse | null> => {
      try {
        const response = await apiClient.put(
          `${ENDPOINTS.internships.base}/${id}/metadata`,
          body
        );
        const data = response.data?.data;
        return data ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  return { listAdmin, deleteInternship, updateMetadata };
};
