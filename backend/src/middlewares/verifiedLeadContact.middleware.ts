import { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";
import { UserModel } from "../models";
import { loadSessionByToken } from "../services/publicContactVerification.services";
import { ENQUIRY_SCOPE } from "../constants/enquiry";
import { normalizePhone } from "../services/phoneVerification.services";

/**
 * Establishes a proved email and phone for a lead, from one of the two ways
 * someone reaches the enquiry form.
 *
 * The address and number are put on the request rather than read from the body
 * downstream. That is the whole point: if the handler trusted the body, both
 * verification paths below would be decoration, since anyone could post a lead
 * with any details and skip them.
 */

/** The session token is 32 random bytes as hex; a user JWT never looks like it. */
const CONTACT_TOKEN = /^[a-f0-9]{64}$/;

const UNVERIFIED =
  "Verify your email and mobile number before sending your details";

export const requireVerifiedLeadContact = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = String(req.headers?.authorization ?? "");
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new AppError(UNVERIFIED, 401));
  }

  // Anonymous: both proofs live on the contact session.
  if (CONTACT_TOKEN.test(token)) {
    const session = await loadSessionByToken(token);
    if (!session || session.scope !== ENQUIRY_SCOPE) {
      return next(new AppError(UNVERIFIED, 401));
    }
    // The TTL reaper runs about once a minute, so an expired row still reads.
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return next(new AppError(UNVERIFIED, 401));
    }
    if (!session.phoneVerifiedAt || !session.phone) {
      return next(new AppError(UNVERIFIED, 403));
    }

    req.verifiedContact = {
      email: String(session.email),
      phone: String(session.phone),
      userId: session.userId ? String(session.userId) : undefined,
    };
    return next();
  }

  // Signed in: the account settled the email at signup, and the number is only
  // trusted once /users/me/phone/verify has written it to the profile. Comparing
  // against that is what makes changing the number here require a fresh OTP.
  const user = req.user;
  if (!user?._id) {
    return next(new AppError(UNVERIFIED, 401));
  }

  const account = await UserModel.findById(user._id)
    .select("email phone phoneVerifiedAt")
    .lean();
  if (!account?.email) {
    return next(new AppError("Sign in again to continue", 401));
  }

  const claimed = normalizePhone(req.body?.phone);
  const onFile = normalizePhone(account.phone);
  if (!account.phoneVerifiedAt || !onFile || onFile !== claimed) {
    return next(
      new AppError(
        "Verify this mobile number before sending your details",
        403,
      ),
    );
  }

  req.verifiedContact = {
    email: String(account.email),
    phone: onFile,
    userId: String(account._id),
  };
  next();
};
