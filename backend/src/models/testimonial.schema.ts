import mongoose, { Schema } from "mongoose";
import { Testimonial } from "../types/course";

const testimonialSchema = new Schema<Testimonial>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    currentRole: {
      type: String,
      required: [true, "Current role is required"],
      trim: true,
    },
    currentCompany: {
      type: String,
      required: [true, "Current company is required"],
      trim: true,
    },
    linkedin: {
      type: String,
      required: [true, "LinkedIn profile is required"],
      trim: true,
    },
    pastRole: {
      type: String,
      required: [true, "Past role is required"],
      trim: true,
    },
    pastCompany: {
      type: String,
      required: [true, "Past company is required"],
      trim: true,
    },
    college: {
      type: String,
      required: [true, "College is required"],
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      required: [true, "Profile image is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient queries
testimonialSchema.index({ reviewableType: 1, reviewableId: 1 });
testimonialSchema.index({ verified: 1 });

const TestimonialModel = mongoose.model<Testimonial>("Testimonial", testimonialSchema);

export default TestimonialModel;
