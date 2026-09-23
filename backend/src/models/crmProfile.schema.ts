import mongoose from "mongoose";
import { CrmProfile } from "../types/crm";

/**
 * `options` applies only when `type` is "select". Ambassadors never get a
 * question; that is enforced in the service, not here, because the schema
 * cannot see which userType is being written.
 */
const crmExtraQuestionSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, required: true, default: false },
    key: { type: String, required: true, trim: true, maxlength: 60 },
    label: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      required: true,
      enum: ["text", "select"],
      default: "text",
    },
    options: { type: [String], default: [] },
    required: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const crmProfileSchema = new mongoose.Schema<CrmProfile>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    /**
     * Optional by design. A marketer can hold a question with no code, because
     * `PATCH /crm/me/question` gates only on userType, so requiring one here
     * would force that endpoint to mint a code as a side effect.
     */
    code: {
      type: String,
      required: false,
      default: null,
      uppercase: true,
      trim: true,
    },
    codeActive: { type: Boolean, required: false, default: true },
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    ambassadorKind: {
      type: String,
      required: false,
      enum: ["marketing", "social-media"],
    },
    extraQuestions: { type: [crmExtraQuestionSchema], default: [] },
    /**
     * Set by a marketer or sales person. Their ambassadors may add questions of
     * their own only while this is on; otherwise an ambassador's link shows
     * this owner's questions instead.
     */
    allowAmbassadorQuestions: {
      type: Boolean,
      required: false,
      default: false,
    },
    /** This member's own link. */
    hidePlanPrices: { type: Boolean, required: false, default: false },
    /**
     * This owner's ambassadors' links, set by the owner. An ambassador never
     * sets their own: `resolveCrmCode` reads this from their parent, so
     * re-homing them switches the setting with no fan-out.
     */
    hideAmbassadorPlanPrices: {
      type: Boolean,
      required: false,
      default: false,
    },
    /** This member's own link. Validated against `createdBy` on write. */
    scholarshipTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScholarshipTest",
      required: false,
      default: null,
    },
    /**
     * This owner's ambassadors' links. Read from the parent at resolve time,
     * like `hideAmbassadorPlanPrices`, so re-homing an ambassador switches
     * their campaign with no fan-out.
     */
    ambassadorScholarshipTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScholarshipTest",
      required: false,
      default: null,
    },
  },
  { timestamps: true },
);

crmProfileSchema.index({ userId: 1 }, { unique: true });
// Partial, mirroring the index this replaces on `User.crmCode`: a codeless
// profile is legal, and every one of them would collide on null under a plain
// unique index.
crmProfileSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: "string" } } },
);
// Serves the ambassador roster and the per-owner ambassador count.
crmProfileSchema.index(
  { parentUserId: 1 },
  { partialFilterExpression: { parentUserId: { $type: "objectId" } } },
);

export const CrmProfileModel = mongoose.model<CrmProfile>(
  "CrmProfile",
  crmProfileSchema,
);
