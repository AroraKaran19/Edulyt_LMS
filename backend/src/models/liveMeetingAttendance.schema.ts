import mongoose from "mongoose";

/**
 * Existence of a row implies the student was **absent** for the referenced
 * meeting. Created exclusively by the lazy finalize pass after both link
 * windows close — present students get no row.
 */
const internshipLiveMeetingAttendanceSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipLiveMeeting",
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

internshipLiveMeetingAttendanceSchema.index(
  { meeting: 1, user: 1 },
  { unique: true },
);
internshipLiveMeetingAttendanceSchema.index({ user: 1 });

export const InternshipLiveMeetingAttendanceModel = mongoose.model(
  "InternshipLiveMeetingAttendance",
  internshipLiveMeetingAttendanceSchema,
);
