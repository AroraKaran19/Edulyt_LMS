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
  },
  { timestamps: true },
);

export const PointsSettingsModel = mongoose.model(
  "PointsSettings",
  pointsSettingsSchema,
);
