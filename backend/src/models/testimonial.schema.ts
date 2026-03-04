import mongoose, { Schema } from "mongoose";
import { Testimonial } from "../types/course";
import { validateLinkedinUrl, validateUrl } from "./validators";

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
    collegeUrl: {
      type: String,
      required: false,
      validate: {
        validator: function (value: string) {
          return !value || validateUrl(value);
        },
        message: "College URL must be a valid URL",
      },
    },
    collegeProfileUrl: {
      type: String,
      required: false,
      validate: {
        validator: function (value: string) {
          return !value || validateUrl(value);
        },
        message: "College Profile URL must be a valid URL",
      },
    },
    companyUrl: {
      type: String,
      required: false,
      validate: {
        validator: function (value: string) {
          return !value || validateUrl(value);
        },
        message: "Company URL must be a valid URL",
      },
    },
    companyProfileUrl: {
      type: String,
      required: false,
      validate: {
        validator: function (value: string) {
          return !value || validateUrl(value);
        },
        message: "Company Profile URL must be a valid URL",
      },
    },
    verified: { type: Boolean, default: false },
    profileImage: { type: String, required: false },
    category: {
      type: String,
      required: false,
      enum: ["college-students", "professionals", "internships"],
    },
    feedback: { type: String, required: false },
    heading2: { type: String, required: false },
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
