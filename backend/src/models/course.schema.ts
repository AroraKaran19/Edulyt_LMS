import mongoose from "mongoose";
import { Course, FAQ, Plan, Testimonial } from "../types";
import plansSchema from "./plans.schema";
import { validateAudience, validatePlans, validateUrl } from "./validators";

// ===================
// FAQ Schema
// ===================

const faqSchema = new mongoose.Schema<FAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true, _id: false }
);

// ===================
// Testimonial Schema
// ===================

const testimonialSchema = new mongoose.Schema<Testimonial>(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    profileImage: { type: String, required: true },
    currentRole: { type: String, required: true },
    pastRole: { type: String, required: true },
    pastCompany: { type: String, required: true },
    currentCompany: { type: String, required: true },
    linkedin: { type: String, required: true },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true, _id: false }
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
      unique: true,
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
    subcategory: {
      type: String,
      required: false,
      default: "",
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
    previewVideoUrl: { type: String, required: true },
    isFeatured: { type: Boolean, default: false, required: true },
    isCertified: { type: Boolean, default: false, required: true },
    enrolledCount: {
      type: Number,
      default: 0,
      required: true,
      min: [0, "Enrolled count must be positive"],
    },
    totalRatings: {
      type: Number,
      default: 0,
      required: true,
      min: [0, "Total ratings must be positive"],
      max: [5, "Total ratings must be less than 5"],
    },
    whatYouWillLearn: { type: String, required: true },
    skills: { type: [String], required: true },
    courseTestimonials: {
      type: [
        {
          title: { type: String, required: true },
          description: { type: String, required: true },
        },
      ],
      required: true,
      default: [],
    },
    features: { type: [String], required: true },
    careerPaths: { type: [String], required: true },
    skillLevel: { type: String, required: true },
    whoShouldJoin: { type: String, required: true },
    prerequisites: { type: [String], required: false, default: [] },
    fakeDiscount: {
      type: Number,
      required: false,
      default: 0,
      min: [0, "Discount must be positive"],
      max: [100, "Discount must be less than 100"],
    },
    duration: {
      type: String,
      required: true,
      min: [1, "Duration must be positive"],
    },
    modules: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: "CourseModule",
    },
    instructor: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: "CourseInstructor",
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
    },
    reviews: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: "Review",
    },
    testimonials: { type: [testimonialSchema], required: true },

    faqs: { type: [faqSchema], required: true },

    isActive: { type: Boolean, default: true },
    createdBy: {
      type: String,
      ref: "User",
      required: true,
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
      default: "Course | Edulyt India",
    },
    metaDescription: {
      type: String,
      required: false,
      default: "Course Edulyt India",
    },
    keywords: { type: [String], required: false, default: [] },
    scholarship: { type: Boolean, default: false, required: true },
    scholarshipDescription: { type: String, required: false, default: "" },

    language: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes
courseSchema.index({ slug: 1, isActive: 1 }); // For fetching active courses by slug
courseSchema.index({ category: 1 }); // For browsing by category
courseSchema.index({ category: 1, subcategory: 1 }); // For browsing by category
courseSchema.index({ instructor: 1 }); // For finding courses by instructor
courseSchema.index({ audience: 1 }); // For filtering by audience
courseSchema.index({ language: 1 }); // For filtering by language
courseSchema.index({ isFeatured: 1, isActive: 1 }); // For listing featured courses
courseSchema.index({ createdAt: 1 }); // For listing courses by creation date
courseSchema.index({ updatedAt: 1 }); // For listing courses by update date
courseSchema.index({ enrolledCount: 1 }); // For listing courses by enrolled count

courseSchema.index({ createdAt: -1 }); // For listing courses by creation date
courseSchema.index({ updatedAt: -1 }); // For listing courses by update date
courseSchema.index({ enrolledCount: -1 }); // For listing courses by enrolled count

courseSchema.pre("save", function (next) {
  this.set("updatedAt", new Date());
  next();
});

export default mongoose.model<Course>("Course", courseSchema);
