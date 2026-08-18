import { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";
import { loadSessionByToken } from "../services/publicContactVerification.services";
import { testIdFromScope } from "../services/scholarshipOtp.services";

const UNAUTHORIZED = "Verify your email again to continue";

/**
 * Resolves the bearer token issued at OTP verify into a campaign and a verified
 * email.
 *
 * This is the whole authorization story for the public flow: there is no
 * account, so the campaign and email are read from the session document and
 * every downstream service takes them from `req.scholarshipSession` rather than
 * from the request body. A body-supplied email would let anyone claim anyone's
 * coupon.
 */
export const requireScholarshipSession = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = String(req.headers?.authorization ?? "");
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new AppError(UNAUTHORIZED, 401));
  }

  const session = await loadSessionByToken(token);
  if (!session) {
    return next(new AppError(UNAUTHORIZED, 401));
  }

  // Public forms share one session collection, so a token is only good for the
  // flow that issued it. Without this an enquiry session would open these
  // routes.
  const testId = testIdFromScope(session.scope);
  if (!testId) {
    return next(new AppError(UNAUTHORIZED, 401));
  }

  // Mongo's TTL reaper runs roughly once a minute, so an expired row can still
  // be readable. The index is cleanup, not the check.
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return next(new AppError(UNAUTHORIZED, 401));
  }

  req.scholarshipSession = {
    // The session's own id, not just its contents. Two sessions can exist for
    // one (campaign, email) pair, so anything writing back to "the session"
    // must address the one this token names.
    id: String(session._id),
    testId,
    email: String(session.email),
    phoneVerified: Boolean(session.phoneVerifiedAt),
  };
  next();
};
