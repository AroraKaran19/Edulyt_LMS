import mongoose from "mongoose";
import { ScholarshipTest } from "../types/scholarship";

const scholarshipTestSchema = new mongoose.Schema<ScholarshipTest>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true, default: "", maxlength: 1000 },
    questions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "InternshipQuestion" },
    ],
    durationMinutes: { type: Number, required: true, min: 1 },
    attemptsAllowed: { type: Number, required: true, default: 1, min: 1 },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    couponValidForDays: { type: Number, required: true, min: 1 },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    /**
     * Frozen at creation. Users are hard-deleted, so a pointer alone would
     * leave old campaigns with no attributable author.
     */
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

// A campaign runs from creation until it is paused or deleted, so "live" is
// just the flag. There is no window to range-scan.
scholarshipTestSchema.index({ isActive: 1, createdAt: -1 });
// `slug` is indexed by its own `unique: true`; declaring it again here would
// make Mongoose warn about a duplicate index.
scholarshipTestSchema.index({ createdBy: 1, createdAt: -1 });

export const ScholarshipTestModel = mongoose.model<ScholarshipTest>(
  "ScholarshipTest",
  scholarshipTestSchema,
);
