import mongoose from "mongoose";
import { PartnerCollege, StudentProfile } from "../types/partner-college";

const studentProfileSchema = new mongoose.Schema<StudentProfile>(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true, default: "" },
  },
  { _id: false, timestamps: false }
);

const partnerCollegeSchema = new mongoose.Schema<PartnerCollege>(
  {
    name: {
      type: String,
      required: [true, "Partner college name is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Partner college image is required"],
      trim: true,
    },
    website: {
      type: String,
      required: [true, "Partner college website is required"],
      trim: true,
    },
    internshipStudents: {
      count: { type: Number, default: 0, required: true },
      students: {
        type: [studentProfileSchema],
        default: [],
      },
    },
    coursesEnrollment: {
      count: { type: Number, default: 0, required: true },
      students: {
        type: [studentProfileSchema],
        default: [],
      },
    },
  },
  { timestamps: true }
);

// Indexes
partnerCollegeSchema.index({ name: 1 });
partnerCollegeSchema.index({ createdAt: -1 });

export const PartnerCollegeModel = mongoose.model<PartnerCollege>(
  "PartnerCollege",
  partnerCollegeSchema
);
