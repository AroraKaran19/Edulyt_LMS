// User-related types for Edulyt platform

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}


export interface UserEnrollment {
    id: string;
    courseId: string;
    enrolledDate: Date;
    completedDate?: Date;
    progress: number; // 0-100
    status: 'active' | 'completed' | 'paused' | 'dropped';
    currentLesson?: string;
    certificateId?: string;
    rating?: number;
    review?: string;
    timeSpent: number; // minutes
    lastAccessDate: Date;
    plan: UserEnrollmentPlan;
}

export interface UserEnrollmentPlan {
    type: 'professionals' | 'collegeStudents';
    tier: 'elite' | 'essential';
    price: number;
    features: string[];
    enrolledAt: Date;
    expiresAt?: Date;
}

export interface User {
    // Core user information
    id: string;
    profile: UserProfile;

    // Learning data
    enrollments: UserEnrollment[];

    // Administrative
    role: 'student' | 'instructor' | 'admin';
    status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;

    // Verification status
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isProfileComplete: boolean;
} 