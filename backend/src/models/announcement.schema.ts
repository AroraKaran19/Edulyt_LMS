import mongoose from "mongoose";
import { Announcement } from "../types";
import { brandPlugin } from "./plugins/brand.plugin";

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
// An internship announcement is Edulyt's. A course one can be either, so the
// admin picks and legacy rows fall back to Airkrit.
announcementSchema.plugin(brandPlugin, {
  derive: (doc) =>
    doc.get("audience") === "internship" ? "edulyt" : "airkrit",
});
announcementSchema.index({ brand: 1, audience: 1, createdAt: -1 });

export const AnnouncementModel = mongoose.model<Announcement>(
  "Announcement",
  announcementSchema,
);
