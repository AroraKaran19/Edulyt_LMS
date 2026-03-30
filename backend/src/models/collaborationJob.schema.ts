import mongoose from "mongoose";

const collaborationDomainSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    domain: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const collaborationJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collaborationDomainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollaborationDomain",
      required: true,
      index: true,
    },
    /** Stored when the job is created (survives if the domain document is removed). */
    collaborationDomainSnapshot: {
      type: collaborationDomainSnapshotSchema,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    error: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

collaborationJobSchema.index({ status: 1, createdAt: 1 });

collaborationJobSchema.index(
  { userId: 1, collaborationDomainId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "processing"] } },
  }
);

export const CollaborationJobModel = mongoose.model(
  "CollaborationJob",
  collaborationJobSchema
);
