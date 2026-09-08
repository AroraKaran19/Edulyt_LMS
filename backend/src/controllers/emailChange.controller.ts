import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  changeEmailWithoutOtp,
  requestEmailChange,
  resendEmailChangeOtp,
  verifyEmailChange,
} from "../services/emailChangeVerification.services";
import {
  EMAIL_CHANGE_ERROR_CODES,
  EMAIL_CHANGE_MESSAGES,
} from "../constants/emailChangeMessages";
import {
  EMAIL_OTP_DISABLED_MESSAGE,
  EMAIL_OTP_ENABLED,
} from "../config/featureFlags";

/**
 * Verified email change for the signed-in learner.
 *
 * Three steps, all scoped to `req.user`: request a code for the new address,
 * verify it, resend if it never arrived. Nothing here writes the account's
 * email except `verify`, so an address on an account is one its owner proved
 * they can read.
 */

const requireUserId = (req: Request): string => {
  const userId = req.user?._id;
  if (!userId) {
    throw new AppError("User ID not found", 400);
  }
  return String(userId);
};

/**
 * @route POST /api/users/change-email/request
 * @desc  Emails a code to the new address. The account keeps its current email
 *        until that code comes back verified.
 */
export const requestUserEmailChange = asyncHandler(
  async (req: Request, res: Response) => {
    const { currentPassword, newEmail } = req.body ?? {};

    if (!currentPassword || !newEmail) {
      throw new AppError(EMAIL_CHANGE_MESSAGES.PASSWORD_REQUIRED, 400);
    }

    /*
     * With verification off this one call is the whole change, so it answers
     * with the applied address rather than a countdown to a code. The frontend
     * branches on `changedAt` being present, which keeps the flag on the server
     * instead of mirrored into a NEXT_PUBLIC_ var that could drift.
     */
    if (!EMAIL_OTP_ENABLED) {
      const done = await changeEmailWithoutOtp(
        requireUserId(req),
        currentPassword,
        newEmail,
      );
      sendSuccessResponse(res, done, EMAIL_CHANGE_MESSAGES.EMAIL_CHANGED, 200);
      return;
    }

    const started = await requestEmailChange(
      requireUserId(req),
      currentPassword,
      newEmail,
    );
    sendSuccessResponse(res, started, EMAIL_CHANGE_MESSAGES.CODE_SENT, 200);
  },
);

/**
 * @route POST /api/users/change-email/verify
 * @desc  Applies the change. The only path that moves a learner's email.
 */
export const verifyUserEmailChange = asyncHandler(
  async (req: Request, res: Response) => {
    if (!EMAIL_OTP_ENABLED) {
      throw new AppError(EMAIL_OTP_DISABLED_MESSAGE, 400);
    }

    const otp = req.body?.otp;

    if (!otp) {
      throw new AppError(
        EMAIL_CHANGE_MESSAGES.OTP_REQUIRED,
        400,
        EMAIL_CHANGE_ERROR_CODES.OTP_INVALID,
      );
    }

    const result = await verifyEmailChange(requireUserId(req), otp);
    sendSuccessResponse(res, result, EMAIL_CHANGE_MESSAGES.EMAIL_CHANGED, 200);
  },
);

/**
 * @route POST /api/users/change-email/resend
 * @desc  Fresh code for the in-flight change, subject to cooldown and cap.
 */
export const resendUserEmailChangeOtp = asyncHandler(
  async (req: Request, res: Response) => {
    if (!EMAIL_OTP_ENABLED) {
      throw new AppError(EMAIL_OTP_DISABLED_MESSAGE, 400);
    }

    const started = await resendEmailChangeOtp(requireUserId(req));
    sendSuccessResponse(res, started, EMAIL_CHANGE_MESSAGES.CODE_RESENT, 200);
  },
);
