import mongoose from "mongoose";

/**
 * One row per staff role change, and the permanent record of what it destroyed.
 *
 * Promoting a learner to staff deletes their entire learner footprint, which is
 * irreversible, so this document is deliberately the audit trail rather than a
 * queue entry that gets tidied away: it keeps the deleted ids and a snapshot of
 * who was changed, by whom, and when. Without it a mistaken promotion would be
 * untraceable, since the rows it removed are the only other evidence.
 *
 * Nothing prunes these.
 */

const userSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true },
  },
  { _id: false },
);

/**
 * What was removed from one collection. Ids are kept, capped, so a deletion can
 * be traced back to specific rows in a backup rather than only counted.
 *
 * `collectionName`, not `collection`: the latter is a reserved property on a
 * Mongoose document (the driver's Collection handle), so a path of that name
 * shadows it on any hydrated subdocument. Rows written before this rename hold
 * the old key until `rename-role-change-job-collection-key` runs.
 */
const removedSetSchema = new mongoose.Schema(
  {
    collectionName: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    ids: { type: [String], default: [] },
    /** True when `count` exceeded the id cap, so `ids` is a sample. */
    truncated: { type: Boolean, default: false },
  },
  { _id: false },
);

const roleChangeJobSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** Frozen: the account may be deleted long after this job ran. */
    user: { type: userSnapshotSchema, default: () => ({}) },

    direction: {
      type: String,
      required: true,
      enum: ["to-staff", "to-student"],
    },
    fromUserType: { type: String, required: true },
    toUserType: { type: String, required: true },

    requestedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    requestedBy: { type: userSnapshotSchema, default: () => ({}) },

    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    attempts: { type: Number, default: 0, min: 0 },
    error: { type: String, default: null },
    processedAt: { type: Date, default: null },

    /** The manifest. Empty on a `to-student` job, which deletes nothing. */
    removed: { type: [removedSetSchema], default: [] },
    /** Plain-language note of what the direction did, for the audit reader. */
    summary: { type: String, default: "" },
  },
  { timestamps: true },
);

// The worker's claim query.
roleChangeJobSchema.index({ status: 1, createdAt: 1 });
// "What happened to this account, and when" for an audit reader.
roleChangeJobSchema.index({ userId: 1, createdAt: -1 });

export const RoleChangeJobModel = mongoose.model(
  "RoleChangeJob",
  roleChangeJobSchema,
);
