import mongoose from "mongoose";
import { Course } from "../types";
import plansSchema from "./plans.schema";
import { brandPlugin } from "./plugins/brand.plugin";
import { brandFromAudience } from "../lib/brandRules";
import {
  richTextWithinLength,
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
    totalReviews: { type: Number, default: 0, required: true },
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
      // Authored as rich text, so the maximum counts visible text only (as the
      // admin form does) — otherwise pasted markup blows a limit the author
      // cannot see. The raw cap is a storage guard, the minimum stays on the
      // raw string so existing markup-heavy values keep saving.
      minlength: 25,
      maxlength: [20000, "Description contains too much formatting"],
      validate: {
        validator: (value: string) => richTextWithinLength(value, 1000),
        message: "Description must be 1000 characters or fewer",
      },
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: [5000, "Short description contains too much formatting"],
      validate: {
        validator: (value: string) => richTextWithinLength(value, 300),
        message: "Short description must be 300 characters or fewer",
      },
    },
    category: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: "Category",
      validate: {
        validator: function (categories: mongoose.Types.ObjectId[]) {
          return Array.isArray(categories) && categories.length > 0;
        },
        message: "At least one category is required",
      },
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
    /** Points granted to the user when their certificate for this course is generated. */
    completionSuccessPoints: {
      type: Number,
      default: 0,
      min: 0,
      max: 1_000_000,
    },
    seatsLeft: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    staticReviewCount: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    staticRating: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
      max: 5,
    },
    /**
     * The internship this course sells as a checkout add-on. Source of truth for
     * the course↔program link; `courseInternships.courses[]` mirrors it.
     *
     * One price — the duration a learner picks sets their certificate period,
     * not the amount they pay. Absent means no internship is offered.
     */
    internshipOffer: {
      type: new mongoose.Schema(
        {
          programId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CourseInternship",
            required: true,
          },
          price: { type: Number, required: true, min: 0 },
          durations: {
            type: [Number],
            required: true,
            validate: {
              validator: (v: number[]) => Array.isArray(v) && v.length > 0,
              message: "Select at least one internship duration",
            },
          },
        },
        { _id: false },
      ),
      required: false,
      default: undefined,
    },
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
    // Per-course deactivation tracking (for shared content)
    deactivatedModules: {
      type: [String],
      required: false,
      default: [],
    },
    deactivatedLessons: {
      type: [String],
      required: false,
      default: [],
    },
    deactivatedContents: {
      type: [String],
      required: false,
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
            validator: function(value: string) {
              if (!value) return true; // Allow empty/null
              // Validate HH:mm format (24-hour)
              const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
              return timeRegex.test(value);
            },
            message: "Start time must be in HH:mm format (e.g., 12:00 for 12 AM, 23:00 for 11 PM)"
          }
        },
        endTime: { 
          type: String, 
          required: false, 
          default: null,
          validate: {
            validator: function(value: string) {
              if (!value) return true; // Allow empty/null
              // Validate HH:mm format (24-hour)
              const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
              return timeRegex.test(value);
            },
            message: "End time must be in HH:mm format (e.g., 12:00 for 12 AM, 23:00 for 11 PM)"
          }
        },
        isActive: { type: Boolean, required: false, default: true },
      },
      required: false,
      default: null,
      _id: false,
    },
    reviews: {
      type: [mongoose.Schema.Types.ObjectId],
      required: false,
      default: [],
      ref: "Review",
    },
    testimonials: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Testimonial",
        default: [],
      },
    ],

    faqs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FAQ",
        default: [],
      },
    ],

    isActive: { type: Boolean, default: true },
    createdBy: {
      type: String,
      ref: "User",
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
    // Unique per brand, not globally: the two sites are separate catalogues and
    // the same course sold on both should have the same URL on both. The
    // compound index is declared below, after the brand field is added.
    slug: { type: String, required: true },
    metaTitle: {
      type: String,
      required: false,
      default: "Course | Airkrit India",
      maxlength: 100, // SEO best practice for meta titles
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
      maxlength: 500, // Reasonable limit for scholarship description
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
        validator: function (value: string) {
          // Allow empty strings or valid URLs
          return !value || validateUrl(value);
        },
        message: "Curriculum must be a valid URL",
      },
    },
    brochure: {
      type: String,
      required: false,
      validate: {
        validator: function (value: string) {
          // Allow empty strings or valid URLs
          return !value || validateUrl(value);
        },
        message: "Brochure must be a valid URL",
      },
    },
    language: {
      type: String,
      required: true,
      enum: ["English", "Hindi"],
      default: "English",
    },
    analytics: {
      type: analyticsSchema,
      required: false,
      default: {
        totalRatings: 0,
        totalReviews: 0,
        totalEnrollments: 0,
        activeEnrollments: 0,
        completionRate: 0,
        averageRating: 0,
        averageCompletionTime: 0,
        dropoffPoints: [],
      },
      _id: false,
    },

    // Per-category display order (order within each category page, from mapping/screenshot)
    categoryOrders: {
      type: [
        {
          categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
          order: { type: Number, required: true },
        },
      ],
      required: false,
      default: [],
      _id: false,
    },
  } as mongoose.SchemaDefinition<Course>,
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
courseSchema.plugin(brandPlugin, { derive: (doc) => brandFromAudience(doc.get("audience")) });
courseSchema.index({ brand: 1, isActive: 1 });
// Replaces the old global `slug_1`, which stopped a course copied to the other
// brand from keeping its URL. `scripts:migrate-brand-unique-indexes` drops it.
courseSchema.index({ slug: 1, brand: 1 }, { unique: true });

courseSchema.pre("save", function (next) {
  this.set("updatedAt", new Date());
  next();
});

export const CourseModel = mongoose.model("Course", courseSchema);
