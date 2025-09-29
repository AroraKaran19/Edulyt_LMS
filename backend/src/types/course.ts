import mongoose from "mongoose";
import { Discount, FAQ, Instructor, Review, User } from ".";

// ===================
// Document Types
// ===================
export interface Document {
  _id?: string;
  documentUrl: string;
}

// ===================
// Video & Note Types
// ===================

export interface Video {
  sources: {
    quality: "1080p" | "720p" | "480p" | "360p";
    videoUrl: string;
  }[];
  thumbnailUrl?: string;
  duration?: number; // in seconds
}

// ===================
// Quiz Types
// ===================

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string[];
  timeLimit?: number;
}

export interface Quiz {
  _id?: string;
  questions: QuizQuestion[];
  passingScore?: number;
  maxAttempts?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// Content Types
// ===================

export interface ReadingMaterial {
  _id?: string;
  content: "pdf" | "docx";
  estimatedReadTime: number;
  downloadUrl?: string;
}

// Base Content interface
export interface BaseContent {
  _id?: string;
  lessonId?: string; // Reference to parent lesson
  moduleId?: string; // Reference to parent module
  title: string;
  description?: string;
  type: "video" | "quiz" | "document";
  readingMaterials?: ReadingMaterial[];
  isCompleted: boolean;
  completedAt?: Date;
  isLocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Video Content interface (extends BaseContent + Video fields)
export interface VideoContent extends BaseContent {
  type: "video";
  sources: {
    quality: "1080p" | "720p" | "480p" | "360p";
    videoUrl: string;
  }[];
  thumbnailUrl?: string;
  duration?: number; // in seconds
}

// Quiz Content interface (extends BaseContent + Quiz fields)
export interface QuizContent extends BaseContent {
  type: "quiz";
  questions: QuizQuestion[];
  passingScore?: number;
  maxAttempts?: number;
}

// Document Content interface (extends BaseContent + Document fields)
export interface DocumentContent extends BaseContent {
  type: "document";
  documentUrl: string;
}

// Union type for Content (discriminated union)
export type Content = VideoContent | QuizContent | DocumentContent;

// ===================
// Course Lesson Types
// ===================

export interface CourseLesson {
  _id?: string;
  moduleId?: string; // Reference to the module this lesson belongs to
  title: string;
  description?: string;
  contentIds: Content["_id"][];
  contents?: Content[];
  isCompleted?: boolean;
  completedAt?: Date;
  isLocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// Course Module Types
// ===================

export interface CourseModule {
  _id?: string;
  courseId: mongoose.Schema.Types.ObjectId; // Reference to the course this module belongs to
  title: string;
  thumbnailUrl: string; // Required in schema
  lessonIds: CourseLesson["_id"][];
  lessons?: CourseLesson[];
  description?: string;
  isCompleted: boolean;
  completedAt?: Date;
  isActive?: boolean;
  isLocked?: boolean; // if the module is locked, the user cannot access the lessons
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// Plan & Pricing Types
// ===================

export interface PlanFeatures {
  title: string;
  provided: boolean;
}

export interface Plan {
  title: string;
  type: "elite" | "essential";
  price: number;
  features: PlanFeatures[];
  discount?: Discount;
  isPopular?: boolean;
  trialDays?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// Review Types
// ===================

export interface Testimonial
  extends Omit<Review, "profileImage" | "rating" | "comment" | "reviewableId" | "reviewableType"> {
  pastRole: string;
  pastCompany: string;
  college: string;
  verified?: boolean;
  profileImage: string;
}

// ===================
// Final Course Type
// ===================

export interface Course {
  _id?: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  thumbnail: string;
  previewVideoUrl?: string;

  isFeatured?: boolean;
  isCertified?: boolean;

  // Course Content
  whatYouWillLearn: string;
  skills: string[];
  highlights: {
    title: string;
    description: string;
  }[];
  features?: string[];
  careerPaths: string[];
  skillLevel: string;
  whoShouldJoin: string;
  prerequisites?: string[];

  duration: string; // like: 3 months, 1 year, 2 years, etc. (will not be accurate)

  // Content
  moduleIds: CourseModule["_id"][];
  modules?: CourseModule[];

  // Instructor
  instructor: Instructor["_id"][]; // can be multiple instructors

  // Pricing Plans
  plans: {
    elite?: Plan;
    essential?: Plan;
  };
  discount?: Discount;

  // Reviews
  reviews: Review["_id"][];
  testimonials: Testimonial["_id"][];

  // FAQs
  faqs: FAQ[] | FAQ["_id"];

  // Administrative
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: User["_id"];
  tags?: string[];
  audience: "college-students" | "professionals";

  // SEO
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];

  // Scholarship
  scholarship?: boolean;
  scholarshipDescription?: string;
  scholarshipRef?: string;
  // scholarshipQuiz?: Quiz[];

  // Language
  language: string;
  
  // Curriculum
  curriculum?: string;
  brochure?: string;

  // Analytics
  analytics?: {
    totalRatings: number;
    totalReviews: number;
    totalEnrollments: number;
    activeEnrollments: number;
    completionRate: number;
    averageRating: number;
    averageCompletionTime: number; // in days
    dropoffPoints: {
      moduleId: string;
      lessonId: string;
      dropoffRate: number;
    }[];
  };
}
