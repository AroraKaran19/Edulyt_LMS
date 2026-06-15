import mongoose from "mongoose";
import type { ReferralCommissionConfig } from "../types/referral";

const referralCommissionTierSchema = new mongoose.Schema(
  {
    thresholdSales: { type: Number, required: true, min: 1 },
    commissionPercent: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

/**
 * Singleton document holding the cumulative referral commission tiers
 * (e.g. `[{ threshold: 1, pct: 5 }, { threshold: 5, pct: 10 }, …]`).
 * The referrer's effective rate is the highest tier whose `thresholdSales`
 * is `<=` their lifetime active sale count; that rate is applied to all
 * active sales (retroactive bracket).
 */
const referralCommissionConfigSchema =
  new mongoose.Schema<ReferralCommissionConfig>(
    {
      tiers: { type: [referralCommissionTierSchema], default: [] },
      // Buyer-side discount (%) when checking out with another student's code.
      buyerDiscountPercent: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    { timestamps: true },
  );

export const ReferralCommissionConfigModel =
  mongoose.model<ReferralCommissionConfig>(
    "ReferralCommissionConfig",
    referralCommissionConfigSchema,
  );
