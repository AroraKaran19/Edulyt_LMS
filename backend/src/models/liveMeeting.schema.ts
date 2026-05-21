import mongoose from "mongoose";
import { validateUrl } from "./validators";

const liveMeetingLinkSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, trim: true },
    expiryMins: {
      type: Number,
      required: true,
      min: [1, "expiryMins must be at least 1"],
    },
    activatedAt: { type: Date, default: null },
    clickedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  { _id: false },
);

const internshipLiveMeetingSchema = new mongoose.Schema(
  {
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
    },
    /** Embedded batch id from `internship.batches[n]._id`. */
    batchId: { type: String, required: true, trim: true },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "Name is required"],
      maxlength: [200, "Name must not exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description must not exceed 2000 characters"],
    },
    meetingLink: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) => validateUrl(v),
        message: "Meeting link must be a valid URL (http:// or https://)",
      },
    },
    /** Optional link to the recorded session, set after the meeting. */
    recordingLink: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (v: string) => !v || validateUrl(v),
        message: "Recording link must be a valid URL (http:// or https://)",
      },
    },

    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, default: null },

    link1: { type: liveMeetingLinkSchema, required: true },
    link2: { type: liveMeetingLinkSchema, required: true },

    finalizedAt: { type: Date, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

internshipLiveMeetingSchema.pre("save", function (next) {
  if (this.endDateTime && this.endDateTime <= this.startDateTime) {
    return next(new Error("endDateTime must be after startDateTime"));
  }
  next();
});

internshipLiveMeetingSchema.index({
  internship: 1,
  batchId: 1,
  startDateTime: -1,
});
internshipLiveMeetingSchema.index({ "link1.token": 1 }, { unique: true });
internshipLiveMeetingSchema.index({ "link2.token": 1 }, { unique: true });

export const InternshipLiveMeetingModel = mongoose.model(
  "InternshipLiveMeeting",
  internshipLiveMeetingSchema,
);
