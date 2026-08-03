import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  claimOtpSend,
  getOtpStatus,
  verifyPhoneForUser,
} from "../services/phoneVerification.services";
import { PHONE_MESSAGES } from "../constants/phoneVerification";

/**
 * MSG91 phone verification for the signed-in learner.
 *
 * Three steps, all scoped to `req.user`: ask what the cooldown is, claim a send
 * before the widget dispatches one, and hand back the widget's access token to
 * have the number written to the account.
 */

const requireUserId = (req: Request): string => {
  const userId = req.user?._id;
  if (!userId) {
    throw new AppError("User ID not found", 400);
  }
  return String(userId);
};

/**
 * @route GET /api/users/me/phone/otp-status
 * @desc  Remaining resend cooldown, so a reload resumes the countdown.
 */
export const getPhoneOtpStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const status = await getOtpStatus(requireUserId(req));
    sendSuccessResponse(res, status, "OTP status fetched", 200);
  },
);

/**
 * @route POST /api/users/me/phone/otp-request
 * @desc  Spends one send from the learner's budget. Call this before asking
 *        the MSG91 widget to send, and only send when it returns 200.
 */
export const requestPhoneOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const claim = await claimOtpSend(requireUserId(req), req.body?.phone);
    sendSuccessResponse(res, claim, PHONE_MESSAGES.OTP_REQUESTED, 200);
  },
);

/**
 * @route POST /api/users/me/phone/verify
 * @desc  Exchanges the widget's access token for a verified number on the
 *        account. The only path that writes `phone` for a learner.
 */
export const verifyPhoneOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await verifyPhoneForUser(
      requireUserId(req),
      req.body?.phone,
      req.body?.msg91Token,
    );
    sendSuccessResponse(res, result, PHONE_MESSAGES.PHONE_VERIFIED, 200);
  },
);
