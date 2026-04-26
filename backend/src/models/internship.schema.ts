import mongoose from "mongoose";
import { Internship, InternshipBatches } from "../types/internship";
import internshipBatchPlanSchema from "./internshipBatchPlan.schema";

const internshipBatchAnalyticsSchema = new mongoose.Schema(
  {
    totalRatings: { type: Number, default: 0, required: true },
    totalReviews: { type: Number, default: 0, required: true },
    totalEnrollments: { type: Number, default: 0, required: true },
    averageRating: { type: Number, default: 0, required: true },
  },
  { _id: false, timestamps: false },
);

const internshipAnalyticsSchema = new mongoose.Schema(
  {
    totalRatings: { type: Number, default: 0, required: true },
    totalReviews: { type: Number, default: 0, required: true },
    totalEnrollments: { type: Number, default: 0, required: true },
    averageRating: { type: Number, default: 0, required: true },
  },
  { _id: false, timestamps: false },
);

const defaultInternshipAnalytics = () => ({
  totalRatings: 0,
  totalReviews: 0,
  totalEnrollments: 0,
  averageRating: 0,
});

const batchSchema = new mongoose.Schema<InternshipBatches>(
  {
    name: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true,
    },
    applicationLastDate: {
      type: Date,
      required: [true, "Application last date is required"],
    },
    internshipStartDate: {
      type: Date,
      required: [true, "Internship start date is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      default: "active",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    reviews: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Review",
        },
      ],
      default: [],
    },
    analytics: {
      type: internshipBatchAnalyticsSchema,
      required: false,
      default: defaultInternshipAnalytics,
      _id: false,
    },
    plan: {
      type: internshipBatchPlanSchema,
      required: false,
      default: undefined,
    },
    /** Single entrance exam template for this cohort (examType = "entrance"). */
    entranceExamTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipExam",
      default: null,
    },
    /** Single certification exam template for this cohort (examType = "certification"). */
    certificationExamTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipExam",
      default: null,
    },
    /** Reusable task template ids for this cohort (see `InternshipTask` types). */
    taskTemplateIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  { _id: true, timestamps: true },
);

const internshipSchema = new mongoose.Schema<Internship>(
  {
    title: {
      type: String,
      required: [true, "Internship title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
    },
    description: {
      type: String,
      required: [true, "Internship description is required"],
      trim: true,
    },
    thumbnail: {
      type: String,
      required: [true, "Thumbnail is required"],
      trim: true,
    },
    certification: {
      type: Boolean,
      default: true,
      required: true,
    },
    brochure: {
      type: String,
      trim: true,
      default: "",
    },
    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      required: [true, "Mode is required"],
      default: "online",
    },
    perks: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        icon: { type: String, required: true, trim: true },
      },
    ],
    features: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        icon: { type: String, required: true, trim: true },
      },
    ],
    whyJoin: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        icon: { type: String, required: true, trim: true },
      },
    ],
    preRequisites: [
      {
        icon: { type: String, required: true, trim: true },
        title: { type: String, required: true, trim: true },
      },
    ],
    whoCanJoin: [
      {
        icon: { type: String, required: true, trim: true },
        title: { type: String, required: true, trim: true },
      },
    ],
    internshipJourney: [
      {
        title: { type: String, required: true, trim: true },
        items: [{ type: String, trim: true }],
      },
    ],
    batches: {
      type: [batchSchema],
      default: [],
    },
    testimonials: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Testimonial",
      },
    ],
    partnerColleges: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PartnerCollege",
        },
      ],
      validate: {
        validator: function (value: mongoose.Types.ObjectId[]) {
          return value.length <= 6;
        },
        message: "Maximum 6 partner colleges are allowed",
      },
      default: [],
    },
    faqs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FAQ",
      },
    ],
    mentors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    media: [
      {
        icon: { type: String, required: true, trim: true },
        content: { type: String, required: true, trim: true },
        title: { type: String, required: true, trim: true },
      },
    ],
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    headerList: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [200, "Header line must be at most 200 characters"],
        },
      ],
      default: [],
    },
    audience: {
      type: String,
      enum: ["college-students", "professionals"],
      required: [true, "Audience is required"],
      default: "college-students",
    },
    featured: {
      type: Boolean,
      default: false,
      required: true,
    },
    discount: {
      type: {
        discount: {
          type: String,
          required: false,
          default: "percentage",
          enum: ["percentage", "fixed"],
        },
        value: { type: Number, required: false, default: 0 },
        startTime: {
          type: String,
          required: false,
          default: null,
          validate: {
            validator: function (value: string) {
              if (!value) return true;
              const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
              return timeRegex.test(value);
            },
            message:
              "Start time must be in HH:mm format (e.g., 12:00 for 12 AM, 23:00 for 11 PM)",
          },
        },
        endTime: {
          type: String,
          required: false,
          default: null,
          validate: {
            validator: function (value: string) {
              if (!value) return true;
              const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
              return timeRegex.test(value);
            },
            message:
              "End time must be in HH:mm format (e.g., 12:00 for 12 AM, 23:00 for 11 PM)",
          },
        },
        isActive: { type: Boolean, required: false, default: true },
      },
      required: false,
      default: null,
      _id: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    analytics: {
      type: internshipAnalyticsSchema,
      required: false,
      default: defaultInternshipAnalytics,
      _id: false,
    },
  },
  { timestamps: true },
);

// Indexes
internshipSchema.index({ slug: 1 });
internshipSchema.index({ title: 1 });
internshipSchema.index({ isActive: 1 });
internshipSchema.index({ audience: 1 });
internshipSchema.index({ featured: 1, isActive: 1 });
internshipSchema.index({ createdAt: -1 });
internshipSchema.index({ updatedAt: -1 });
internshipSchema.index({ "batches.status": 1 });
internshipSchema.index({ "batches.internshipStartDate": 1 });

export const InternshipModel = mongoose.model<Internship>(
  "Internship",
  internshipSchema,
);
