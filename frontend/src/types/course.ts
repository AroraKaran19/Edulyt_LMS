// ===================
// Utility Types
// ===================

import { Instructor } from "./instructor";

export type Discount = {
    discount: "percentage" | "fixed";
    value: number;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
};

// ===================
// Video & Note Types
// ===================

export interface VideoQuality {
    _id: string;
    quality: "1080p" | "720p" | "480p" | "360p";
    videoUrl: string;
}

export interface Video {
    _id: string;
    sources: VideoQuality[];
    thumbnailUrl?: string;
    duration?: number; // in seconds
}

// ===================
// Quiz Types
// ===================

export interface QuizOption {
    _id: string;
    option: string;
}

export interface QuizQuestion {
    _id: string;
    question: string;
    options: QuizOption[];
    correctAnswer: QuizOption[];
    timeLimit?: number;
}

export interface Quiz {
    _id: string;
    title: string;
    description?: string;
    questions: QuizQuestion[];
    passingScore?: number;
    maxAttempts?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// ===================
// Content Types
// ===================

// export interface ReadingMaterial {
//     _id: string;
//     content: "pdf" | "docx";
//     estimatedReadTime: number;
//     downloadUrl?: string;
// }

export interface Content {
    _id: string;
    title: string;
    description?: string;
    content: Video | Quiz;
    type: "video" | "quiz";
    // readingMaterials?: ReadingMaterial[];
    isCompleted?: boolean;
    completedAt?: Date;
    isLocked?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CourseLesson {
    _id: string;
    title: string;
    description?: string;
    content: Content[];
    isCompleted?: boolean;
    completedAt?: Date;
    isLocked?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CourseModule {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    lessons: CourseLesson[];
    description?: string;
    isCompleted?: boolean;
    isLocked?: boolean;
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
    _id: string;
    question: string;
    answer: string;
}

export interface Review {
    _id?: string;
    name: string;
    rating: number;
    comment: string;
    profileImage?: string;
    currentRole?: string;
    pastRole?: string;
    pastCompany?: string;
    currentCompany?: string;
    linkedin?: string;
    date: Date;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FeaturedReview extends Review {
    // Required fields for featured reviews
    profileImage: string;
    currentRole: string;
    currentCompany: string;
    pastRole: string;
    pastCompany: string;
    linkedin: string;
    verified?: boolean;
}

// ===================
// Final Course Type
// ===================

export interface Course {
    // Basic Information
    _id: string;
    title: string;
    description: string;
    shortDescription?: string;
    category: string;
    subcategory?: string;
    thumbnail: string;
    previewVideoUrl: string;

    isFeatured?: boolean;
    isCertified?: boolean;

    // Metrics
    enrolledCount: number;
    totalRatings: number;
    totalLectures: number;

    // UI & Learning Info
    whatYouWillLearn: string;
    skills: string[];
    keyFeatures: {
        title: string;
        description: string;
    }[];
    features?: string[];
    careerPaths: string[];
    skillLevel: string;
    whoShouldJoin: string;
    prerequisites?: string[];
    discount?: number; // in percentage just for display purpose
    duration: string; // like: 3 months, 1 year, 2 years, etc. (will not be accurate)

    // Content
    modules: CourseModule[];

    // Instructor
    instructor: Instructor["_id"][];

    // Pricing Plans
    plans: {
        elite?: Plan;
        essential?: Plan;
    };

    // Reviews
    reviews: Review[];
    featuredReviews?: FeaturedReview[];

    // FAQs
    faqs: FAQ[];

    // Administrative
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
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
    scholarshipQuiz?: Quiz[];

    // Language
    language: string;
}
