import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import {
  Coupon,
  CreateCouponData,
  UpdateCouponData,
  ValidateCouponRequest,
  ValidateCouponResponse,
} from "@/types/coupon";

export interface CouponResponse {
  coupons: Coupon[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CouponFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const useCoupon = () => {
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

  // Get all coupons (admin only)
  const getCoupons = useCallback(
    async (filters: CouponFilters = {}): Promise<CouponResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.isActive !== undefined)
          params.append("isActive", filters.isActive.toString());

        const response = await apiClient.get(`/coupons?${params.toString()}`);
        return response.data.data;
      }, "Failed to fetch coupons");
    },
    [handleRequest]
  );

  // Get coupon by ID
  const getCouponById = useCallback(
    async (couponId: string): Promise<Coupon | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/coupons/${couponId}`);
        return response.data.data;
      }, "Failed to fetch coupon");
    },
    [handleRequest]
  );

  // Get coupon by code
  const getCouponByCode = useCallback(
    async (code: string): Promise<Coupon | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/coupons/code/${code}`);
        return response.data.data;
      }, "Failed to fetch coupon");
    },
    [handleRequest]
  );

  // Create coupon
  const createCoupon = useCallback(
    async (couponData: CreateCouponData): Promise<Coupon | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post("/coupons", couponData);
        return response.data.data;
      }, "Failed to create coupon");
    },
    [handleRequest]
  );

  // Update coupon
  const updateCoupon = useCallback(
    async (
      couponId: string,
      couponData: UpdateCouponData
    ): Promise<Coupon | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(
          `/coupons/${couponId}`,
          couponData
        );
        return response.data.data;
      }, "Failed to update coupon");
    },
    [handleRequest]
  );

  // Delete coupon
  const deleteCoupon = useCallback(
    async (couponId: string): Promise<boolean | null> => {
      return handleRequest(async () => {
        await apiClient.delete(`/coupons/${couponId}`);
        return true;
      }, "Failed to delete coupon");
    },
    [handleRequest]
  );

  // Validate coupon
  const validateCoupon = useCallback(
    async (
      request: ValidateCouponRequest
    ): Promise<ValidateCouponResponse | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post("/coupons/validate", request);
        return response.data.data;
      }, "Failed to validate coupon");
    },
    [handleRequest]
  );

  return {
    getCoupons,
    getCouponById,
    getCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    isLoading,
    error,
    clearError,
  };
};
