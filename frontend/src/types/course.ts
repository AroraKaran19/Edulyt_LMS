import { CourseInstructor, Discount, FAQ, Review, User } from ".";

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
  title: string;
  description?: string;
  type: "video" | "quiz" | "document";
  lessonId?: string; // Reference to parent lesson
  readingMaterials?: ReadingMaterial[];
  isCompleted: boolean;
  isActive?: boolean;
  completedAt?: Date;
  isLocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // Upload tracking fields
  videoS3Key?: string;
  videoSource?: "upload" | "url";
  thumbnailS3Key?: string;
  thumbnailSource?: "upload" | "url";
}

// Video Content interface (extends BaseContent + Video fields)
export interface VideoContent extends BaseContent {
  type: "video";
  sources: {
    quality: "1080p" | "720p" | "480p" | "360p";
    videoUrl: string;
    videoSource?: "upload" | "url";
    videoS3Key?: string;
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
  title: string;
  description?: string;
  contentIds: Content["_id"][];
  contents?: Content[];
  moduleId?: string; // Reference to parent module
  isCompleted?: boolean;
  isActive?: boolean;
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
  thumbnailUrl: string; // Required in schema
  thumbnailSource?: "upload" | "url"; // Track whether thumbnail came from upload or URL
  thumbnailS3Key?: string; // S3 key for uploaded thumbnails
  lessonIds: CourseLesson["_id"][];
  lessons?: CourseLesson[];
  description?: string;
  isCompleted: boolean;
  completedAt?: Date;
  isActive: boolean;
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
  extends Omit<
    Review,
    "profileImage" | "rating" | "comment" | "reviewableId" | "reviewableType"
  > {
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
  shortDescription: string; // Required in schema
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
  instructor: CourseInstructor[]; // can be multiple instructors

  // Pricing Plans
  plans: {
    elite?: Plan;
    essential?: Plan;
  };
  discount?: Discount;

  // Reviews
  reviews: Review[];
  testimonials: Testimonial[];

  // FAQs
  faqs: FAQ[];

  // Administrative
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: User;
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

  // Curriculum - optional PDF document URL
  curriculum?: string;

  // brochure - optional PDF document URL
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
