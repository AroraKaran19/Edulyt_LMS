import mongoose from "mongoose";
import crypto from "crypto";

/**
 * An InternshipVoucher is a single-use token awarded automatically when a
 * learner purchases a course and pays ≥ 50 % of its original plan price.
 *
 * Rules:
 *  - Tied to the user who earned it — cannot be transferred.
 *  - Single-use: `status` moves to "redeemed" on first redemption.
 *  - Expires after redemption (`redeemedAt` is set).
 *  - Optional wall-clock expiry (`expiresAt`) after which it can no longer
 *    be redeemed even if unused.
 *  - One voucher per qualifying order (unique index on `sourceOrderId`).
 */
const internshipVoucherSchema = new mongoose.Schema(
  {
    /**
     * Human-readable voucher code — e.g. "INTV-A3X9F2".
     * Generated once at creation; unique across the collection.
     */
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** The course enrollment that triggered this award. */
    sourceEnrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    /** The qualifying paid order — unique so one order → one voucher. */
    sourceOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "redeemed", "expired"],
      default: "available",
      index: true,
    },
    /** Wall-clock expiry date — null means it never expires on its own. */
    expiresAt: {
      type: Date,
      default: null,
    },
    /** Timestamp of redemption; set when status → "redeemed". */
    redeemedAt: {
      type: Date,
      default: null,
    },
    /** The internship enrollment created on redemption. */
    redeemedInternshipEnrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipEnrollment",
      default: null,
    },
  },
  { timestamps: true },
);

internshipVoucherSchema.index({ userId: 1, status: 1 });
internshipVoucherSchema.index({ sourceOrderId: 1 }, { unique: true });

/** Generate a unique voucher code like "INTV-A3X9F2". */
export function generateVoucherCode(): string {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `INTV-${rand}`;
}

export const InternshipVoucherModel = mongoose.model(
  "InternshipVoucher",
  internshipVoucherSchema,
);
