import { useCallback, useState } from "react";
import apiClient from "@/configs/apiConfig";

export interface College {
  _id: string;
  name: string;
  location: string;
  website?: string;
  image?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListCollegesResult {
  colleges: College[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateCollegePayload {
  name: string;
  location: string;
  website?: string;
  image?: string;
  isActive?: boolean;
}

const useColleges = () => {
  const [isLoading, setIsLoading] = useState(false);

  const listCollegesAdmin = useCallback(
    async (params: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: "true" | "false" | "all";
    }): Promise<ListCollegesResult | null> => {
      setIsLoading(true);
      try {
        const q = new URLSearchParams();
        if (params.page) q.append("page", String(params.page));
        if (params.limit) q.append("limit", String(params.limit));
        if (params.search) q.append("search", params.search);
        if (params.isActive && params.isActive !== "all") {
          q.append("isActive", params.isActive);
        }
        const res = await apiClient.get(`/colleges/admin?${q.toString()}`);
        return res.data.data as ListCollegesResult;
      } catch (e) {
        console.error(e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createCollege = useCallback(
    async (payload: CreateCollegePayload): Promise<College | null> => {
      setIsLoading(true);
      try {
        const res = await apiClient.post("/colleges/admin", payload);
        return res.data.data as College;
      } catch (e) {
        console.error(e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateCollege = useCallback(
    async (
      id: string,
      payload: Partial<CreateCollegePayload>
    ): Promise<College | null> => {
      setIsLoading(true);
      try {
        const res = await apiClient.put(`/colleges/admin/${id}`, payload);
        return res.data.data as College;
      } catch (e) {
        console.error(e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteCollege = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/colleges/admin/${id}`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    listCollegesAdmin,
    createCollege,
    updateCollege,
    deleteCollege,
  };
};

export default useColleges;
