import mongoose from "mongoose";
import { CertificateJob, CertificateJobStatus } from "../types/certificateJob";

const certificateJobSchema = new mongoose.Schema<CertificateJob>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    enrollmentId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    certificateId: {
      type: String,
      default: null,
    },
    certificateUrl: {
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
  }
);

// Index for efficient querying of pending jobs
certificateJobSchema.index({ status: 1, createdAt: 1 });
certificateJobSchema.index({ enrollmentId: 1, status: 1 });

// Partial unique index: only one pending/processing job per enrollment (prevents race condition)
certificateJobSchema.index(
  { enrollmentId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "processing"] } },
  }
);

export const CertificateJobModel = mongoose.model<CertificateJob>(
  "CertificateJob",
  certificateJobSchema
);

