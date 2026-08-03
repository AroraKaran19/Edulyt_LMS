/**
 * Copy and error codes for email-verified signup.
 *
 * Codes are part of the API contract: the register page branches on them to
 * decide whether to keep the learner on the OTP step, disable the resend
 * button, or send them back to the form. Change a code and the frontend must
 * change with it. Messages are learner-facing and safe to display verbatim.
 */
export const SIGNUP_ERROR_CODES = {
  /** The address already has an account. */
  USER_EXISTS: "USER_EXISTS",
  /** No pending signup: expired, reaped, or already consumed. */
  PENDING_NOT_FOUND: "PENDING_NOT_FOUND",
  /** The code was right once, but its 10-minute window has passed. */
  OTP_EXPIRED: "OTP_EXPIRED",
  /** Wrong code, attempts remain. */
  OTP_INVALID: "OTP_INVALID",
  /** Wrong code too many times; a new code is required. */
  OTP_ATTEMPTS_EXCEEDED: "OTP_ATTEMPTS_EXCEEDED",
  /** Asked for another code inside the cooldown. */
  OTP_THROTTLED: "OTP_THROTTLED",
  /** Burned every code this signup is allowed. Carries retryAfterMinutes. */
  OTP_SEND_LIMIT: "OTP_SEND_LIMIT",
  /** MSG91 refused the send, so no code went out. */
  OTP_SEND_FAILED: "OTP_SEND_FAILED",
  /** Another request already turned this signup into an account. */
  ALREADY_VERIFIED: "ALREADY_VERIFIED",
} as const;

export type SignupErrorCode =
  (typeof SIGNUP_ERROR_CODES)[keyof typeof SIGNUP_ERROR_CODES];

/** Fixed learner-facing copy. */
export const SIGNUP_MESSAGES = {
  USER_EXISTS: "User already exists!",
  PENDING_NOT_FOUND: "This signup has expired. Please register again.",
  OTP_EXPIRED: "This code has expired. Request a new one.",
  OTP_ATTEMPTS_EXCEEDED: "Too many incorrect attempts. Request a new code.",
  OTP_SEND_FAILED:
    "We could not send the verification email. Please try again.",
  ALREADY_VERIFIED: "This signup was already completed. Please log in.",
  OTP_REQUIRED: "Verification code is required",
  PENDING_ID_REQUIRED: "pendingId is required",
  CODE_SENT: "Verification code sent to your email",
  CODE_RESENT: "Verification code resent",
  REGISTERED: "User registered successfully",
} as const;

/** Wrong code, with the budget left so the learner knows where they stand. */
export const otpIncorrectMessage = (remaining: number): string =>
  remaining > 0
    ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
    : SIGNUP_MESSAGES.OTP_ATTEMPTS_EXCEEDED;

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
