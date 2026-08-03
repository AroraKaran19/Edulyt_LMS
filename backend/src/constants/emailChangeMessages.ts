import { ACCOUNT_CHANGE_COOLDOWN_DAYS } from "./accountChangeCooldown";

/**
 * Copy and error codes for the verified email-change flow.
 *
 * Codes are part of the API contract: the profile page branches on them to
 * decide whether to keep the learner on the code step, retire the resend
 * button, or drop them back to the form. Change a code and the frontend must
 * change with it. Messages are learner-facing and safe to display verbatim.
 *
 * Deliberately separate from `signupVerificationMessages`: the two flows share
 * a shape, not a vocabulary. Signup can tell someone to "register again"; this
 * one is happening inside an account that already exists.
 */
export const EMAIL_CHANGE_ERROR_CODES = {
  /** Not a usable email address. */
  EMAIL_INVALID: "EMAIL_INVALID",
  /** The new address is the one already on the account. */
  EMAIL_UNCHANGED: "EMAIL_UNCHANGED",
  /** Another account already owns the address. */
  EMAIL_IN_USE: "EMAIL_IN_USE",
  /** Wrong current password. */
  PASSWORD_INCORRECT: "PASSWORD_INCORRECT",
  /** The account has no password to check against (never set one). */
  PASSWORD_NOT_SET: "PASSWORD_NOT_SET",
  /** Changed too recently. Carries `meta.daysRemaining`. */
  CHANGE_TOO_SOON: "CHANGE_TOO_SOON",
  /** No change in flight: expired, reaped, or already completed. */
  REQUEST_NOT_FOUND: "REQUEST_NOT_FOUND",
  /** The code was valid, but its window has passed. */
  OTP_EXPIRED: "OTP_EXPIRED",
  /** Wrong code, attempts remain. */
  OTP_INVALID: "OTP_INVALID",
  /** Wrong code too many times; a new code is required. */
  OTP_ATTEMPTS_EXCEEDED: "OTP_ATTEMPTS_EXCEEDED",
  /** Asked for another code inside the cooldown. */
  OTP_THROTTLED: "OTP_THROTTLED",
  /** Burned every code this window allows. Carries retryAfterMinutes. */
  OTP_SEND_LIMIT: "OTP_SEND_LIMIT",
  /** MSG91 refused the send, so no code went out. */
  OTP_SEND_FAILED: "OTP_SEND_FAILED",
} as const;

export type EmailChangeErrorCode =
  (typeof EMAIL_CHANGE_ERROR_CODES)[keyof typeof EMAIL_CHANGE_ERROR_CODES];

/** Fixed learner-facing copy. */
export const EMAIL_CHANGE_MESSAGES = {
  EMAIL_INVALID: "Please enter a valid email address.",
  EMAIL_UNCHANGED: "This is already the email on your account.",
  EMAIL_IN_USE: "Email already in use by another account",
  PASSWORD_INCORRECT: "Current password is incorrect",
  PASSWORD_NOT_SET:
    "Set a password on your account before changing your email.",
  PASSWORD_REQUIRED: "Current password and new email are required",
  REQUEST_NOT_FOUND:
    "This email change has expired. Please start again.",
  OTP_EXPIRED: "This code has expired. Request a new one.",
  OTP_ATTEMPTS_EXCEEDED: "Too many incorrect attempts. Request a new code.",
  OTP_REQUIRED: "Verification code is required",
  OTP_SEND_FAILED:
    "We could not send the verification email. Please try again.",
  USER_NOT_FOUND: "User not found",
  CODE_SENT: "Verification code sent to your new email",
  CODE_RESENT: "Verification code resent",
  EMAIL_CHANGED: "Email updated successfully",
} as const;

/**
 * Changed within the cooldown. Names the wait rather than a bare refusal, so
 * the learner knows this is a limit and not a broken form.
 */
export const emailChangeTooSoonMessage = (retryPhrase: string): string =>
  `You can only change your email once every ${ACCOUNT_CHANGE_COOLDOWN_DAYS} days. Please try again ${retryPhrase}.`;

/** Wrong code, with the budget left so the learner knows where they stand. */
export const otpIncorrectMessage = (remaining: number): string =>
  remaining > 0
    ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
    : EMAIL_CHANGE_MESSAGES.OTP_ATTEMPTS_EXCEEDED;

/** Asked again inside the per-send cooldown. */
export const otpThrottledMessage = (seconds: number): string =>
  `Please wait ${seconds} seconds before requesting another code.`;

/**
 * Every allowed code has been sent. States when they can start over rather
 * than dead-ending them, since the wait is the pending record's TTL.
 */
export const otpSendLimitMessage = (retryAfterMinutes: number): string =>
  `You have requested the maximum number of codes. Please try again in ${retryAfterMinutes} minute${
    retryAfterMinutes === 1 ? "" : "s"
  }.`;
