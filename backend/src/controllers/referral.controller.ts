import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createReferralWithdrawalForUser,
  getReferralCommissionConfigAdmin,
  getReferralOverviewForUser,
  listAllReferralWithdrawalsAdmin,
  listReferralSalesForUser,
  listWithdrawalsForUser,
  setReferralUpiForUser,
  transitionReferralWithdrawalAdmin,
  updateReferralCommissionConfigAdmin,
  validateReferralCode,
} from "../services/referral.services";
import type { ReferralWithdrawalStatus } from "../types/referral";

function asObjectId(req: Request): mongoose.Types.ObjectId {
  const id = req.user?._id;
  if (!id) throw new AppError("Unauthorized", 401);
  return new mongoose.Types.ObjectId(String(id));
}

// ─── User-facing ─────────────────────────────────────────────────────────────

export const getReferralOverviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = asObjectId(req);
    const overview = await getReferralOverviewForUser(userId);
    sendSuccessResponse(res, overview, "Referral overview fetched");
  },
);

export const updateReferralUpiController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = asObjectId(req);
    const result = await setReferralUpiForUser(userId, req.body?.upiId);
    sendSuccessResponse(res, result, "UPI ID updated");
  },
);

export const validateReferralCodeController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = asObjectId(req);
    const result = await validateReferralCode(req.body?.code, userId);
    sendSuccessResponse(res, result, "Referral code validated");
  },
);

export const listMyReferralSalesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = asObjectId(req);
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20),
    );
    const result = await listReferralSalesForUser(userId, page, limit);
    sendSuccessResponse(res, result, "Referral sales fetched");
  },
);

export const createReferralWithdrawalController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = asObjectId(req);
    const result = await createReferralWithdrawalForUser(
      userId,
      req.body?.amount,
    );
    sendSuccessResponse(res, result, "Withdrawal requested", 201);
  },
);

export const listMyReferralWithdrawalsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = asObjectId(req);
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20),
    );
    const result = await listWithdrawalsForUser(userId, page, limit);
    sendSuccessResponse(res, result, "Withdrawals fetched");
  },
);

// ─── Admin ───────────────────────────────────────────────────────────────────

export const getReferralCommissionConfigController = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await getReferralCommissionConfigAdmin();
    sendSuccessResponse(res, result, "Referral commission config fetched");
  },
);

export const updateReferralCommissionConfigController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = asObjectId(req);
    const result = await updateReferralCommissionConfigAdmin(
      req.body?.tiers,
      req.body?.buyerDiscountPercent,
      userId,
    );
    sendSuccessResponse(res, result, "Referral commission config updated");
  },
);

export const listAllReferralWithdrawalsAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const statusRaw = req.query.status;
    const VALID = ["pending", "processing", "success", "rejected"] as const;
    const status =
      typeof statusRaw === "string" &&
      (VALID as readonly string[]).includes(statusRaw)
        ? (statusRaw as ReferralWithdrawalStatus)
        : undefined;
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20),
    );
    const result = await listAllReferralWithdrawalsAdmin({
      status,
      q,
      page,
      limit,
    });
    sendSuccessResponse(res, result, "Withdrawal requests fetched");
  },
);

export const transitionReferralWithdrawalController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = asObjectId(req);
    const { id } = req.params;
    const result = await transitionReferralWithdrawalAdmin(
      String(id),
      req.body?.status,
      adminId,
      req.body?.notes,
    );
    sendSuccessResponse(res, result, "Withdrawal updated");
  },
);
