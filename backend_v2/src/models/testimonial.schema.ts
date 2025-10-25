import mongoose, { Schema } from "mongoose";
import { Testimonial } from "../types/course";
import { validateLinkedinUrl } from "./validators";

const testimonialSchema = new Schema<Testimonial>(
  {
    name: { type: String, required: true },
    currentRole: { type: String, required: true },
    currentCompany: { type: String, required: true },
    linkedin: {
      type: String,
      required: true,
      validate: {
        validator: validateLinkedinUrl,
        message: "Linkedin must be a valid LinkedIn profile URL",
      },
    },
    pastRole: { type: String, required: true },
    pastCompany: { type: String, required: true },
    college: { type: String, required: true },
    verified: { type: Boolean, default: false },
    profileImage: { type: String, required: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient queries
testimonialSchema.index({ name: 1, currentCompany: 1 });
testimonialSchema.index({ verified: 1 });

const TestimonialModel = mongoose.model<Testimonial>(
  "Testimonial",
  testimonialSchema
);

export default TestimonialModel;
