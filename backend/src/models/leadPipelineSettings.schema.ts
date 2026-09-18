import mongoose from "mongoose";

/**
 * The CRM pipeline the admin edits: the stages of the funnel and the
 * sub-statuses inside each one.
 *
 * Leads store `status` and `subStatus` as the `key` values from here, never the
 * labels, so renaming a stage or a sub-status never touches a lead. A key is
 * generated from the label once, on creation, and is immutable afterwards.
 *
 * Nothing is ever hard-deleted while leads may hold it: removing sets
 * `active: false`, which takes it out of the dropdowns an agent picks from
 * while leaving its label resolvable and its rows filterable.
 */

const subStatusSchema = new mongoose.Schema(
  {
    /** Immutable. What `lead.subStatus` stores. */
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    active: { type: Boolean, required: true, default: true },
    /** Exactly one across the whole pipeline. Stamps `convertedAt`. */
    isConversion: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const stageSchema = new mongoose.Schema(
  {
    /** Immutable. What `lead.status` stores. */
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    active: { type: Boolean, required: true, default: true },
    /**
     * Exactly one. Where a captured lead lands, and where a reset-on-reassign
     * sends it. Its first active sub-status completes the pair.
     */
    isDefault: { type: Boolean, required: true, default: false },
    subStatuses: { type: [subStatusSchema], default: [] },
  },
  { _id: false },
);

const leadPipelineSettingsSchema = new mongoose.Schema(
  {
    /** Singleton. One pipeline for both brands: the sales process is the same. */
    key: { type: String, required: true, unique: true, default: "global" },
    stages: { type: [stageSchema], default: [] },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

export const LeadPipelineSettingsModel = mongoose.model(
  "LeadPipelineSettings",
  leadPipelineSettingsSchema,
);
