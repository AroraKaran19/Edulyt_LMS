import { Discount, User } from ".";
import { CourseInstructor } from "./instructor";
import { Review } from "./review";

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

export interface Content {
  _id?: string;
  title: string;
  description?: string;
  content: Video | Quiz;
  type: "video" | "quiz";
  readingMaterials?: ReadingMaterial[];
  isCompleted?: boolean;
  completedAt?: Date;
  isLocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// Course Lesson Types
// ===================

export interface CourseLesson {
  _id?: string;
  title: string;
  description?: string;
  moduleId: CourseModule["_id"];
  contentIds: Content["_id"][];
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
  title: string;
  thumbnailUrl?: string;
  lessonIds: CourseLesson["_id"][];
  description?: string;
  isCompleted?: boolean;
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
  _id?: string;
  title: string;
  type: "elite" | "essential";
  price: number;
  features: PlanFeatures[];
  discount?: Discount;
  isPopular?: boolean;
  billingPeriod?: "monthly" | "annually" | "lifetime";
  trialDays?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// FAQ & Review Types
// ===================

export interface FAQ {
  question: string;
  answer: string;
}

export interface Testimonial extends Omit<Review, "_id" | "profileImage"> {
  pastRole: string;
  pastCompany: string;
  verified?: boolean;
  profileImage: string;
}

// ===================
// Final Course Type
// ===================

export interface Course {
  // Basic Information
  _id?: string;
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  subcategory?: string;
  thumbnail: string;
  previewVideoUrl?: string;

  isFeatured?: boolean;
  isCertified?: boolean;

  // Metrics
  enrolledCount: number;
  totalRatings: number;

  // UI & Learning Info
  whatYouWillLearn: string;
  skills: string[];
  courseTestimonials: {
    title: string;
    description: string;
  }[];
  features?: string[];
  careerPaths: string[];
  skillLevel: string;
  whoShouldJoin: string;
  prerequisites?: string[];
  fakeDiscount?: number; // in percentage for display purposes
  duration: string; // like: 3 months, 1 year, 2 years, etc. (will not be accurate)

  // Content
  modules: CourseModule["_id"][];

  // Instructor
  instructor: CourseInstructor["_id"][]; // can be multiple instructors

  // Pricing Plans
  plans: {
    elite?: Plan;
    essential?: Plan;
  };

  // Reviews
  reviews: Review["_id"][];
  testimonials?: Testimonial[];

  // FAQs
  faqs: FAQ[];

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
  // scholarshipQuiz?: Quiz[];

  // Language
  language: string;
}
