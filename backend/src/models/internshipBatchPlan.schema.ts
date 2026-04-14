import mongoose from "mongoose";

/** Embedded per-batch pricing (no elite/essential `type`; matches frontend `InternshipBatchPlan`). */
const featureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    provided: { type: Boolean, required: true },
    showHover: {
      type: String,
      required: false,
      maxlength: [1000, "Show hover text must not exceed 1000 characters"],
    },
  },
  { _id: false },
);

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
    title: { type: String, required: true, default: "", trim: true },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Price must be positive"],
    },
    features: {
      type: [featureSchema],
      required: true,
      default: () => [{ title: "", provided: true, showHover: "" }],
    },
    discount: { type: planDiscountSchema, required: false },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: false, timestamps: false },
);

export default internshipBatchPlanSchema;
