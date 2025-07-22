// ===================
// Utility Types
// ===================

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

export interface UserVideoNote {
    _id: string;
    note: string;
    timestamp: number; // in seconds
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Video {
    _id: string;
    sources: VideoQuality[];
    thumbnailUrl?: string;
    duration?: number; // in seconds
    order: number;
    notes?: UserVideoNote[];
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
    order: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// ===================
// Content Types
// ===================

export interface ReadingMaterial {
    _id: string;
    content: "pdf" | "docx";
    estimatedReadTime: number;
    downloadUrl?: string;
}

export interface LessonContent {
    _id: string;
    title: string;
    description?: string;
    content: Video[] | Quiz[];
    type: "video" | "quiz";
    readingMaterials?: ReadingMaterial[];
    order: number;
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
    content: LessonContent[];
    order: number;
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
    order: number;
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
    description?: string;
    order: number;
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
// Instructor Type
// ===================

export interface Instructor {
    _id: string;
    name: string;
    profileImage?: string;
    experience: string;
    rating: number;
    totalStudents: number;
    totalCourses: number;
    bio: string;
    currentPosition?: string;
    previousExperience?: string[];
    education?: string[];
    linkedinUrl: string;
}

// ===================
// FAQ & Review Types
// ===================

export interface FAQ {
    _id: string;
    question: string;
    answer: string;
    order: number;
}

export interface Review {
    _id: string;
    name: string;
    rating: number;
    comment: string;
    date: Date;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FeaturedReview extends Review {
    verified?: boolean;
}

// ===================
// Final Course Type
// ===================

export interface Course {
    // Basic Information
    _id: string;
    title: string;
    subtitle?: string;
    description: string;
    shortDescription?: string;
    category: string;
    subcategory?: string;
    thumbnail: string;
    images?: string[];
    previewVideoUrl: string;

    isFeatured?: boolean;
    isCertified?: boolean;

    // Metrics
    enrolledCount: number;
    totalRatings: number;
    totalLectures: number;
    duration?: string; // like: 3 months, 1 year, 2 years, etc. (will not be accurate)

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

    // Content
    modules: CourseModule[];

    // Instructor
    instructor: Instructor[];

    // Pricing Plans
    plans: {
        elite?: Plan[];
        essential?: Plan[];
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

    // Discount
    discount?: Discount;

    // Languages
    language: "English";
}
