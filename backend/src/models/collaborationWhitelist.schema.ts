import mongoose, { Schema } from "mongoose";

const collaborationWhitelistSchema = new Schema(
  {
    /** Standalone import configuration (not CollaborationDomain). */
    partnershipImportConfigId: {
      type: Schema.Types.ObjectId,
      ref: "PartnershipImportConfig",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },
    studentName: { type: String, trim: true, maxlength: 200 },
    studentId: { type: String, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: [
        "pending",
        "queued",
        "enrolled",
        "benefit_applied",
        "failed",
        "expired",
      ],
      default: "pending",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    lastCheckedAt: { type: Date, default: null },
    nextCheckAt: { type: Date, default: null, index: true },
    lastError: { type: String, default: null },
    /** Course enrollment completed, or discount eligibility granted (completion time). */
    enrolledAt: { type: Date, default: null },
    jobId: { type: String, default: null, index: true },
    expiresAt: { type: Date, default: null },
    notes: { type: String, default: null, maxlength: 2000 },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

collaborationWhitelistSchema.index(
  { partnershipImportConfigId: 1, email: 1 },
  { unique: true }
);

collaborationWhitelistSchema.index({
  partnershipImportConfigId: 1,
  status: 1,
  isActive: 1,
  nextCheckAt: 1,
});

export const CollaborationWhitelistModel = mongoose.model(
  "CollaborationWhitelist",
  collaborationWhitelistSchema
);
