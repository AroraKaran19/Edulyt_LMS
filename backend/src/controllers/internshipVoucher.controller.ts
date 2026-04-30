import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  countAvailableVouchers,
  listVouchersForUser,
  redeemInternshipVoucher,
} from "../services/internshipVoucher.services";

/**
 * @route   GET /api/internship-vouchers/me
 * @desc    Available count + full list of the user's internship vouchers
 * @access  Private
 */
export const getMyVouchers = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id as string | undefined;
    if (!userId) throw new AppError("Unauthorized", 401);

    const [available, vouchers] = await Promise.all([
      countAvailableVouchers(userId),
      listVouchersForUser(userId),
    ]);

    sendSuccessResponse(
      res,
      { available, vouchers },
      "Internship vouchers fetched successfully",
      200,
    );
  },
);

/**
 * @route   POST /api/internship-vouchers/redeem
 * @desc    Redeem a voucher (by _id or code) → enroll in chosen internship batch
 * @access  Private
 *
 * Body: { voucherIdOrCode, internshipId, batchId }
 */
export const redeemVoucher = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id as string | undefined;
    if (!userId) throw new AppError("Unauthorized", 401);

    const { voucherIdOrCode, internshipId, batchId } = req.body as {
      voucherIdOrCode?: string;
      internshipId?: string;
      batchId?: string;
    };

    if (!voucherIdOrCode)
      throw new AppError("voucherIdOrCode is required", 400);
    if (!internshipId) throw new AppError("internshipId is required", 400);
    if (!batchId) throw new AppError("batchId is required", 400);

    const result = await redeemInternshipVoucher({
      userId,
      voucherIdOrCode,
      internshipId,
      batchId,
    });

    sendSuccessResponse(
      res,
      result,
      `Voucher ${result.code} redeemed — you are now enrolled!`,
      201,
    );
  },
);
