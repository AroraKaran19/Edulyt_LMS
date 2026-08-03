import mongoose from "mongoose";

/**
 * Send-throttle state for password reset requests, keyed on the address that
 * was typed into the form.
 *
 * Deliberately NOT keyed on a user id, and deliberately written even for
 * addresses with no account. The endpoint is public and must answer
 * identically whether or not the address is registered; if only real accounts
 * were throttled, a 429 would itself confirm that an account exists, which is
 * the leak the uniform response is there to prevent.
 *
 * No token is stored. The reset link carries a short-lived signed JWT, so this
 * collection holds nothing worth stealing: a leaked dump is a list of addresses
 * that asked for a reset.
 *
 * The TTL index reaps the record, which is also what resets the budget.
 */
const passwordResetRequestSchema = new mongoose.Schema(
  {
    /** Lowercased + trimmed. One live throttle window per address. */
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    /** Links emailed in this window. Caps both abuse and the mail bill. */
    sendCount: { type: Number, required: true, default: 0 },
    lastSentAt: { type: Date, required: true, default: Date.now },
    /** Hard deadline for the window. A TTL index reaps the document. */
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL: Mongo removes the document once `expiresAt` passes.
passwordResetRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetRequestModel = mongoose.model(
  "PasswordResetRequest",
  passwordResetRequestSchema,
);
