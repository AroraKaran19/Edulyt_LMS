import { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";
import { loadSessionByToken } from "../services/publicContactVerification.services";
import { ENQUIRY_SCOPE } from "../constants/enquiry";

const UNAUTHORIZED = "Verify your email again to continue";

/**
 * Resolves the bearer token issued at email verify into an enquiry session.
 *
 * The scope check is not decoration: public forms share one session collection,
 * so without it a scholarship token would open these routes and spend this
 * form's SMS budget.
 */
export const requireEnquirySession = async (
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
  if (!session || session.scope !== ENQUIRY_SCOPE) {
    return next(new AppError(UNAUTHORIZED, 401));
  }

  // Mongo's TTL reaper runs roughly once a minute, so an expired row can still
  // be readable. The index is cleanup, not the check.
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return next(new AppError(UNAUTHORIZED, 401));
  }

  req.enquirySession = {
    id: String(session._id),
    email: String(session.email),
    phoneVerified: Boolean(session.phoneVerifiedAt),
  };
  next();
};
