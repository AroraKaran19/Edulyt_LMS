import mongoose from "mongoose";

/**
 * Send-throttle state for a learner's in-flight phone verification.
 *
 * The OTP itself never touches this collection: MSG91's widget issues and
 * checks the code, and the proof we accept is the signed access token it hands
 * back. All this document does is stop one learner from burning through sends,
 * which is the part the client cannot be trusted to enforce.
 *
 * One document per user, so switching to a different number mid-window keeps
 * the same budget rather than opening a fresh one. The TTL index reaps the
 * record once the window closes, which is also what resets the budget.
 */
const phoneVerificationSchema = new mongoose.Schema(
  {
    /** One live verification per learner. */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    /** The 10-digit number the most recent code was sent to. */
    phone: { type: String, required: true, trim: true },
    /** Codes requested in this window, across number changes. Caps abuse. */
    sendCount: { type: Number, required: true, default: 0 },
    lastSentAt: { type: Date, required: true, default: Date.now },
    /** Hard deadline for the window. A TTL index reaps the document. */
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL: Mongo removes the document once `expiresAt` passes.
phoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PhoneVerificationModel = mongoose.model(
  "PhoneVerification",
  phoneVerificationSchema,
);
