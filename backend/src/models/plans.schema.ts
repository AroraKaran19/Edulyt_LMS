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
        displayTime: { 
          type: String, 
          required: false,
          validate: {
            validator: function(value: string) {
              if (!value) return true; // Allow empty/null
              // Validate hh:mm:ss format
              const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
              return timeRegex.test(value);
            },
            message: "Display time must be in hh:mm:ss format (e.g., 14:30:00)"
          }
        },
        resetAfter: { 
          type: Number, 
          required: false,
          min: [0, "Reset after must be a positive number"]
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
