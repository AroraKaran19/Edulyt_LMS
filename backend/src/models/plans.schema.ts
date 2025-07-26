import mongoose from "mongoose";
import { Plan } from "../types";

// ===================
// Plan Schema
// ===================

const planSchema = new mongoose.Schema<Plan>(
  {
    title: { type: String, required: true },
    type: { type: String, required: true, enum: ["elite", "essential"] },
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be positive"],
    },
    features: {
      type: [
        {
          title: { type: String, required: true },
          provided: { type: Boolean, required: true },
        },
      ],
      required: true,
    },
    discount: {
      type: {
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
      },
      required: false,
    },
    isPopular: { type: Boolean, default: false, required: true },
    billingPeriod: {
      type: String,
      enum: ["monthly", "annually", "lifetime"],
      required: false,
    },
    trialDays: {
      type: Number,
      required: false,
      min: [0, "Trial days must be positive"],
      max: [365, "Trial days cannot exceed 365"],
    },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true, _id: false } // _id: false for embedded sub-documents
);

export default planSchema;
