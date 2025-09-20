import mongoose from "mongoose";
import { Course } from "../types";
import plansSchema from "./plans.schema";
import {
  validateAudience,
  validatePlans,
  validateUrl,
} from "./validators";

// ===================
// Highlights Schema
// ===================

const highlightSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { 
      type: String, 
      required: true, 
    },
  },
  { _id: false }
);

// ===================
// Analytics Schema
// ===================

const analyticsSchema = new mongoose.Schema(
  {
    totalRatings: { type: Number, default: 0, required: true },
    totalEnrollments: { type: Number, default: 0, required: true },
    activeEnrollments: { type: Number, default: 0, required: true },
    completionRate: { type: Number, default: 0, required: true },
    averageRating: { type: Number, default: 0, required: true },
    averageCompletionTime: { type: Number, default: 0, required: true },
    dropoffPoints: {
      type: [
        {
          moduleId: { type: String, required: true },
          lessonId: { type: String, required: true },
          dropoffRate: { type: Number, default: 0, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: false, _id: false }
);

// ===================
// Course Schema
// ===================

const courseSchema = new mongoose.Schema<Course>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 25,
      maxlength: 1000,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      required: true,
      validate: {
        validator: validateUrl,
        message: "Thumbnail must be a valid URL",
      },
    },
    previewVideoUrl: { type: String, required: false, default: "" },
    isFeatured: { type: Boolean, default: false, required: true },
    isCertified: { type: Boolean, default: false, required: true },
    whatYouWillLearn: { type: String, required: true },
    skills: { type: [String], required: true },
    highlights: {
      type: [highlightSchema],
      required: true,
      default: [],
    },
    features: { type: [String], required: false, default: [] }, // need to remove
    careerPaths: { type: [String], required: true },
    skillLevel: { type: String, required: true },
    whoShouldJoin: { type: String, required: true },
    prerequisites: { type: [String], required: false, default: [] },

    duration: {
      type: String,
      required: true,
      min: [1, "Duration must be positive"],
    },
    modules: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: "CourseModule",
      default: [],
    },
    instructor: {
      type: [mongoose.Schema.Types.ObjectId],
      required: false,
      default: [],
      ref: "User",
    },
    plans: {
      type: {
        elite: { type: plansSchema, required: false, default: null },
        essential: { type: plansSchema, required: false, default: null },
      },
      required: true,
      validate: {
        validator: validatePlans,
        message: "Course must have at least one plan (elite or essential)",
      },
      _id: false,
    },
    discount: {
      type: {
        startDate: { type: Date, required: false, default: null },
        endDate: { type: Date, required: false, default: null },
        value: { type: Number, required: false, default: 0 },
        discount: {
          type: String,
          required: false,
          default: "percentage",
          enum: ["percentage", "fixed"],
        },
        isActive: { type: Boolean, required: false, default: true },
      },
      required: false,
      default: null,
    },
    reviews: {
      type: [mongoose.Schema.Types.ObjectId],
      required: false,
      default: [],
      ref: "Review",
    },
    testimonials: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Testimonial",
    }],

    faqs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "FAQ",
    }],

    isActive: { type: Boolean, default: true },
    createdBy: {
      type: String,
      // ref: "User",
      required: false,
      default: null,
    },
    tags: { type: [String], required: false, default: [] },
    audience: {
      type: String,
      required: true,
      enum: ["college-students", "professionals"],
      validate: {
        validator: validateAudience,
        message: "Audience must be either college-students or professionals",
      },
    },
    slug: { type: String, required: true, unique: true },
    metaTitle: {
      type: String,
      required: false,
      default: "Course | Airkrit India",
    },
    metaDescription: {
      type: String,
      required: false,
      default: "Course Airkrit India",
      maxlength: 160, // SEO best practice for meta descriptions
    },
    keywords: { type: [String], required: false, default: [] },
    scholarship: { type: Boolean, default: false, required: true },
    scholarshipDescription: { 
      type: String, 
      required: false, 
      default: "", 
      maxlength: 500 // Reasonable limit for scholarship description
    },
    scholarshipRef: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null,
      ref: "Scholarship",
    },
    curriculum: {
      type: String,
      required: false,
      validate: {
        validator: validateUrl,
        message: "Curriculum must be a valid URL",
      },
    },
    language: {
      type: String,
      required: true,
      enum: [
        "en",
        "es",
        "fr",
        "de",
        "pt",
        "it",
        "ru",
        "zh",
        "ja",
        "ko",
        "hi",
        "ar",
      ],
      default: "en",
    },
    analytics: {
      type: analyticsSchema,
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
courseSchema.index({ slug: 1, isActive: 1 }); // For fetching active courses by slug
courseSchema.index({ category: 1 }); // For browsing by category
courseSchema.index({ instructor: 1 }); // For finding courses by instructor
courseSchema.index({ audience: 1 }); // For filtering by audience
courseSchema.index({ language: 1 }); // For filtering by language
courseSchema.index({ isFeatured: 1, isActive: 1 }); // For listing featured courses
courseSchema.index({ createdAt: 1 }); // For listing courses by creation date
courseSchema.index({ updatedAt: 1 }); // For listing courses by update date
courseSchema.index({ title: "text" }); // For full-text search
courseSchema.index({ analytics: 1 });
courseSchema.index({ contentIds: 1 });
courseSchema.index({ lessonIds: 1 });
courseSchema.index({ modules: 1 });


courseSchema.index({ createdAt: -1 }); // For listing courses by creation date
courseSchema.index({ updatedAt: -1 }); // For listing courses by update date

courseSchema.pre("save", function (next) {
  this.set("updatedAt", new Date());
  next();
});

export const CourseModel = mongoose.model("Course", courseSchema);
