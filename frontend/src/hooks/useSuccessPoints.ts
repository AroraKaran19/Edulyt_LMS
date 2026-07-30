"use client";

import { useCallback } from "react";
import apiClient from "@/configs/apiConfig";

export type SuccessPointTransaction =
  | {
      transactionId: string;
      earnedAt: string;
      type: "earned";
      points: number;
      courseId?: string;
      enrollmentId?: string;
      earnSource?: string;
      courseSnapshot?: { title: string; slug?: string };
    }
  | {
      transactionId: string;
      earnedAt: string;
      type: "transferred_in";
      points: number;
      fromUserId?: string;
      fromUserDisplayName?: string;
      peerTransactionId?: string;
    }
  | {
      transactionId: string;
      earnedAt: string;
      type: "transferred_out";
      points: number;
      toUserId?: string;
      toUserDisplayName?: string;
      peerTransactionId?: string;
    }
  | {
      transactionId: string;
      earnedAt: string;
      type: "admin_adjustment";
      /** Signed: positive = granted, negative = deducted. */
      points: number;
      adjustedByUserId?: string;
      adjustedByName?: string;
    }
  | {
      transactionId: string;
      earnedAt: string;
      type: "redeemed";
      /** Magnitude (positive). */
      points: number;
      orderId?: string;
      courseId?: string;
      courseSnapshot?: { title: string; slug?: string };
    }
  | {
      transactionId: string;
      earnedAt: string;
      type: "reward";
      /** Magnitude (positive). */
      points: number;
      rewardSource?: "login" | "community_review" | "internship_registration";
    };

export interface SuccessPointsHistoryResponse {
  items: SuccessPointTransaction[];
  total: number;
  page: number;
  totalPages: number;
}

/** Admin read of one student's ledger — adds the all-time wallet summary. */
export interface AdminSuccessPointsHistoryResponse
  extends SuccessPointsHistoryResponse {
  balance: number;
  earned: number;
  spent: number;
}

export interface TransferResult {
  points: number;
  balance: number;
  recipient: { name: string; email: string };
}

export default function useSuccessPoints() {
  const getBalance = useCallback(async (): Promise<{ balance: number }> => {
    const res = await apiClient.get("/success-points/me");
    return res.data.data;
  }, []);

  const listHistory = useCallback(
    async (
      page = 1,
      limit = 10,
    ): Promise<SuccessPointsHistoryResponse> => {
      const res = await apiClient.get("/success-points/history", {
        params: { page, limit },
      });
      return res.data.data;
    },
    [],
  );

  const transfer = useCallback(
    async (input: {
      recipientEmail: string;
      points: number;
    }): Promise<TransferResult> => {
      const res = await apiClient.post("/success-points/transfer", input);
      return res.data.data;
    },
    [],
  );

  const adminAdjust = useCallback(
    async (input: {
      userId: string;
      points: number;
    }): Promise<{ balance: number; applied: number }> => {
      const res = await apiClient.post(
        "/success-points/admin/adjust",
        input,
      );
      return res.data.data;
    },
    [],
  );

  const adminListUserHistory = useCallback(
    async (
      userId: string,
      page = 1,
      limit = 10,
    ): Promise<AdminSuccessPointsHistoryResponse> => {
      const res = await apiClient.get(
        `/success-points/admin/history/${userId}`,
        { params: { page, limit } },
      );
      return res.data.data;
    },
    [],
  );

  return {
    getBalance,
    listHistory,
    transfer,
    adminAdjust,
    adminListUserHistory,
  };
}
