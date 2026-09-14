import mongoose from "mongoose";
import { brandPlugin } from "./plugins/brand.plugin";
import { courseBrand } from "../services/productBrand.services";

/**
 * One learner's run through a CourseInternship, created by one course purchase.
 *
 * A learner who buys two courses sharing a program gets two enrollments and two
 * certificates — each traceable to the purchase that paid for it.
 *
 * Snapshots are frozen at enrollment so later edits to the program or course
 * never rewrite a certificate that has already been issued.
 */
const courseInternshipEnrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseInternship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseInternship",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    /**
     * The order that paid for it. Unique — this index, not application logic,
     * is what stops a replayed webhook creating a second enrollment.
     */
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    programSnapshot: {
      title: { type: String, default: "" },
      offerLetterDesignation: { type: String, default: "" },
    },
    courseSnapshot: {
      title: { type: String, default: "" },
    },

    /** Payment confirmation date. Drives every relative deadline. */
    startDate: { type: Date, required: true },
    durationMonths: { type: Number, required: true, min: 1 },
    /** startDate + durationMonths, stamped once and never recomputed. */
    endDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
      required: true,
    },

    documentation: {
      submittedAt: { type: Date },
      status: {
        type: String,
        enum: ["pending", "submitted", "approved", "rejected"],
        default: "pending",
      },
      files: [{ type: String, trim: true }],
    },
    documentationReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    documentationReviewedAt: { type: Date },
    documentationRejectionNote: { type: String, trim: true },

    internId: { type: String, trim: true, sparse: true },
    offerLetterUrl: { type: String, trim: true },
    offerLetterGeneratedAt: { type: Date },
    certificateUrl: { type: String, trim: true },
    certificateIssuedAt: { type: Date },

    termsAcceptedAt: { type: Date },
  },
  { timestamps: true },
);

// Dashboard list: a learner's enrollments, most recently touched first.
courseInternshipEnrollmentSchema.index({ user: 1, updatedAt: -1 });
// Admin views scoped to one program.
courseInternshipEnrollmentSchema.index({ courseInternship: 1, status: 1 });
courseInternshipEnrollmentSchema.plugin(brandPlugin, { derive: (doc) => courseBrand(doc.get("course")) });

export const CourseInternshipEnrollmentModel =
  mongoose.models.CourseInternshipEnrollment ||
  mongoose.model(
    "CourseInternshipEnrollment",
    courseInternshipEnrollmentSchema,
  );

export default CourseInternshipEnrollmentModel;
