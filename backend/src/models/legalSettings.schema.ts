import mongoose from "mongoose";

/**
 * Singleton document holding admin-managed legal documents (Terms &
 * Conditions) shown to learners at course checkout and internship enrollment.
 * Stores the public URL plus the S3 key (when uploaded) so a replacement can
 * clean up the previous object.
 */
const legalSettingsSchema = new mongoose.Schema(
  {
    /** Fixed id so we only ever have one row */
    key: { type: String, required: true, unique: true, default: "global" },

    /** Terms & Conditions document shown at course checkout. */
    courseTermsUrl: { type: String, default: "", trim: true },
    courseTermsS3Key: { type: String, default: "", trim: true },

    /** Terms & Conditions document shown at internship enrollment. */
    internshipTermsUrl: { type: String, default: "", trim: true },
    internshipTermsS3Key: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export const LegalSettingsModel = mongoose.model(
  "LegalSettings",
  legalSettingsSchema,
);
