// Course-related types for Edulyt platform

import { Instructor } from './instructor';

export interface CourseLesson {
    id: string;
    title: string;
    duration?: number; // e.g., "abc", "15min"
    videoUrl?: string;
    thumbnailUrl: string,
    description?: string;
    materials?: string[];
    completed?: boolean; // whether on going or completed by the instructor
    isForCollegeStudent?: boolean; // whether this lesson is accessible to college students
}

export interface CourseModule {
    id: string;
    title: string;
    thumbnailUrl: string;
    lessons: CourseLesson[];
    description?: string;
}

export interface PlanDetails {
    elite: {
        price: number;
        features: string[];
    };
    essential: {
        price: number;
        features: string[];
    };
}

export interface CoursePlan {
    professionals: PlanDetails;
    collegeStudents: PlanDetails;
}


export interface FeaturedReview {
    id: string;
    studentName: string;
    rating: number;
    comment: string;
    date: Date;
    verified?: boolean;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    order: number;
}

export interface Course {
    // Basic Information
    id: string;
    title: string;
    subtitle?: string; // e.g., "Unlock the Power of Data with Python"
    description: string;
    shortDescription?: string;
    category: string;
    subcategory?: string;
    thumbnail: string;
    images?: string[];
    previewVideoUrl: string;

    isFeatured?: boolean;
    isCertified: boolean;

    // Metrics
    totalRatings: number;
    enrolledCount: number;

    // Course Details
    language: string;
    skills: {
        icon?: React.ReactNode;
        text: string;
    }[]; // e.g., "Data Science", "Machine Learning", "Python"
    careerPaths: string[];
    skillLevel: string; // e.g., "College Students", "Beginner", "Intermediate"
    lastUpdated: Date;

    // Content
    modules: CourseModule[];
    whatYouWillLearn: string[];
    whoShouldJoin: string;
    prerequisites?: string[];

    // Instructor
    instructor: Instructor[];

    // Pricing Plans
    plan: CoursePlan;
    discount?: number;
    discountEndDate?: Date;

    // Reviews
    featuredReviews: FeaturedReview[];

    // USP & Features
    features: string[];

    // FAQs
    faqs: FAQ[];

    // Administrative
    audience: "collegeStudents" | "professionals";
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags?: string[];

    // SEO
    slug: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];

    // Scholarship
    scholarship?: boolean;
    scholarshipDescription?: string;
    scholarshipLink?: string;
}