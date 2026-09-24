import mongoose from "mongoose";

/**
 * OTP throttle for a Campus Ambassador changing their own payout details.
 *
 * Mirrors `PendingEmailChangeModel`: a bcrypt hash of the code, a send budget,
 * and a TTL that doubles as the lockout once that budget is spent. Keyed on
 * `application` rather than `user`, since the phone being proved is the one on
 * the CA application, not necessarily the account's own `phone` field.
 */
const caPayoutOtpSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaApplication",
      required: true,
      unique: true,
    },
    /** bcrypt hash of the 6-digit code. The plain code is never stored. */
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    /** Wrong codes tried against the current OTP; a resend resets it. */
    attempts: { type: Number, required: true, default: 0 },
    /** Codes sent this window, across resends. Caps abuse. */
    sendCount: { type: Number, required: true, default: 0 },
    lastSentAt: { type: Date, required: true, default: Date.now },
    /** Hard deadline for the attempt. A TTL index reaps the document. */
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL: Mongo removes the document once `expiresAt` passes.
caPayoutOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CaPayoutOtpModel = mongoose.model("CaPayoutOtp", caPayoutOtpSchema);
