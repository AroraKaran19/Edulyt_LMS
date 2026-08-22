import { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";
import {
  RECAPTCHA_ERROR_CODES,
  RECAPTCHA_MESSAGES,
} from "../constants/recaptcha";
import { verifyRecaptcha } from "../utils/recaptcha";

/**
 * Gates a public route behind a solved reCAPTCHA v2 checkbox.
 *
 * Mount it where an anonymous caller makes us spend money. The enquiry OTP send
 * is metered per email address, but nothing stops a script walking a list of
 * addresses, and every address it walks is a mail we pay to deliver.
 *
 * A v2 token is single use, so this is one solved checkbox per request, not per
 * visitor: a route mounted behind it can never be called twice off one tick.
 */
export const requireRecaptcha = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = String(req.body?.recaptchaToken ?? "").trim();

  if (!token) {
    return next(
      new AppError(
        RECAPTCHA_MESSAGES.REQUIRED,
        400,
        RECAPTCHA_ERROR_CODES.CAPTCHA_REQUIRED,
      ),
    );
  }

  const result = await verifyRecaptcha(token);

  if (result === "verified") return next();

  if (result === "unavailable") {
    return next(
      new AppError(
        RECAPTCHA_MESSAGES.UNAVAILABLE,
        503,
        RECAPTCHA_ERROR_CODES.CAPTCHA_UNAVAILABLE,
      ),
    );
  }

  next(
    new AppError(
      RECAPTCHA_MESSAGES.REJECTED,
      400,
      RECAPTCHA_ERROR_CODES.CAPTCHA_REJECTED,
    ),
  );
};
