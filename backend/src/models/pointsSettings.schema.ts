import mongoose from "mongoose";

/** Singleton document: how many INR each point type is worth (admin-configured). */
const pointsSettingsSchema = new mongoose.Schema(
  {
    /** Fixed id so we only ever have one row */
    key: { type: String, required: true, unique: true, default: "global" },
    /** Rupees per 1 internship success point (enrollment) */
    internshipSuccessPointInr: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    /** Rupees discount per 1 user success point when redeemed at checkout */
    successPointRedemptionInr: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    /** Max % of a course order's payable amount that may be settled with
     *  success points at checkout. 0 disables redemption globally. */
    successPointsMaxUtilizationPercent: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    /** Wallet success points granted once, on a user's first-ever login. */
    loginSuccessPoints: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    /** Wallet success points granted for submitting a community review
     *  (non-anonymous only; one per user). */
    communityReviewSuccessPoints: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    /** Wallet success points granted on registering for an internship
     *  (any path; once per internship). */
    internshipRegistrationSuccessPoints: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    /** Days a wallet credit stays spendable; 0 = never expires. */
    successPointsExpiryDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    /** Most points one user may send per IST calendar month; 0 = unlimited. */
    successPointsMonthlyTransferLimit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

export const PointsSettingsModel = mongoose.model(
  "PointsSettings",
  pointsSettingsSchema,
);
