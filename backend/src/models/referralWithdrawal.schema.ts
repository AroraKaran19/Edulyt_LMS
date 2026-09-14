import mongoose from "mongoose";
import type { ReferralWithdrawal } from "../types/referral";
import { brandPlugin } from "./plugins/brand.plugin";
import { DEFAULT_BRAND } from "../constants/brands";

const referralWithdrawalSchema = new mongoose.Schema<ReferralWithdrawal>(
  {
    referrerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 1 },
    upiIdSnapshot: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "success", "rejected"],
      default: "pending",
      index: true,
    },
    notes: { type: String, trim: true, default: "" },
    decidedAt: { type: Date, default: null },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

referralWithdrawalSchema.index({ status: 1, createdAt: -1 });
referralWithdrawalSchema.index({ referrerUserId: 1, createdAt: -1 });
referralWithdrawalSchema.plugin(brandPlugin, { defaultBrand: DEFAULT_BRAND });
referralWithdrawalSchema.index({ referrerUserId: 1, brand: 1, createdAt: -1 });

export const ReferralWithdrawalModel = mongoose.model<ReferralWithdrawal>(
  "ReferralWithdrawal",
  referralWithdrawalSchema,
);
