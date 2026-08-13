import mongoose from "mongoose";
import { Lead } from "@/types/lead";

// ===================
// Lead Schema
// ===================

const leadAnswerSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema<Lead>(
  {
    source: {
      type: String,
      required: true,
      enum: ["enquiry-form"],
      default: "enquiry-form",
    },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },

    answers: { type: [leadAnswerSchema], default: [] },

    /** `null` means not resolved yet, distinct from `false`. */
    emailOnPlatform: { type: Boolean, default: null },
    emailCheckedAt: { type: Date, required: false },
    platformUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    submittedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    status: {
      type: String,
      required: true,
      enum: ["new", "contacted", "qualified", "converted", "lost"],
      default: "new",
    },
    note: { type: String, required: false, trim: true },

    pageQuery: { type: String, required: false },
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ source: 1, createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });
// Lets the staleness sweep find unresolved rows without a collection scan.
leadSchema.index({ emailCheckedAt: 1 });

export const LeadModel = mongoose.model<Lead>("Lead", leadSchema);
