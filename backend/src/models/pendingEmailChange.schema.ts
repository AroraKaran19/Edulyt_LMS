import mongoose from "mongoose";

/**
 * An email change a learner has requested but not yet proven by OTP.
 *
 * The address on the `User` document is untouched until the code sent to
 * `newEmail` comes back verified, so a typo or a hijacked session cannot move
 * an account onto an address nobody controls. The account's email is its
 * recovery channel; changing it unverified is a one-way door.
 *
 * Keyed on `user` rather than on `newEmail`: retargeting to a different address
 * mid-window updates this document instead of opening a second one, so the send
 * budget cannot be reset by simply typing a different address. The TTL index
 * reaps the record, which is also what resets that budget.
 *
 * `otpHash` is bcrypt, so a leaked dump of this collection yields no usable
 * codes. The current password is checked when the change is requested and is
 * never stored here.
 */
const pendingEmailChangeSchema = new mongoose.Schema(
  {
    /** One live email change per account. */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    /** The address the most recent code was sent to. */
    newEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    /** bcrypt hash of the 6-digit code. */
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    /** Wrong codes tried against the current OTP; a resend resets it. */
    attempts: { type: Number, required: true, default: 0 },
    /** Codes emailed this window, across resends and retargets. Caps abuse. */
    sendCount: { type: Number, required: true, default: 0 },
    lastSentAt: { type: Date, required: true, default: Date.now },

    /**
     * Hard deadline for the whole attempt. A TTL index reaps the document, so
     * an abandoned change cleans itself up without a cron.
     */
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL: Mongo removes the document once `expiresAt` passes.
pendingEmailChangeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingEmailChangeModel = mongoose.model(
  "PendingEmailChange",
  pendingEmailChangeSchema,
);
