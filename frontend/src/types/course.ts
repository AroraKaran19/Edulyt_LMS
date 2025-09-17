import { CourseInstructor, Discount, FAQ, Review, User } from ".";

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
  type: "video" | "quiz";
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

// Union type for Content (discriminated union)
export type Content = VideoContent | QuizContent;

// ===================
// Course Lesson Types
// ===================

export interface CourseLesson {
  _id?: string;
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
  instructor: CourseInstructor["_id"][]; // can be multiple instructors

  // Pricing Plans
  plans: {
    elite?: Plan;
    essential?: Plan;
  };
  discount?: Discount;

  // Reviews
  reviews: Review["_id"][];
  testimonials: Testimonial[] | Testimonial["_id"][];

  // FAQs
  faqs: FAQ[] | FAQ["_id"][];

  // Administrative
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: User["_id"];
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
  curriculumSource?: "upload" | "url";
  curriculumS3Key?: string;

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
