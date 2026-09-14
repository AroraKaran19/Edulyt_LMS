import mongoose from "mongoose";
import type { ReferralProfile } from "../types/referral";
import { brandPlugin } from "./plugins/brand.plugin";
import { DEFAULT_BRAND } from "../constants/brands";

/** Pattern check only — we do NOT verify whether the UPI actually exists. */
const UPI_PATTERN = /^[\w.\-]+@[\w]+$/;

const referralProfileSchema = new mongoose.Schema<ReferralProfile>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 20,
      index: true,
    },
    upiId: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (v: string) => !v || UPI_PATTERN.test(v),
        message:
          "UPI ID must look like name@bank (only basic pattern is checked).",
      },
    },
  },
  { timestamps: true },
);

// One profile per person per brand. The compound key also serves userId lookups.
referralProfileSchema.plugin(brandPlugin, { defaultBrand: DEFAULT_BRAND });
referralProfileSchema.index({ userId: 1, brand: 1 }, { unique: true });

export const ReferralProfileModel = mongoose.model<ReferralProfile>(
  "ReferralProfile",
  referralProfileSchema,
);
