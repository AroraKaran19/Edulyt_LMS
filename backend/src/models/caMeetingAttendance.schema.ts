import mongoose, { Schema } from "mongoose";
import type { CaMeetingAttendance } from "../types/caMeeting";

/** Existence of a row means absent. Only the lazy finalize pass writes these. */
const caMeetingAttendanceSchema = new Schema<CaMeetingAttendance>(
  {
    meeting: { type: Schema.Types.ObjectId, ref: "CaMeeting", required: true },
    application: { type: Schema.Types.ObjectId, ref: "CaApplication", required: true },
  },
  { timestamps: true },
);

caMeetingAttendanceSchema.index({ meeting: 1, application: 1 }, { unique: true });
caMeetingAttendanceSchema.index({ application: 1 });

export const CaMeetingAttendanceModel = mongoose.model<CaMeetingAttendance>(
  "CaMeetingAttendance",
  caMeetingAttendanceSchema,
);
