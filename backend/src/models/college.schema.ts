import mongoose from "mongoose";
import { College } from "../types/college";

const collegeSchema = new mongoose.Schema<College>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      minlength: [1, "Location cannot be empty"],
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

collegeSchema.index({ name: 1 });
collegeSchema.index({ isActive: 1 });
collegeSchema.index({ createdAt: -1 });

export const CollegeModel = mongoose.model<College>("College", collegeSchema);
