import mongoose from "mongoose";
import { College } from "../types/college";
import { INDIAN_STATES } from "../constants/indianStates";

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
    /**
     * Filterable counterpart to the free-text `location`. Optional, not
     * required: a handful of legacy rows carry only a city, and a required
     * enum would make every later edit of those rows fail `runValidators`.
     */
    state: {
      type: String,
      enum: INDIAN_STATES,
      trim: true,
      required: false,
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
// Serves "colleges in state X, sorted by name", the shape the pickers use.
collegeSchema.index({ state: 1, name: 1 });

export const CollegeModel = mongoose.model<College>("College", collegeSchema);
