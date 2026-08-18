import mongoose from "mongoose";
import { ScholarshipEmailOtp } from "../types/scholarship";

const scholarshipEmailOtpSchema = new mongoose.Schema<ScholarshipEmailOtp>(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScholarshipTest",
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0, min: 0 },
    sendCount: { type: Number, required: true, default: 0, min: 0 },
    lastSentAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Keyed on the pair, not the email: one person may enter several campaigns, and
// a throttle on one must not lock them out of another.
scholarshipEmailOtpSchema.index({ testId: 1, email: 1 }, { unique: true });
scholarshipEmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ScholarshipEmailOtpModel = mongoose.model<ScholarshipEmailOtp>(
  "ScholarshipEmailOtp",
  scholarshipEmailOtpSchema,
);
