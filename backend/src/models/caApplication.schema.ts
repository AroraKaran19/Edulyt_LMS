import mongoose, { Schema } from "mongoose";
import { brandPlugin } from "./plugins/brand.plugin";
import type { CaApplication } from "../types/caApplication";

const cipherFields = {
  enc: { type: String, required: true },
  iv: { type: String, required: true },
  tag: { type: String, required: true },
};

const payoutSchema = new Schema(
  { method: { type: String, enum: ["upi", "details"], required: true }, ...cipherFields },
  { _id: false },
);

const addressSchema = new Schema(
  {
    line: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    country: { type: String, default: "" },
  },
  { _id: false },
);

const actorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, default: "" },
  },
  { _id: false },
);

const referrerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    code: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  { _id: false },
);

const documentRefSchema = new Schema(
  {
    url: { type: String, required: true },
    generatedAt: { type: Date, required: true },
    verificationUrl: { type: String, default: "" },
  },
  { _id: false },
);

const documentsSchema = new Schema(
  {
    offerLetter: { type: documentRefSchema, default: null },
    lor: { type: documentRefSchema, default: null },
    internshipCertificate: { type: documentRefSchema, default: null },
    trainingCertificate: { type: documentRefSchema, default: null },
  },
  { _id: false },
);

const completionSchema = new Schema(
  {
    hold: { type: Boolean, default: false },
    heldBy: { type: actorSchema, default: null },
    heldAt: { type: Date, default: null },
    queuedAt: { type: Date, default: null },
    skippedAt: { type: Date, default: null },
    issuedAt: { type: Date, default: null },
    outcome: { type: String, enum: ["eligible", "not-eligible"], default: null },
    forcePassed: { type: Boolean, default: false },
  },
  { _id: false },
);

const emailMarkersSchema = new Schema(
  {
    approvedAt: { type: Date, default: null },
    completionAt: { type: Date, default: null },
    notEligibleAt: { type: Date, default: null },
  },
  { _id: false },
);

const caApplicationSchema = new Schema<CaApplication>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    submittedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    collegeId: { type: Schema.Types.ObjectId, ref: "College", default: null },
    collegeName: { type: String, default: "" },
    careerStage: { type: String, default: "" },
    degree: { type: String, default: "" },
    collegeEmail: { type: String, default: "" },
    languages: { type: [String], default: [] },
    whatsappJoined: { type: Boolean, default: false },
    payout: { type: payoutSchema, default: null },
    address: { type: addressSchema, default: null },
    joiningDate: { type: Date, default: null },
    durationMonths: { type: Number, required: true, min: 1, max: 6 },
    endDate: { type: Date, default: null },
    caPoints: { type: Number, default: 0, min: 0 },
    referrer: { type: referrerSchema, default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "attached"],
      required: true,
      default: "pending",
    },
    open: { type: Boolean, default: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    ownerName: { type: String, default: "" },
    kind: { type: String, enum: ["marketing", "social-media"], default: null },
    decidedBy: { type: actorSchema, default: null },
    decidedAt: { type: Date, default: null },
    attachedAt: { type: Date, default: null },
    attachIssue: { type: String, enum: ["not-student", "other-owner"], default: null },
    attachCheckedAt: { type: Date, default: null },
    internId: { type: String, default: null },
    documents: { type: documentsSchema, default: () => ({}) },
    completion: { type: completionSchema, default: () => ({}) },
    emails: { type: emailMarkersSchema, default: () => ({}) },
    // Created by scripts/migrate-existing-cas.ts for ambassadors added before applications existed.
    migrated: { type: Boolean, default: false },
  },
  { timestamps: true },
);

caApplicationSchema.plugin(brandPlugin, { fixed: "airkrit" });

// Partial on `open`: a decline deletes the row and an attach unsets the flag,
// and either one frees the person to apply again.
caApplicationSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { open: true } });
caApplicationSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { open: true } });
caApplicationSchema.index({ status: 1, createdAt: -1 });
caApplicationSchema.index({ "referrer.userId": 1, status: 1, createdAt: -1 });
caApplicationSchema.index({ userId: 1, status: 1 });
caApplicationSchema.index({ status: 1, attachCheckedAt: 1 });
caApplicationSchema.index(
  { internId: 1 },
  { unique: true, partialFilterExpression: { internId: { $type: "string" } } },
);
// Leading equality on the three completion markers (all null for an unfinished
// row) lands the completion sweep's scan on unfinished CAs only, instead of
// growing with every alumnus ever attached; `endDate` still serves the range
// and the sort. `completion.hold` stays a residual post-fetch filter.
caApplicationSchema.index({
  status: 1,
  "completion.issuedAt": 1,
  "completion.queuedAt": 1,
  "completion.skippedAt": 1,
  endDate: 1,
});
caApplicationSchema.index({ ownerUserId: 1, status: 1 });

export const CaApplicationModel = mongoose.model<CaApplication>(
  "CaApplication",
  caApplicationSchema,
);
