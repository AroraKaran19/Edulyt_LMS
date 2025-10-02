import { User, Course } from ".";

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  score?: number; // For quizzes
  timeSpent?: number; // In seconds
  lastAccessedAt?: Date;
}

export interface ModuleProgress {
  moduleId: string;
  completion: number; // 0-100 percentage
  lessons: LessonProgress[];
  startedAt?: Date;
  completedAt?: Date;
}

export interface EnrollmentProgress {
  overallCompletion: number; // 0-100 percentage, precomputed
  modules: ModuleProgress[];
  lastContentAccessed?: {
    moduleId: string;
    lessonId: string;
    contentId: string;
    contentType: "video" | "quiz" | "document";
    lastPosition?: number; // For videos
    timestamp: Date;
  };
}

export interface Enrollment {
  _id?: string;
  userId: User["_id"];
  courseId: Course["_id"];
  enrolledAt: Date;
  status: "active" | "completed" | "dropped" | "paused";
  progress: EnrollmentProgress;
  lastUpdated: Date;
  
  // Optional metadata
  enrollmentSource?: "direct" | "gift" | "promotion";
  giftFrom?: User["_id"]; // If enrolled via gift
  promotionCode?: string; // If enrolled via promotion
  
  // Completion tracking
  completedAt?: Date;
  certificateIssued?: boolean;
  certificateIssuedAt?: Date;
  
  // Analytics
  totalTimeSpent?: number; // In seconds
  lastActivityAt?: Date;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  
  // Populated fields
  course?: Course;
  user?: User;
}

// For bulk operations and analytics
export interface EnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  droppedEnrollments: number;
  averageCompletionRate: number;
  averageTimeToComplete?: number; // In days
}

// For course analytics
export interface CourseEnrollmentStats {
  courseId: Course["_id"];
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number; // Percentage of enrolled students who completed
  averageTimeToComplete?: number; // In days
  recentEnrollments: number; // Last 30 days
}

// For user analytics
export interface UserEnrollmentStats {
  userId: User["_id"];
  totalEnrollments: number;
  completedCourses: number;
  inProgressCourses: number;
  averageCompletionRate: number;
  totalTimeSpent: number; // In seconds
  favoriteCategories: string[];
}

// API Response types
export interface EnrollmentResponse {
  success: boolean;
  data?: {
    enrollment: Enrollment;
  };
  message?: string;
  error?: string;
}

export interface EnrollmentListResponse {
  success: boolean;
  data?: {
    enrollments: Enrollment[];
  };
  message?: string;
  error?: string;
}

export interface EnrollmentStatsResponse {
  success: boolean;
  data?: {
    stats: EnrollmentStats | CourseEnrollmentStats | UserEnrollmentStats;
  };
  message?: string;
  error?: string;
}

export interface EnrollmentCheckResponse {
  success: boolean;
  data?: {
    isEnrolled: boolean;
    enrollment: Enrollment | null;
    status: string | null;
  };
  message?: string;
  error?: string;
}

// Request types
export interface CreateEnrollmentRequest {
  courseId: string;
  enrollmentSource?: "direct" | "gift" | "promotion";
  giftFrom?: string;
  promotionCode?: string;
}

export interface UpdateProgressRequest {
  completed: boolean;
  score?: number;
  timeSpent?: number;
}

export interface UpdateStatusRequest {
  status: "active" | "completed" | "dropped" | "paused";
}

// Query parameters
export interface EnrollmentQueryParams {
  status?: "active" | "completed" | "dropped" | "paused";
  page?: number;
  limit?: number;
  sortBy?: "enrolledAt" | "lastUpdated" | "progress.overallCompletion";
  sortOrder?: "asc" | "desc";
}
