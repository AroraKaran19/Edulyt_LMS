// Course-related types for Edulyt platform

import { Instructor } from './instructor';

export interface CourseLesson {
    id: string;
    title: string;
    duration?: string; // e.g., "abc", "15min"
    videoUrl?: string;
    materials?: string[];
    completed?: boolean; // whether on going or completed by the instructor
    isForCollegeStudent?: boolean; // whether this lesson is accessible to college students
}

export interface CourseModule {
    id: string;
    title: string;
    duration: string; // e.g., "1hr 30min"
    lessons: CourseLesson[];
    description?: string;
}

export interface PlanDetails {
    price: number;
    features: string[];
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
    totalLectures: number;

    // Course Details
    language: string;
    skillLevel: string; // e.g., "College Students", "Beginner", "Intermediate"
    duration?: string;
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
    discount: number;

    // Reviews
    featuredReviews: FeaturedReview[];

    // USP & Features
    features: string[];

    // FAQs
    faqs: FAQ[];

    // Administrative
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
} 