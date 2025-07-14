// Course-related types for Edulyt platform

export type Discount = {
    discount: "percentage" | "fixed";
    value: number;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
}


export interface QuizOption {
    _id: string;
    option: string;
}

export interface QuizQuestion {
    _id: string;
    question: string;
    options: QuizOption[];
    correctAnswer: QuizOption["_id"][]; // multiple correct answers are allowed
    timeLimit?: number; // in seconds
}

export interface Quiz {
    _id: string;
    title: string;
    description?: string;
    questions: QuizQuestion[];
    passingScore?: number; // out of 100
    maxAttempts?: number; // 0 for unlimited attempts
    order: number;
    createdAt?: Date;
    updatedAt?: Date;
}

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
    duration?: number;
    order: number;
    notes?: UserVideoNote[];
}

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
    content: Video["_id"] | Quiz["_id"];
    type: "video" | "quiz";
    readingMaterials?: ReadingMaterial["_id"][]; // Uploaded from AWS S3
    order: number;
    isCompleted?: boolean;
    completedAt?: Date;
    isLocked?: boolean; // for trial users or free users
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CourseLesson {
    _id: string;
    title: string;
    description?: string;
    content: LessonContent["_id"][];
    order: number;
    isCompleted?: boolean;
    completedAt?: Date;
    isLocked?: boolean; // for trial users or free users
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CourseModule {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    lessons: CourseLesson["_id"][];
    description?: string;
    order: number;
    isCompleted?: boolean;
    isLocked?: boolean; // for trial users or free users
    createdAt?: Date;
    updatedAt?: Date;
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


export interface FAQ {
    _id: string;
    question: string;
    answer: string;
    order: number;
}

export interface PlanFeatures {
    title: string;
    provided: boolean;
    description?: string;
    order: number;
}

// Temporary Instructor type
export interface Instructor {
    _id: string;
    name: string;
    profileImage?: string;
    experience: string; // e.g., "14 of Experience"
    rating: number;
    totalStudents: number;
    totalCourses: number;
    bio: string;
    currentPosition?: string;
    previousExperience?: string[];
    education?: string[];
    linkedinUrl: string;
  } 

export interface Plan {
    _id?: string;
    title: string;
    type: "elite" | "essential";
    price: number;
    features: PlanFeatures[];
    discount?: Discount;
    isPopular?: boolean; // to highlight a recommended plan
    billingPeriod?: "monthly" | "annually" | "lifetime";
    trialDays?: number; // free trial period
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Course {
    // Basic Information
    _id: string;
    title: string;
    subtitle?: string; // e.g., "Unlock the Power of Data with Python"
    description: string;
    shortDescription?: string;
    category: string; // e.g., "Data Science", "Machine Learning", "Python"
    thumbnail: string;
    previewVideoUrl: string;

    isFeatured?: boolean;
    isCertified?: boolean;

    // Metrics
    enrolledCount: number;

    // Frontend UI Data
    whatYouWillLearn: string;
    skills: string[]; // e.g., "Data Science", "Machine Learning", "Python"
    keyFeatures: {
        title: string;
        description: string;
    }[]; 
    careerPaths: string[]; 
    skillLevel: string; // e.g., "College Students", "Beginner", "Intermediate"
    whoShouldJoin: string; // e.g., "College Students", "Beginner", "Intermediate"

    // Content
    modules: CourseModule["_id"][];

    // Instructor
    instructor: Instructor["_id"][];

    // Pricing Plans
    plans: {
        elite?: Plan["_id"];
        essential?: Plan["_id"];
    }

    // Reviews
    reviews: Review["_id"][];

    // FAQs
    faqs: FAQ["_id"][];

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
    scholarshipQuiz?: Quiz["_id"];
} 