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
        },
        endDate: {
          type: Date,
          required: false,
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
  },
  { timestamps: true, _id: false }
);

export default planSchema;
