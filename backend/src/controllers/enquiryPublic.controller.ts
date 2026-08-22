import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  claimPhoneSend,
  loadSessionByToken,
  requestEmailOtp,
  startUnverifiedSession,
  verifyEmailOtp,
  verifyPhone,
} from "../services/publicContactVerification.services";
import {
  ENQUIRY_OTP_PURPOSE,
  ENQUIRY_SCOPE,
  ENQUIRY_SESSION_MINUTES,
} from "../constants/enquiry";

/**
 * Email and phone verification for the enquiry form, for visitors with no
 * account. A signed-in visitor needs neither: their address was settled at
 * signup, and changing their number goes through `/users/me/phone/*`, which
 * writes it to the profile.
 */

const sessionOf = (req: Request) => {
  const session = req.enquirySession;
  if (!session) throw new AppError("Verify your email again to continue", 401);
  return session;
};

/**
 * Opens a session from the details on the form, with no code for the address.
 *
 * The lead is a request for a sales call, so the number is the part that has to
 * be real and it is proved on the next two calls. The address rides along
 * unproved, which the session records rather than implies.
 */
export const startEnquirySession = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await startUnverifiedSession({
      scope: ENQUIRY_SCOPE,
      email: String(req.body?.email ?? ""),
      sessionMinutes: ENQUIRY_SESSION_MINUTES,
    });
    sendSuccessResponse(res, result, "Continue");
  },
);

export const requestEnquiryOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await requestEmailOtp({
      scope: ENQUIRY_SCOPE,
      email: String(req.body?.email ?? ""),
      purpose: ENQUIRY_OTP_PURPOSE,
      label: "Enquiry",
    });
    sendSuccessResponse(res, result, "Code sent");
  },
);

export const verifyEnquiryOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await verifyEmailOtp({
      scope: ENQUIRY_SCOPE,
      email: String(req.body?.email ?? ""),
      otp: String(req.body?.otp ?? ""),
      sessionMinutes: ENQUIRY_SESSION_MINUTES,
    });
    sendSuccessResponse(res, result, "Email verified");
  },
);

/**
 * Books an SMS before the browser widget is allowed to send one. The widget
 * dispatches client-side, so this is the only place a send can be metered.
 */
export const claimEnquiryPhoneSend = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await claimPhoneSend(sessionOf(req).id, req.body?.phone);
    sendSuccessResponse(res, result, "You can send the code now");
  },
);

export const verifyEnquiryPhone = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await verifyPhone(
      sessionOf(req).id,
      req.body?.phone,
      req.body?.accessToken,
    );
    sendSuccessResponse(res, result, "Phone verified");
  },
);

/**
 * Lets a reloaded form pick up where it left off instead of re-sending codes.
 * Reads the token from the body rather than a header so the client can ask
 * before deciding whether it still has a usable session.
 */
export const getEnquirySession = asyncHandler(
  async (req: Request, res: Response) => {
    const token = String(req.body?.sessionToken ?? "");
    const session = token ? await loadSessionByToken(token) : null;

    if (
      !session ||
      session.scope !== ENQUIRY_SCOPE ||
      new Date(session.expiresAt).getTime() < Date.now()
    ) {
      return sendSuccessResponse(res, null, "No session");
    }

    sendSuccessResponse(
      res,
      {
        email: session.email,
        phone: session.phone ?? null,
        phoneVerified: Boolean(session.phoneVerifiedAt),
        expiresAt: session.expiresAt,
      },
      "Session fetched",
    );
  },
);
