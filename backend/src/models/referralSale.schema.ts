import mongoose from "mongoose";
import type { ReferralSale } from "../types/referral";

/**
 * One row per qualifying paid course order that carried a referral code.
 * `status: "active"` rows count toward the referrer's lifetime tier and
 * balance; `reversed` rows are excluded (refund hook lands later).
 */
const referralSaleSchema = new mongoose.Schema<ReferralSale>(
  {
    referrerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    buyerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    courseName: { type: String, required: true, trim: true, default: "" },
    buyerName: { type: String, required: true, trim: true, default: "" },
    amount: { type: Number, required: true, min: 0 },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "reversed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

referralSaleSchema.index({ referrerUserId: 1, status: 1, createdAt: -1 });

export const ReferralSaleModel = mongoose.model<ReferralSale>(
  "ReferralSale",
  referralSaleSchema,
);
