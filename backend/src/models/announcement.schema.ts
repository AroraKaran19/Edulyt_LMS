import mongoose from "mongoose";
import { Announcement } from "../types";

const announcementSchema = new mongoose.Schema<Announcement>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    audience: {
      type: String,
      required: true,
      enum: ["course", "internship", "partner"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true },
);

// Dashboards query the newest announcement per audience.
announcementSchema.index({ audience: 1, createdAt: -1 });

export const AnnouncementModel = mongoose.model<Announcement>(
  "Announcement",
  announcementSchema,
);
