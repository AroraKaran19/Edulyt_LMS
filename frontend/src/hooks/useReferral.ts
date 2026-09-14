"use client";

import { useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  AdminReferralWithdrawalRow,
  PaginatedReferral,
  ReferralCodeValidationResult,
  ReferralCommissionTier,
  ReferralOverview,
  ReferralRecentSaleRow,
  ReferralWithdrawalRow,
  ReferralWithdrawalStatus,
} from "@/types/referral";
import type { Brand } from "@/constants/brands";

interface ApiSuccessBody<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Thin client for the referral module. */
export default function useReferral() {
  const getOverview = useCallback(async (): Promise<ReferralOverview> => {
    const res = await apiClient.get<ApiSuccessBody<ReferralOverview>>(
      ENDPOINTS.referral.me,
    );
    return res.data.data;
  }, []);

  const setUpi = useCallback(async (upiId: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.referral.meUpi, { upiId });
  }, []);

  const validateCode = useCallback(
    async (code: string): Promise<ReferralCodeValidationResult> => {
      const res = await apiClient.post<
        ApiSuccessBody<ReferralCodeValidationResult>
      >(ENDPOINTS.referral.validateCode, { code });
      return res.data.data;
    },
    [],
  );

  const listSales = useCallback(
    async (
      page: number,
      limit: number,
    ): Promise<PaginatedReferral<ReferralRecentSaleRow>> => {
      const res = await apiClient.get<
        ApiSuccessBody<PaginatedReferral<ReferralRecentSaleRow>>
      >(ENDPOINTS.referral.meSales, { params: { page, limit } });
      return res.data.data;
    },
    [],
  );

  const requestWithdrawal = useCallback(
    async (amount: number): Promise<ReferralWithdrawalRow> => {
      const res = await apiClient.post<ApiSuccessBody<ReferralWithdrawalRow>>(
        ENDPOINTS.referral.meWithdrawals,
        { amount },
      );
      return res.data.data;
    },
    [],
  );

  const listWithdrawals = useCallback(
    async (
      page: number,
      limit: number,
    ): Promise<PaginatedReferral<ReferralWithdrawalRow>> => {
      const res = await apiClient.get<
        ApiSuccessBody<PaginatedReferral<ReferralWithdrawalRow>>
      >(ENDPOINTS.referral.meWithdrawalsList, { params: { page, limit } });
      return res.data.data;
    },
    [],
  );

  // ── Admin ─────────────────────────────────────────────────────────────────

  const adminGetConfig = useCallback(async (): Promise<{
    tiers: ReferralCommissionTier[];
    buyerDiscountPercent: number;
    updatedAt: string | null;
  }> => {
    const res = await apiClient.get<
      ApiSuccessBody<{
        tiers: ReferralCommissionTier[];
        buyerDiscountPercent: number;
        updatedAt: string | null;
      }>
    >(ENDPOINTS.referral.adminConfig);
    return res.data.data;
  }, []);

  const adminPutConfig = useCallback(
    async (
      tiers: ReferralCommissionTier[],
      buyerDiscountPercent: number,
    ): Promise<void> => {
      await apiClient.put(ENDPOINTS.referral.adminConfig, {
        tiers,
        buyerDiscountPercent,
      });
    },
    [],
  );

  const adminListWithdrawals = useCallback(
    async (opts: {
      status?: ReferralWithdrawalStatus;
      q?: string;
      brand?: Brand;
      page: number;
      limit: number;
    }): Promise<PaginatedReferral<AdminReferralWithdrawalRow>> => {
      const params: Record<string, string | number> = {
        page: opts.page,
        limit: opts.limit,
      };
      if (opts.status) params.status = opts.status;
      if (opts.q?.trim()) params.q = opts.q.trim();
      if (opts.brand) params.brand = opts.brand;
      const res = await apiClient.get<
        ApiSuccessBody<PaginatedReferral<AdminReferralWithdrawalRow>>
      >(ENDPOINTS.referral.adminWithdrawals, { params });
      return res.data.data;
    },
    [],
  );

  const adminTransitionWithdrawal = useCallback(
    async (
      id: string,
      status: ReferralWithdrawalStatus,
      notes?: string,
    ): Promise<AdminReferralWithdrawalRow> => {
      const res = await apiClient.patch<
        ApiSuccessBody<AdminReferralWithdrawalRow>
      >(ENDPOINTS.referral.adminWithdrawalStatus(id), { status, notes });
      return res.data.data;
    },
    [],
  );

  return {
    getOverview,
    setUpi,
    validateCode,
    listSales,
    requestWithdrawal,
    listWithdrawals,
    adminGetConfig,
    adminPutConfig,
    adminListWithdrawals,
    adminTransitionWithdrawal,
  };
}
