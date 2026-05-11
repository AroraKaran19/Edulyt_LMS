import mongoose from "mongoose";
import { OfferLetterJob, OfferLetterJobStatus } from "../types/offerLetterJob";

const offerLetterJobSchema = new mongoose.Schema<OfferLetterJob>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    internshipEnrollmentId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    internId: {
      type: String,
      default: null,
    },
    offerLetterUrl: {
      type: String,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

offerLetterJobSchema.index({ status: 1, createdAt: 1 });

offerLetterJobSchema.index(
  { internshipEnrollmentId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "processing"] } },
  },
);

export const OfferLetterJobModel = mongoose.model<OfferLetterJob>(
  "OfferLetterJob",
  offerLetterJobSchema,
);
