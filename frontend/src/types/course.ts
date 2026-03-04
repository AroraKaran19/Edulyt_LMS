import { Discount, CourseDiscount, FAQ, Instructor, Review, User, Category } from ".";

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
  order?: number;
  isActive?: boolean;
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
  contents: Content[] | string[];
  order?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// Course Module Types
// ===================

export interface CourseModule {
  _id?: string;
  courseId: string; // Reference to the course this module belongs to
  title: string;
  thumbnailUrl: string; // Required in schema
  lessons: CourseLesson[] | string[];
  description?: string;
  isActive?: boolean;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// Plan & Pricing Types
// ===================

export interface PlanFeatures {
  title: string;
  provided: boolean;
  showHover?: string;
}

export interface Plan {
  title: string;
  type: "elite" | "essential";
  price: number;
  features: PlanFeatures[];
  discount?: Discount;
  isPopular?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// Review Types
// ===================

export interface Testimonial {
  _id?: string;
  name: string;
  currentRole: string;
  currentCompany: string;
  linkedin: string;
  pastRole: string;
  pastCompany: string;
  college: string;
  collegeUrl?: string;
  collegeProfileUrl?: string;
  companyUrl?: string;
  companyProfileUrl?: string;
  verified?: boolean;
  profileImage?: string;
  category?: "college-students" | "professionals" | "internships";
  feedback?: string;
  heading2?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// Final Course Type
// ===================

export interface Course {
  _id?: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string[] | Category[]; // Can be IDs (string[]) or populated Category objects
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
  modules?: CourseModule[] | string[];

  // Per-course deactivation tracking (for shared content)
  deactivatedModules?: string[]; // Array of module IDs that are deactivated for this course
  deactivatedLessons?: string[]; // Array of lesson IDs that are deactivated for this course
  deactivatedContents?: string[]; // Array of content IDs that are deactivated for this course

  // Instructor
  instructor: Instructor[] | string[]; // can be multiple instructors

  // Pricing Plans
  plans: {
    elite?: Plan;
    essential?: Plan;
  };
  discount?: CourseDiscount;

  // Reviews
  reviews: Review[] | string[];
  testimonials: Testimonial[] | string[];

  // FAQs
  faqs: FAQ[] | string[];

  // Administrative
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: User | string | null;
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
