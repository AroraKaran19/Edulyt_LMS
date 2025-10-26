import { User, Course } from ".";

// Simplified progress structure
export interface EnrollmentProgressSummary {
  overallCompletion: number; // 0-100 percentage, computed from module progress
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  lastActivityAt?: Date;
}

// Last accessed content (stored separately for performance)
export interface LastContentAccessed {
  moduleId: string;
  lessonId: string;
  contentId: string;
  contentType: "video" | "quiz" | "document";
  lastPosition?: number; // For videos
  timestamp: Date;
}

export interface Enrollment {
  _id?: string;
  userId: User["_id"];
  courseId: Course["_id"];
  enrolledAt: Date;
  status: "active" | "completed" | "dropped" | "paused";
  progress: EnrollmentProgressSummary; // Simplified progress summary
  completedContents: string[]; // Array of completed content IDs
  lastUpdated: Date;
  
  // Optional metadata
  enrollmentSource?: "direct" | "gift" | "promotion";
  giftFrom?: User["_id"] | string; // If enrolled via gift (can be user ID or system string)
  promotionCode?: string; // If enrolled via promotion
  
  // Completion tracking
  completedAt?: Date;
  certificateIssued?: boolean;
  certificateIssuedAt?: Date;
  
  // Analytics
  totalTimeSpent?: number; // In seconds
  lastActivityAt?: Date;
  
  // Last accessed content
  lastContentAccessed?: LastContentAccessed;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// For detailed progress queries (when needed)
export interface DetailedEnrollmentProgress {
  enrollmentId: string;
  progress: EnrollmentProgressSummary;
  lastContentAccessed?: LastContentAccessed;
  moduleProgress: Array<{
    moduleId: string;
    completion: number;
    startedAt?: Date;
    completedAt?: Date;
    lessons: Array<{
      lessonId: string;
      completed: boolean;
      completedAt?: Date;
      score?: number;
      timeSpent?: number;
      lastAccessedAt?: Date;
    }>;
  }>;
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
