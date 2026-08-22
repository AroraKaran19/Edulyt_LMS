/** Must match backend `AUTH_ERROR_ACCOUNT_DISABLED`. */
export const AUTH_ERROR_ACCOUNT_DISABLED = "ACCOUNT_DISABLED" as const;

/**
 * Signup verification codes.
 */
export const SIGNUP_ERROR_CODES = {
  /** The pending signup is gone: expired, reaped, or already consumed. */
  PENDING_NOT_FOUND: "PENDING_NOT_FOUND",
  /** Every allowed code has been sent. Carries `meta.retryAfterMinutes`. */
  OTP_SEND_LIMIT: "OTP_SEND_LIMIT",
  /** Another request already turned this signup into an account. */
  ALREADY_VERIFIED: "ALREADY_VERIFIED",
} as const;

/**
 * Verified email change codes. Must match backend
 * `constants/emailChangeMessages.ts`.
 */
export const EMAIL_CHANGE_ERROR_CODES = {
  /** Nothing in flight: expired, reaped, or already completed. */
  REQUEST_NOT_FOUND: "REQUEST_NOT_FOUND",
  /** Asked for another code inside the cooldown. Carries `meta.retryAfterSeconds`. */
  OTP_THROTTLED: "OTP_THROTTLED",
  /** Every code this window allows has been sent. Carries `meta.retryAfterMinutes`. */
  OTP_SEND_LIMIT: "OTP_SEND_LIMIT",
  /** Wrong current password. */
  PASSWORD_INCORRECT: "PASSWORD_INCORRECT",
  /** The account has no password to check against. */
  PASSWORD_NOT_SET: "PASSWORD_NOT_SET",
  /** Another account already owns the address. */
  EMAIL_IN_USE: "EMAIL_IN_USE",
  /** The address is the one already on the account. */
  EMAIL_UNCHANGED: "EMAIL_UNCHANGED",
  /** Not a usable email address. */
  EMAIL_INVALID: "EMAIL_INVALID",
} as const;

/**
 * reCAPTCHA gate codes. Must match backend `constants/recaptcha.ts`.
 */
export const CAPTCHA_ERROR_CODES = {
  /** No token was sent. */
  CAPTCHA_REQUIRED: "CAPTCHA_REQUIRED",
  /** Google refused the token: unsolved, already spent, or expired. */
  CAPTCHA_REJECTED: "CAPTCHA_REJECTED",
  /** Misconfigured secret, or Google unreachable. Not the visitor's fault. */
  CAPTCHA_UNAVAILABLE: "CAPTCHA_UNAVAILABLE",
} as const;

/**
 * MSG91 phone verification codes. Must match backend
 * `constants/phoneVerification.ts`.
 */
export const PHONE_ERROR_CODES = {
  /** Asked for another code inside the cooldown. Carries `meta.retryAfterSeconds`. */
  OTP_THROTTLED: "OTP_THROTTLED",
  /** Every code this window allows has been sent. Carries `meta.retryAfterMinutes`. */
  OTP_SEND_LIMIT: "OTP_SEND_LIMIT",
  /** A profile save tried to change the number without verifying it. */
  PHONE_NOT_VERIFIED: "PHONE_NOT_VERIFIED",
  /** Another account already owns this number. */
  PHONE_IN_USE: "PHONE_IN_USE",
} as const;
