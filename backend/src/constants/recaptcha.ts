/**
 * Copy and error codes for the reCAPTCHA v2 gate on public forms.
 *
 * Codes are part of the API contract: the enquiry form branches on them to tell
 * a spent tick (clear the box, ask for another) apart from the service being
 * down (nothing the visitor can do about it). Change a code and the frontend
 * must change with it. Messages are visitor-facing and safe to display verbatim.
 */
export const RECAPTCHA_ERROR_CODES = {
  /** No token in the body at all. */
  CAPTCHA_REQUIRED: "CAPTCHA_REQUIRED",
  /** Google refused the token: unsolved, already spent, or expired. */
  CAPTCHA_REJECTED: "CAPTCHA_REJECTED",
  /** Our misconfiguration, or Google unreachable. Not the visitor's fault. */
  CAPTCHA_UNAVAILABLE: "CAPTCHA_UNAVAILABLE",
} as const;

export type RecaptchaErrorCode =
  (typeof RECAPTCHA_ERROR_CODES)[keyof typeof RECAPTCHA_ERROR_CODES];

export const RECAPTCHA_MESSAGES = {
  REQUIRED: "Please confirm you are not a robot.",
  REJECTED: "That check has expired. Please tick the box again.",
  UNAVAILABLE:
    "Verification is unavailable right now. Please try again in a moment.",
} as const;
