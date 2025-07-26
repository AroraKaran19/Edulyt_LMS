import { Schema, model } from "mongoose";
import {
  Course,
  CourseLesson,
  CourseModule,
  Video,
  VideoQuality,
  Quiz,
  QuizQuestion,
  QuizOption,
  Plan,
  PlanFeatures,
  FAQ,
  Review,
  FeaturedReview,
  Discount,
  Content,
} from "../types/course";
import { Instructor } from "../types/instructor";

// Video Quality Schema
const videoQualitySchema = new Schema<VideoQuality>(
  {
    quality: {
      type: String,
      required: true,
      enum: ["1080p", "720p", "480p", "360p"],
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
  }
);

// Video Schema
const videoSchema = new Schema<Video>(
  {
    sources: [videoQualitySchema],
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      min: 0,
    },
  }
);

// Quiz Option Schema
const quizOptionSchema = new Schema<QuizOption>(
  {
    option: {
      type: String,
      required: true,
      trim: true,
    },
  }
);

// Quiz Question Schema
const quizQuestionSchema = new Schema<QuizQuestion>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: [quizOptionSchema],
    correctAnswer: [quizOptionSchema],
    timeLimit: {
      type: Number,
      min: 0,
    },
  }
);

// Quiz Schema
const quizSchema = new Schema<Quiz>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    questions: [quizQuestionSchema],
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    maxAttempts: {
      type: Number,
      min: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Lesson Content Schema
const lessonContentSchema = new Schema<Content>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    content: {
      type: Schema.Types.Mixed, // Will store Video or Quiz object
      validate: {
        validator: function (value: any) {
          // Allow undefined/null for now
          if (!value) return true;

          // Content should be a single object (Video or Quiz), not an array
          if (Array.isArray(value)) return false;

          // Basic validation - just check if it has an _id (MongoDB will auto-generate)
          return value && (typeof value._id === "string" || value._id);
        },
        message: "Content must be a valid content object (Video or Quiz), not an array",
      },
    },
    type: {
      type: String,
      required: true,
      enum: ["video", "quiz"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Course Lesson Schema
const courseLessonSchema = new Schema<CourseLesson>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    content: [lessonContentSchema],
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Course Module Schema
const courseModuleSchema = new Schema<CourseModule>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    lessons: [courseLessonSchema],
    description: {
      type: String,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Plan Features Schema
const planFeaturesSchema = new Schema<PlanFeatures>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    provided: {
      type: Boolean,
      required: true,
    },
  }
);

// Discount Schema
const discountSchema = new Schema<Discount>(
  {
    discount: {
      type: String,
      required: true,
      enum: ["percentage", "fixed"],
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }
);

// Plan Schema - Fixed to match Plan type exactly
const planSchema = new Schema<Plan>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["elite", "essential"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    features: [planFeaturesSchema],
    discount: discountSchema, // Optional in type, so should be optional in schema
    isPopular: {
      type: Boolean,
      default: false,
    },
    billingPeriod: {
      type: String,
      enum: ["monthly", "annually", "lifetime"],
      default: "lifetime",
    },
    trialDays: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Instructor Schema (embedded)
const instructorSchema = new Schema<Instructor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    experience: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    totalStudents: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalCourses: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    bio: {
      type: String,
      required: true,
      trim: true,
    },
    currentPosition: {
      type: String,
      trim: true,
    },
    currentCompany: {
      type: String,
      trim: true,
    },
    previousExperience: [
      {
        type: String,
        trim: true,
      },
    ],
    education: [
      {
        type: String,
        trim: true,
      },
    ],
    linkedinUrl: {
      type: String,
      required: true,
      trim: true,
    },
  }
);

// Review Schema - Fixed to match Review type exactly
const reviewSchema = new Schema<Review>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    currentRole: {
      type: String,
      trim: true,
    },
    pastRole: {
      type: String,
      trim: true,
    },
    pastCompany: {
      type: String,
      trim: true,
    },
    currentCompany: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Featured Review Schema - Fixed to match FeaturedReview type exactly
const featuredReviewSchema = new Schema<FeaturedReview>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String,
      required: true, // Required for featured reviews
      trim: true,
    },
    currentRole: {
      type: String,
      required: true, // Required for featured reviews
      trim: true,
    },
    currentCompany: {
      type: String,
      required: true, // Required for featured reviews
      trim: true,
    },
    pastRole: {
      type: String,
      required: true, // Required for featured reviews
      trim: true,
    },
    pastCompany: {
      type: String,
      required: true, // Required for featured reviews
      trim: true,
    },
    linkedin: {
      type: String,
      required: true, // Required for featured reviews
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// FAQ Schema
const faqSchema = new Schema<FAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  }
);

// Main Course Schema - Fixed to match Course type exactly
const courseSchema = new Schema<Course>(
  {
    // Basic Information - MongoDB automatically creates _id
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    thumbnail: {
      type: String,
      required: true,
      trim: true,
    },
    previewVideoUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // Flags - Optional in type
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isCertified: {
      type: Boolean,
      default: false,
    },

    // Metrics - Required in type
    enrolledCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalRatings: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalLectures: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    duration: {
      type: String,
      trim: true,
      required: true,
      default: "1 month",
    },

    // UI & Learning Info - Required in type
    whatYouWillLearn: {
      type: String,
      required: true,
      trim: true,
    },
    skills: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    keyFeatures: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    careerPaths: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    skillLevel: {
      type: String,
      required: true,
      trim: true,
    },
    whoShouldJoin: {
      type: String,
      required: true,
      trim: true,
    },
    prerequisites: [
      {
        type: String,
        trim: true,
      },
    ],
    discount: discountSchema, // Optional in type

    // Content
    modules: [courseModuleSchema],

    // Instructor
    instructor: [instructorSchema],

    // Pricing Plans
    plans: {
      elite: planSchema,
      essential: planSchema,
    },

    // Reviews
    reviews: [reviewSchema],
    featuredReviews: [featuredReviewSchema], // Optional in type

    // FAQs
    faqs: [faqSchema],

    // Administrative - Required in type
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    audience: {
      type: String,
      required: true,
      enum: ["college-students", "professionals"],
    },

    // SEO - slug is required, others optional
    slug: {
      type: String,
      required: true,
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

    // Scholarship - Optional in type
    scholarship: {
      type: Boolean,
      default: false,
    },
    scholarshipDescription: {
      type: String,
      trim: true,
    },
    scholarshipQuiz: [quizSchema],

    // Language - Required in type
    language: {
      type: String,
      required: true,
      trim: true,
      default: "English",
    },
  },
  {
    timestamps: true,
    collection: "courses",
  }
);

// Create indexes for better query performance
courseSchema.index({ category: 1 });
courseSchema.index({ skillLevel: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ audience: 1 });

courseSchema.index({ enrolledCount: -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ updatedAt: -1 });

// Text search index for title and description
courseSchema.index({
  title: "text",
  description: "text",
  shortDescription: "text",
});

// Compound indexes for common queries
courseSchema.index({ category: 1, isActive: 1 });
courseSchema.index({ isFeatured: 1, isActive: 1 });
courseSchema.index({ skillLevel: 1, category: 1 });
courseSchema.index({ audience: 1, isActive: 1 });

// Pre-save middleware to update the updatedAt field
courseSchema.pre("save", function (next) {
  this.set("updatedAt", new Date());
  next();
});

export const CourseModel = model<Course>("Course", courseSchema);
