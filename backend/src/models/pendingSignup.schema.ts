import mongoose from "mongoose";

/**
 * A signup that has been submitted but not yet verified by email OTP.
 *
 * No `User` document exists until the code is confirmed, so an abandoned or
 * fraudulent signup never occupies the email address and never appears in
 * learner counts. The record is disposable: it holds the credentials only long
 * enough to create the real account.
 *
 * `password` is already bcrypt-hashed on write, and `otpHash` is bcrypt too, so
 * a leaked dump of this collection yields neither a usable password nor a
 * usable code.
 */
const pendingSignupSchema = new mongoose.Schema(
  {
    /** Lowercased + trimmed. One live signup attempt per address. */
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: false, default: "", trim: true },
    /** bcrypt hash - never the plaintext password. */
    password: { type: String, required: true },
    userType: { type: String, required: true, default: "student" },
    provider: { type: String, required: true, default: "credentials" },
    /** Any extra registration fields (phone, referral, etc.) passed through. */
    extra: { type: mongoose.Schema.Types.Mixed, required: false, default: {} },

    /** bcrypt hash of the 6-digit code. */
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    /** Wrong codes tried against the current OTP; resend resets it. */
    attempts: { type: Number, required: true, default: 0 },
    /** Codes emailed for this signup, across resends. Caps abuse. */
    sendCount: { type: Number, required: true, default: 1 },
    lastSentAt: { type: Date, required: true, default: Date.now },

    /**
     * Hard deadline for the whole attempt. A TTL index reaps the document, so
     * abandoned signups free their email address without a cleanup job.
     */
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL: Mongo removes the document once `expiresAt` passes.
pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingSignupModel = mongoose.model(
  "PendingSignup",
  pendingSignupSchema,
);
