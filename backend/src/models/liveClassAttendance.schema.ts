import mongoose from "mongoose";

/**
 * Existence of a row implies the student was **absent** for the referenced
 * live class. Created by the lazy finalize pass after both link windows close —
 * present students get no row.
 *
 * Admin overrides do NOT live here; they are embedded on the live class as
 * `manualOverrides`. Post-finalize, the override handler keeps this collection
 * in step: it deletes the row when a learner is forced present and upserts one
 * when they are forced absent.
 */
const liveClassAttendanceSchema = new mongoose.Schema(
  {
    liveClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveClass",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

liveClassAttendanceSchema.index({ liveClass: 1, user: 1 }, { unique: true });
liveClassAttendanceSchema.index({ user: 1 });

export const LiveClassAttendanceModel = mongoose.model(
  "LiveClassAttendance",
  liveClassAttendanceSchema,
);

export default LiveClassAttendanceModel;
