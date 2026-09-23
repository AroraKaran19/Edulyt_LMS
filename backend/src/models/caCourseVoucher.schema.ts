import mongoose, { Schema } from "mongoose";
import { brandPlugin } from "./plugins/brand.plugin";

const actorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, default: "" },
  },
  { _id: false },
);

export interface CaCourseVoucherActor {
  userId: mongoose.Types.ObjectId;
  name: string;
}

export type CaCourseVoucherStatus = "pending" | "approved" | "declined" | "revoked";
export type CaCourseVoucherPlan = "elite" | "essential";

export interface CaCourseVoucher {
  _id: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  /** Snapshot of the course title at request time. */
  courseTitle: string;
  plan: CaCourseVoucherPlan;
  status: CaCourseVoucherStatus;
  /** True while pending or approved: the applicationId's live voucher, if any. */
  active: boolean;
  requestedAt: Date;
  decidedAt: Date | null;
  decidedBy: CaCourseVoucherActor | null;
  declineReason: string | null;
  enrollmentId: mongoose.Types.ObjectId | null;
  revokedAt: Date | null;
  revokedBy: CaCourseVoucherActor | null;
  createdAt: Date;
  updatedAt: Date;
}

const caCourseVoucherSchema = new Schema<CaCourseVoucher>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: "CaApplication", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    courseTitle: { type: String, required: true },
    plan: { type: String, enum: ["elite", "essential"], required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "revoked"],
      required: true,
      default: "pending",
    },
    active: { type: Boolean, required: true, default: true },
    requestedAt: { type: Date, required: true, default: Date.now },
    decidedAt: { type: Date, default: null },
    decidedBy: { type: actorSchema, default: null },
    declineReason: { type: String, maxlength: 300, default: null },
    enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment", default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: actorSchema, default: null },
  },
  { timestamps: true },
);

caCourseVoucherSchema.plugin(brandPlugin, { fixed: "airkrit" });

// One live (pending or approved) voucher per CA, even under concurrent requests.
caCourseVoucherSchema.index(
  { applicationId: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);
caCourseVoucherSchema.index({ status: 1, createdAt: -1 });
caCourseVoucherSchema.index({ userId: 1, createdAt: -1 });

export const CaCourseVoucherModel = mongoose.model<CaCourseVoucher>(
  "CaCourseVoucher",
  caCourseVoucherSchema,
);
