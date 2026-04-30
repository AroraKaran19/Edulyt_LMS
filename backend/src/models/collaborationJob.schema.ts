import mongoose from "mongoose";

const collaborationDomainSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    domain: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const partnershipImportConfigSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
  },
  { _id: false }
);

const collaborationUserSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
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
    /** Email-domain collaboration (optional if partnershipImportConfigId is set). */
    collaborationDomainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollaborationDomain",
      required: false,
      index: true,
      default: null,
    },
    /** CSV / manual import partnership (optional if collaborationDomainId is set). */
    partnershipImportConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnershipImportConfig",
      required: false,
      index: true,
      default: null,
    },
    collaborationDomainSnapshot: {
      type: collaborationDomainSnapshotSchema,
      required: false,
    },
    partnershipImportConfigSnapshot: {
      type: partnershipImportConfigSnapshotSchema,
      required: false,
    },
    userSnapshot: {
      type: collaborationUserSnapshotSchema,
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
    partialFilterExpression: {
      status: { $in: ["pending", "processing"] },
      collaborationDomainId: { $exists: true, $ne: null },
    },
  }
);

collaborationJobSchema.index(
  { userId: 1, partnershipImportConfigId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "processing"] },
      partnershipImportConfigId: { $exists: true, $ne: null },
    },
  }
);

export const CollaborationJobModel = mongoose.model(
  "CollaborationJob",
  collaborationJobSchema
);
