import { Discount, User } from ".";
import { CourseInstructor } from "./instructor";
import { Review } from "./review";

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

// API Content interfaces (flattened structure for backend compatibility)
export interface BaseContent {
  _id?: string;
  title: string;
  description?: string;
  type: "video" | "quiz";
  readingMaterials?: ReadingMaterial[];
  isCompleted?: boolean;
  completedAt?: Date;
  isLocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VideoContent extends BaseContent {
  type: "video";
  sources: {
    quality: "1080p" | "720p" | "480p" | "360p";
    videoUrl: string;
    videoSource?: "upload" | "url"; // Track whether video came from upload or URL
    videoS3Key?: string; // S3 key for uploaded videos (for deletion)
  }[];
  thumbnailUrl?: string;
  thumbnailSource?: "upload" | "url"; // Track whether thumbnail came from upload or URL
  thumbnailS3Key?: string; // S3 key for uploaded thumbnails (for deletion)
  duration?: number;
}

export interface QuizContent extends BaseContent {
  type: "quiz";
  questions: QuizQuestion[];
  passingScore?: number;
  maxAttempts?: number;
}

// Union type for API Content
export type Content = VideoContent | QuizContent;

// ===================
// Course Lesson Types
// ===================

export interface CourseLesson {
  _id?: string;
  title: string;
  description?: string;
  // For frontend: store full content objects instead of just IDs
  contents: Content[];
  // Keep the original for backend compatibility when needed
  contentIds?: Content["_id"][];
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
  thumbnailSource?: "upload" | "url"; // Track whether thumbnail came from upload or URL
  thumbnailS3Key?: string; // S3 key for uploaded thumbnails (for deletion)
  // For frontend: store full lesson objects instead of just IDs
  lessons: CourseLesson[];
  // Keep the original for backend compatibility when needed
  lessonIds?: CourseLesson["_id"][];
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

export interface Testimonial extends Omit<Review, "_id" | "profileImage" | "rating" | "comment"> {
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
  thumbnailSource?: "upload" | "url"; // Track whether thumbnail came from upload or URL
  thumbnailS3Key?: string; // S3 key for uploaded thumbnails (for deletion)
  previewVideoUrl?: string;
  previewVideoSource?: "upload" | "url"; // Track whether preview video came from upload or URL
  previewVideoS3Key?: string; // S3 key for uploaded preview videos (for deletion)

  isFeatured?: boolean;
  isCertified?: boolean;

  // Metrics
  enrolledCount: number;
  totalRatings: number;

  // UI & Learning Info
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

  // Content - For frontend: store full module objects instead of just IDs
  modules: CourseModule[];
  // Keep the original for backend compatibility when needed
  moduleIds?: CourseModule["_id"][];

  // Instructor
  instructor: CourseInstructor[]; // can be multiple instructors

  // Pricing Plans
  plans: {
    elite?: Plan;
    essential?: Plan;
  };
  discount?: Discount;

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
  scholarshipRef?: string;
  // scholarshipQuiz?: Quiz[];

  // Language
  language: string;

  // Analytics
  analytics?: {
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