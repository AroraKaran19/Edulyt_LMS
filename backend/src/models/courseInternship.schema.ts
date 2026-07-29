import mongoose from "mongoose";

/**
 * An internship program sold as an add-on to one or more courses.
 *
 * Deliberately NOT the same model as `Internship`: no batches, no cohorts, no
 * exams. Each learner runs their own window from their purchase date, so every
 * date here is an offset in days rather than a calendar date.
 */
const courseInternshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    thumbnail: { type: String, default: "", trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    mentors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    perks: [{ type: String, trim: true }],
    whatYouWillDo: [{ type: String, trim: true }],

    /** Templates from the shared library at /admin/internships/tasks. */
    taskTemplateIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "InternshipTask" },
    ],

    documentationRequired: { type: Boolean, default: true },
    documentationDueOffsetDays: { type: Number, default: 7, min: 0 },

    offerLetterDesignation: { type: String, default: "", trim: true },
    whatsappGroupLink: { type: String, default: "", trim: true },

    /**
     * Derived mirror of `courses.internshipOffer.programId`. Written only by the
     * course save path so an admin never maintains the link in two places.
     */
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

courseInternshipSchema.index({ isActive: 1, updatedAt: -1 });
courseInternshipSchema.index({ title: 1 });

export const CourseInternshipModel =
  mongoose.models.CourseInternship ||
  mongoose.model("CourseInternship", courseInternshipSchema);

export default CourseInternshipModel;
