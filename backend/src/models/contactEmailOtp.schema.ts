import mongoose from "mongoose";
import { ContactEmailOtp } from "../types/contactVerification";

/**
 * A pending email code for a public form, keyed on (scope, email) because there
 * is no account to key on.
 */
const contactEmailOtpSchema = new mongoose.Schema<ContactEmailOtp>(
  {
    scope: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    /** Hashed, so a database read cannot hand someone a live code. */
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0, min: 0 },
    sendCount: { type: Number, required: true, default: 0, min: 0 },
    lastSentAt: { type: Date, required: true, default: () => new Date(0) },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

/** Unique, which is what makes the atomic upsert-or-reject throttle work. */
contactEmailOtpSchema.index({ scope: 1, email: 1 }, { unique: true });
contactEmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ContactEmailOtpModel = mongoose.model<ContactEmailOtp>(
  "ContactEmailOtp",
  contactEmailOtpSchema,
);
