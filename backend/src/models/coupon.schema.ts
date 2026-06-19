import mongoose from "mongoose";
import { Coupon } from "../types";

const couponSchema = new mongoose.Schema<Coupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    discountType: {
      type: String,
      required: true,
      enum: ["percentage", "fixed"],
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Discount value must be positive"],
    },
    applicableType: {
      type: String,
      required: true,
      enum: ["all", "specific-courses", "specific-categories"],
    },
    applicableCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum purchase amount must be positive"],
    },
    maxDiscountAmount: {
      type: Number,
      min: [0, "Maximum discount amount must be positive"],
    },
    usageLimit: {
      type: Number,
      min: [1, "Usage limit must be at least 1"],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, "Usage count cannot be negative"],
    },
    userUsageLimit: {
      type: Number,
      default: 1,
      min: [1, "User usage limit must be at least 1"],
    },
    // IST instants (admin picks IST wall-clock). Validity is instant-based.
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ createdBy: 1 });
couponSchema.index({ applicableCourses: 1 });
couponSchema.index({ applicableCategories: 1 });

// Validation: validUntil must be after validFrom
couponSchema.pre("save", function (next) {
  if (this.validUntil <= this.validFrom) {
    next(new Error("Valid until date must be after valid from date"));
  }
  next();
});

// Validation: percentage discount cannot exceed 100
couponSchema.pre("save", function (next) {
  if (this.discountType === "percentage" && this.discountValue > 100) {
    next(new Error("Percentage discount cannot exceed 100"));
  }
  next();
});

export const CouponModel = mongoose.model<Coupon>("Coupon", couponSchema);

