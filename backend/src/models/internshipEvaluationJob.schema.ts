import mongoose from "mongoose";
import { InternshipEvaluationJob } from "../types/internshipEvaluationJob";

const internshipEvaluationJobSchema =
  new mongoose.Schema<InternshipEvaluationJob>(
    {
      jobId: { type: String, required: true, unique: true, index: true },
      internshipEnrollmentId: { type: String, required: true },
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
        index: true,
      },
      verdict: { type: String, enum: ["pass", "fail"], default: null },
      error: { type: String, default: null },
      retryCount: { type: Number, default: 0 },
      startedAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
    },
    { timestamps: true },
  );

internshipEvaluationJobSchema.index({ status: 1, createdAt: 1 });

// One ACTIVE job per enrollment. Partial (not sparse): completed/failed rows
// are excluded from the index, so an enrollment can legitimately be re-enqueued
// later without colliding with its own history.
internshipEvaluationJobSchema.index(
  { internshipEnrollmentId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "processing"] } },
  },
);

export const InternshipEvaluationJobModel =
  mongoose.model<InternshipEvaluationJob>(
    "InternshipEvaluationJob",
    internshipEvaluationJobSchema,
  );
