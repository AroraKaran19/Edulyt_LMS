import mongoose from "mongoose";

/**
 * Shared by every public form that has to prove an email and a phone belong to
 * whoever is filling it in, with no account to hang that proof on.
 *
 * `scope` is what keeps two such forms apart: a scholarship campaign passes its
 * test id, the enquiry form passes a fixed literal. A code issued for one scope
 * is worthless in another.
 */
export interface ContactEmailOtp {
  _id?: string;
  scope: string;
  email: string;
  otpHash: string;
  otpExpiresAt: Date;
  /** Wrong codes against the current OTP. A resend clears it. */
  attempts: number;
  /** Codes emailed this window. */
  sendCount: number;
  lastSentAt: Date;
  /** TTL reaps the doc; doubles as the lockout deadline. */
  expiresAt: Date;
}

export interface ContactSession {
  _id?: string;
  /**
   * SHA-256 of the raw token, not bcrypt. The session is looked up *by* its
   * token on every call, and a bcrypt hash is unindexable since each carries its
   * own salt. A 256-bit random token has no guessable structure, so the
   * slow-hash protection bcrypt buys for passwords defends nothing here.
   */
  tokenHash: string;
  scope: string;
  email: string;
  /** Set once the MSG91 widget has proved the number. */
  phone?: string | null;
  phoneVerifiedAt?: Date | null;
  /**
   * The number the last SMS was claimed for. Verification insists the widget
   * token belongs to this number, so a token captured against one number cannot
   * be presented alongside another.
   */
  phonePending?: string | null;
  /** SMS codes claimed on this session, and when the last one was claimed. */
  phoneSendCount?: number;
  phoneLastSentAt?: Date | null;
  /**
   * Present only when the session came from a signed-in account. It is what
   * lets a verified number be written back to that profile.
   */
  userId?: mongoose.Types.ObjectId | null;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
