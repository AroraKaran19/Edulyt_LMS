import mongoose, { Schema } from "mongoose";
import { validateUrl } from "./validators";
import type { CaMeeting } from "../types/caMeeting";

const linkSchema = new Schema(
  {
    token: { type: String, required: true, trim: true },
    expiryMins: { type: Number, required: true, min: 1 },
    activatedAt: { type: Date, default: null },
    clickedBy: { type: [{ type: Schema.Types.ObjectId, ref: "CaApplication" }], default: [] },
  },
  { _id: false },
);

const overrideSchema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: "CaApplication", required: true },
    verdict: { type: String, enum: ["present", "absent"], required: true },
    setBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    setAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const caMeetingSchema = new Schema<CaMeeting>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
    meetingLink: {
      type: String,
      required: true,
      trim: true,
      validate: { validator: (v: string) => validateUrl(v), message: "Meeting link must be a valid URL" },
    },
    recordingLink: {
      type: String,
      trim: true,
      default: "",
      validate: { validator: (v: string) => !v || validateUrl(v), message: "Recording link must be a valid URL" },
    },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, default: null },
    successPoints: { type: Number, default: 0, min: 0, max: 1_000_000 },
    link1: { type: linkSchema, required: true },
    link2: { type: linkSchema, required: true },
    manualOverrides: { type: [overrideSchema], default: [] },
    finalizedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

caMeetingSchema.index({ startDateTime: -1 });
caMeetingSchema.index({ "link1.token": 1 }, { unique: true });
caMeetingSchema.index({ "link2.token": 1 }, { unique: true });

export const CaMeetingModel = mongoose.model<CaMeeting>("CaMeeting", caMeetingSchema);
