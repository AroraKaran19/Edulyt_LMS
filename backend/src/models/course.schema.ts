import { Schema, model } from 'mongoose';
import {
  Course,
  CourseLesson,
  CourseModule,
  LessonContent,
  Video,
  VideoQuality,
  Quiz,
  QuizQuestion,
  QuizOption,
  ReadingMaterial,
  Plan,
  PlanFeatures,
  Instructor,
  FAQ,
  Review,
  FeaturedReview,
  Discount
} from '../types/course';

// Video Quality Schema
const videoQualitySchema = new Schema<VideoQuality>({
  _id: {
    type: String,
    required: true
  },
  quality: {
    type: String,
    required: true,
    enum: ['1080p', '720p', '480p', '360p']
  },
  videoUrl: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

// Video Schema
const videoSchema = new Schema<Video>({
  _id: {
    type: String,
    required: true
  },
  sources: [videoQualitySchema],
  thumbnailUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    min: 0
  },
  order: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Quiz Option Schema
const quizOptionSchema = new Schema<QuizOption>({
  _id: {
    type: String,
    required: true
  },
  option: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

// Quiz Question Schema
const quizQuestionSchema = new Schema<QuizQuestion>({
  _id: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [quizOptionSchema],
  correctAnswer: [quizOptionSchema],
  timeLimit: {
    type: Number,
    min: 0
  }
}, { _id: false });

// Quiz Schema
const quizSchema = new Schema<Quiz>({
  _id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [quizQuestionSchema],
  passingScore: {
    type: Number,
    min: 0,
    max: 100
  },
  maxAttempts: {
    type: Number,
    min: 1
  },
  order: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Reading Material Schema
const readingMaterialSchema = new Schema<ReadingMaterial>({
  _id: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    enum: ['pdf', 'docx']
  },
  estimatedReadTime: {
    type: Number,
    required: true,
    min: 0
  },
  downloadUrl: {
    type: String,
    trim: true
  }
}, { _id: false });

// Lesson Content Schema
const lessonContentSchema = new Schema<LessonContent>({
  _id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: Schema.Types.Mixed, // Will store Video[] or Quiz[]
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['video', 'quiz']
  },
  readingMaterials: [readingMaterialSchema],
  order: {
    type: Number,
    required: true,
    min: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Course Lesson Schema
const courseLessonSchema = new Schema<CourseLesson>({
  _id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: [lessonContentSchema],
  order: {
    type: Number,
    required: true,
    min: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Course Module Schema
const courseModuleSchema = new Schema<CourseModule>({
  _id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  lessons: [courseLessonSchema],
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    min: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Plan Features Schema
const planFeaturesSchema = new Schema<PlanFeatures>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  provided: {
    type: Boolean,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Discount Schema
const discountSchema = new Schema<Discount>({
  discount: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed']
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Plan Schema
const planSchema = new Schema<Plan>({
  _id: {
    type: String
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['elite', 'essential']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  features: [planFeaturesSchema],
  discount: discountSchema,
  isPopular: {
    type: Boolean,
    default: false
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'annually', 'lifetime'],
    default: 'lifetime'
  },
  trialDays: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Instructor Schema (embedded)
const instructorSchema = new Schema<Instructor>({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profileImage: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  totalStudents: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalCourses: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  bio: {
    type: String,
    required: true,
    trim: true
  },
  currentPosition: {
    type: String,
    trim: true
  },
  previousExperience: [{
    type: String,
    trim: true
  }],
  education: [{
    type: String,
    trim: true
  }],
  linkedinUrl: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

// Review Schema
const reviewSchema = new Schema<Review>({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Featured Review Schema
const featuredReviewSchema = new Schema<FeaturedReview>({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// FAQ Schema
const faqSchema = new Schema<FAQ>({
  _id: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Main Course Schema
const courseSchema = new Schema<Course>({
  // Basic Information
  _id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  previewVideoUrl: {
    type: String,
    required: true,
    trim: true
  },

  // Flags
  isFeatured: {
    type: Boolean,
    default: false
  },
  isCertified: {
    type: Boolean,
    default: false
  },

  // Metrics
  enrolledCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalRatings: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalLectures: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  duration: {
    type: String,
    trim: true
  },

  // UI & Learning Info
  whatYouWillLearn: {
    type: String,
    required: true,
    trim: true
  },
  skills: [{
    type: String,
    required: true,
    trim: true
  }],
  keyFeatures: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  }],
  features: [{
    type: String,
    trim: true
  }],
  careerPaths: [{
    type: String,
    required: true,
    trim: true
  }],
  skillLevel: {
    type: String,
    required: true,
    trim: true
  },
  whoShouldJoin: {
    type: String,
    required: true,
    trim: true
  },
  prerequisites: [{
    type: String,
    trim: true
  }],

  // Content
  modules: [courseModuleSchema],

  // Instructor
  instructor: [instructorSchema],

  // Pricing Plans
  plans: {
    elite: [planSchema],
    essential: [planSchema]
  },

  // Reviews
  reviews: [reviewSchema],
  featuredReviews: [featuredReviewSchema],

  // FAQs
  faqs: [faqSchema],

  // Administrative
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  audience: {
    type: String,
    required: true,
    enum: ['college-students', 'professionals']
  },

  // SEO
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],

  // Scholarship
  scholarship: {
    type: Boolean,
    default: false
  },
  scholarshipDescription: {
    type: String,
    trim: true
  },
  scholarshipQuiz: [quizSchema],

  // Discount
  discount: discountSchema
}, {
  timestamps: true,
  collection: 'courses'
});

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
  title: 'text',
  description: 'text',
  shortDescription: 'text'
});

// Compound indexes for common queries
courseSchema.index({ category: 1, isActive: 1 });
courseSchema.index({ isFeatured: 1, isActive: 1 });
courseSchema.index({ skillLevel: 1, category: 1 });
courseSchema.index({ audience: 1, isActive: 1 });

// Pre-save middleware to update the updatedAt field
courseSchema.pre('save', function (next) {
  this.set('updatedAt', new Date());
  next();
});

export const CourseModel = model<Course>('Course', courseSchema); 