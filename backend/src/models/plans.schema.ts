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
          showHover: { 
            type: String, 
            required: false,
            maxlength: [1000, "Show hover text must not exceed 1000 characters"]
          },
          _id: false,
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
        startDate: {
          type: Date,
          required: false,
          default: null,
        },
        endDate: {
          type: Date,
          required: false,
          default: null,
        },
        isActive: {
          type: Boolean,
          required: true,
          default: true,
        },
      },
      required: false,
      _id: false,
    },
    isPopular: { type: Boolean, default: false, required: true },
    isActive: { type: Boolean, default: true, required: true },
    /** Success points granted to the buyer when this plan is purchased. */
    purchaseSuccessPoints: {
      type: Number,
      default: 0,
      min: 0,
      max: 1_000_000,
    },
    /** Max success points a buyer may redeem as a checkout discount for this plan. */
    maxSuccessPointsUsage: {
      type: Number,
      default: 0,
      min: 0,
      max: 1_000_000,
    },
  },
  { timestamps: true, _id: false }
);

export default planSchema;
