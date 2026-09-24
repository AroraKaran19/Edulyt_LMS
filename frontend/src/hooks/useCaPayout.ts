import { useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { CaPayoutOtpSent, CaPayoutView } from "@/types/ca-payout";

type ApiError = {
  response?: {
    data?: {
      error?: { message?: string; code?: string; meta?: { lockedUntil?: string } };
      message?: string;
    };
  };
};

export interface CaPayoutFailure {
  ok: false;
  message: string;
  code: string | null;
  /** Only set for a 409 CA_PAYOUT_LOCKED refusal. */
  lockedUntil: string | null;
}

export type CaPayoutOutcome<T> = ({ ok: true } & T) | CaPayoutFailure;

const toFailure = (e: unknown, fallback: string): CaPayoutFailure => {
  const err = e as ApiError;
  const detail = err?.response?.data?.error;
  return {
    ok: false,
    message: detail?.message ?? err?.response?.data?.message ?? fallback,
    code: detail?.code ?? null,
    lockedUntil: detail?.meta?.lockedUntil ?? null,
  };
};

/** The signed-in CA's own payout details: read the masked value, and change it behind an OTP. */
export default function useCaPayout() {
  const getPayout = useCallback(async (): Promise<CaPayoutView | null> => {
    try {
      return ((await apiClient.get(ENDPOINTS.caApplications.mePayout)).data?.data ?? null) as CaPayoutView | null;
    } catch {
      return null;
    }
  }, []);

  const requestOtp = useCallback(async (): Promise<CaPayoutOutcome<CaPayoutOtpSent>> => {
    try {
      const data = (await apiClient.post(ENDPOINTS.caApplications.mePayoutOtp)).data?.data as CaPayoutOtpSent;
      return { ok: true, ...data };
    } catch (e) {
      return toFailure(e, "Could not send the code. Try again.");
    }
  }, []);

  const changePayout = useCallback(
    async (value: string, code: string): Promise<CaPayoutOutcome<{ payout: CaPayoutView }>> => {
      try {
        const data = (await apiClient.patch(ENDPOINTS.caApplications.mePayout, { value, code })).data
          ?.data as CaPayoutView;
        return { ok: true, payout: data };
      } catch (e) {
        return toFailure(e, "Could not save your payout details. Try again.");
      }
    },
    [],
  );

  return { getPayout, requestOtp, changePayout };
}
