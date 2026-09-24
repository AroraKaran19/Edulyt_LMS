import mongoose from "mongoose";

/**
 * OTP send budget for a Campus Ambassador changing their own payout details.
 *
 * The MSG91 widget owns the code itself; this holds the send budget and a TTL
 * that doubles as the lockout once that budget is spent. Keyed on
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
