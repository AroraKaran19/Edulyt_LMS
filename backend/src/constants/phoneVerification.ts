/**
 * Copy and error codes for MSG91 phone verification.
 *
 * Codes are part of the API contract: the phone field branches on them to
 * decide whether to keep counting down, retire the resend button, or send the
 * learner back to correct the number. Change a code and the frontend must
 * change with it. Messages are learner-facing and safe to display verbatim.
 */
export const PHONE_ERROR_CODES = {
  /** Not a 10-digit Indian mobile number. */
  PHONE_INVALID: "PHONE_INVALID",
  /** Another account already owns this number. */
  PHONE_IN_USE: "PHONE_IN_USE",
  /** A profile save tried to change `phone` without verifying it first. */
  PHONE_NOT_VERIFIED: "PHONE_NOT_VERIFIED",
  /**
   * A code was asked for on a session that has already proved its number. Not
   * a failure: there is nothing left to send, so the client should carry on
   * rather than show this as a wall.
   */
  PHONE_ALREADY_VERIFIED: "PHONE_ALREADY_VERIFIED",
  /** Asked for another code inside the cooldown. Carries retryAfterSeconds. */
  OTP_THROTTLED: "OTP_THROTTLED",
  /** Burned every code this window allows. Carries retryAfterMinutes. */
  OTP_SEND_LIMIT: "OTP_SEND_LIMIT",
  /** MSG91 rejected the widget token, so the number is not proven. */
  OTP_TOKEN_INVALID: "OTP_TOKEN_INVALID",
  /**
   * The token verified, but against a different number than the one being
   * saved. Someone is replaying another number's token.
   */
  PHONE_MISMATCH: "PHONE_MISMATCH",
  /** MSG91_AUTHKEY is missing, so no token can be checked. */
  OTP_PROVIDER_UNCONFIGURED: "OTP_PROVIDER_UNCONFIGURED",
} as const;

export type PhoneErrorCode =
  (typeof PHONE_ERROR_CODES)[keyof typeof PHONE_ERROR_CODES];

/** Fixed learner-facing copy. */
export const PHONE_MESSAGES = {
  PHONE_REQUIRED: "Phone number is required",
  PHONE_INVALID: "Enter a valid 10-digit mobile number.",
  PHONE_IN_USE: "This number is already linked to another account.",
  PHONE_NOT_VERIFIED:
    "Verify your new phone number with the OTP before saving it.",
  TOKEN_REQUIRED: "Verification token is required",
  OTP_TOKEN_INVALID: "We could not verify that code. Please try again.",
  PHONE_MISMATCH:
    "That code was issued for a different number. Please start again.",
  OTP_PROVIDER_UNCONFIGURED:
    "Phone verification is unavailable right now. Please try again later.",
  OTP_REQUESTED: "You can send the code now",
  PHONE_VERIFIED: "Phone number verified",
} as const;

/** Seconds between sends. Also the countdown the resend button shows. */
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Codes a single learner may request per window. Every send costs money and a
 * legitimate learner needs two or three at most, including mistyped numbers.
 */
export const MAX_SENDS_PER_WINDOW = 5;

/**
 * How long the throttle record survives before the TTL index reaps it, measured
 * from the last send. It doubles as the lockout: once the send cap is spent,
 * this is how long the learner waits before the budget resets.
 */
export const VERIFICATION_WINDOW_MINUTES = 15;

/** Asked again inside the per-send cooldown. */
export const otpThrottledMessage = (seconds: number): string =>
  `Please wait ${seconds} second${seconds === 1 ? "" : "s"} before requesting another code.`;

/**
 * Every allowed code has been sent. States when the budget resets rather than
 * dead-ending them, since the wait is the throttle record's TTL.
 */
export const otpSendLimitMessage = (retryAfterMinutes: number): string =>
  `You have requested the maximum number of codes. Please try again in ${retryAfterMinutes} minute${
    retryAfterMinutes === 1 ? "" : "s"
  }.`;
