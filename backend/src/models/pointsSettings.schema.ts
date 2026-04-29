import mongoose from "mongoose";

/** Singleton document: how many INR each point type is worth (admin-configured). */
const pointsSettingsSchema = new mongoose.Schema(
  {
    /** Fixed id so we only ever have one row */
    key: { type: String, required: true, unique: true, default: "global" },
    /** Rupees per 1 course / user success point */
    successPointInr: { type: Number, required: true, default: 0, min: 0 },
    /** Rupees per 1 internship success point (enrollment) */
    internshipSuccessPointInr: {
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
