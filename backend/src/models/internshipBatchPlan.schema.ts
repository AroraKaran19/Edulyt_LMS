import mongoose from "mongoose";

/** Embedded per-batch pricing (no title / features). */

const planDiscountSchema = new mongoose.Schema(
  {
    discount: {
      type: String,
      required: true,
      enum: ["percentage", "fixed"],
    },
    value: {
      type: Number,
      required: true,
      min: [0, "Discount value must be positive"],
      max: [100, "Discount value cannot exceed 100"],
    },
    startDate: { type: Date, required: false, default: null },
    endDate: { type: Date, required: false, default: null },
    isActive: { type: Boolean, required: true, default: true },
  },
  { _id: false },
);

const internshipBatchPlanSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Price must be positive"],
    },
    discount: { type: planDiscountSchema, required: false },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: false, timestamps: false },
);

export default internshipBatchPlanSchema;
