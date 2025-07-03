import { Schema, model } from 'mongoose';
import { 
  Course, 
  CourseLesson, 
  CourseModule, 
  CoursePlan, 
  FeaturedReview, 
  FAQ,
  PlanDetails
} from '../types';

// Course Lesson Schema
const courseLessonSchema = new Schema<CourseLesson>({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    trim: true
  },
  materials: [{
    type: String,
    trim: true
  }],
  completed: {
    type: Boolean,
    default: false
  },
  isForCollegeStudent: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Course Module Schema
const courseModuleSchema = new Schema<CourseModule>({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  lessons: [courseLessonSchema],
  description: {
    type: String,
    trim: true
  }
}, { _id: false });

// Plan Details Schema
const planDetailsSchema = new Schema<PlanDetails>({
  price: {
    type: Number,
    required: true,
    min: 0
  },
  features: [{
    type: String,
    required: true,
    trim: true
  }]
}, { _id: false });

// Course Plan Schema
const coursePlanSchema = new Schema<CoursePlan>({
  professionals: {
    type: planDetailsSchema,
    required: true
  },
  collegeStudents: {
    type: planDetailsSchema,
    required: true
  }
}, { _id: false });

// Featured Review Schema
const featuredReviewSchema = new Schema<FeaturedReview>({
  id: {
    type: String,
    required: true
  },
  studentName: {
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
  }
}, { _id: false });

// FAQ Schema
const faqSchema = new Schema<FAQ>({
  id: {
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
  id: {
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
    required: true,
    default: false
  },
  
  // Metrics
  totalRatings: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  enrolledCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalLectures: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Course Details
  language: {
    type: String,
    required: true,
    trim: true,
    default: 'English'
  },
  skillLevel: {
    type: String,
    required: true,
    trim: true,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'College Students']
  },
  duration: {
    type: String,
    trim: true
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Content
  modules: [courseModuleSchema],
  whatYouWillLearn: [{
    type: String,
    required: true,
    trim: true
  }],
  whoShouldJoin: {
    type: String,
    required: true,
    trim: true
  },
  prerequisites: [{
    type: String,
    trim: true
  }],
  
  // Instructor (reference to instructor IDs)
  instructor: [{
    type: String,
    required: true,
    ref: 'Instructor'
  }],
  
  // Pricing Plans
  plan: coursePlanSchema,
  
  // Reviews
  featuredReviews: [featuredReviewSchema],
  
  // USP & Features
  features: [{
    type: String,
    required: true,
    trim: true
  }],
  
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
  }]
}, {
  timestamps: true,
  collection: 'courses'
});

// Create indexes for better query performance
courseSchema.index({ id: 1 });
courseSchema.index({ slug: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ skillLevel: 1 });
courseSchema.index({ isBestseller: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ isActive: 1 });

courseSchema.index({ enrolledCount: -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ updatedAt: -1 });

// Text search index for title and description
courseSchema.index({ 
  title: 'text', 
  description: 'text', 
  shortDescription: 'text' 
});

// Pre-save middleware to update the updatedAt field
courseSchema.pre('save', function(next) {
  this.set('updatedAt', new Date());
  next();
});

export const CourseModel = model<Course>('Course', courseSchema); 