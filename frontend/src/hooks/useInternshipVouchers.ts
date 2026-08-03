"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { toast } from "react-toastify";

export interface InternshipVoucher {
  _id: string;
  code: string;
  status: "available" | "redeemed" | "expired";
  issuedAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  redeemedInternshipEnrollmentId: string | null;
  /** Title of the course purchase that earned this voucher. */
  sourceCourseName?: string | null;
  /** Title of the internship the voucher was spent on (redeemed only). */
  redeemedInternshipTitle?: string | null;
}

interface VouchersResponse {
  available: number;
  vouchers: InternshipVoucher[];
}

export function useInternshipVouchers() {
  const [data, setData] = useState<VouchersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.internshipVouchers.me);
      setData(res.data?.data as VouchersResponse);
    } catch {
      // Non-critical; silently ignore.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const redeem = useCallback(
    async (params: {
      voucherIdOrCode: string;
      internshipId: string;
      batchId: string;
      applicationAnswers?: unknown;
    }): Promise<boolean> => {
      try {
        await apiClient.post(ENDPOINTS.internshipVouchers.redeem, {
          voucherIdOrCode: params.voucherIdOrCode,
          internshipId: params.internshipId,
          batchId: params.batchId,
          applicationAnswers: params.applicationAnswers,
        });
        toast.success("Voucher redeemed — you are now enrolled!");
        await fetch();
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to redeem voucher. Please try again.";
        toast.error(msg);
        return false;
      }
    },
    [fetch],
  );

  return {
    available: data?.available ?? 0,
    vouchers: data?.vouchers ?? [],
    isLoading,
    refetch: fetch,
    redeem,
  };
}
