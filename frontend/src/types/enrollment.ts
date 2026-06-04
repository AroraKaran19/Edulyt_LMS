import { User, Course } from ".";

// Content completion tracking with timestamp
export interface ContentCompletion {
  contentId: string;
  completedAt: Date;
  moduleId?: string;
  lessonId?: string;
  contentType?: "video" | "quiz" | "document";
  timeSpent?: number; // Time spent on this content in minutes
}

// Simplified progress structure
export interface EnrollmentProgressSummary {
  overallCompletion: number; // 0-100 percentage, computed from module progress
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  lastActivityAt?: Date;
}

// ===================
// Partial Access Control Types
// ===================

/**
 * Defines which content items (videos, quizzes, documents) a user can access within a lesson
 */
export interface LessonAccessControl {
  lessonId: string;
  /**
   * Array of content IDs the user can access within this lesson
   * If undefined or empty array, user has access to all contents in the lesson
   */
  accessibleContentIds?: string[];
}

/**
 * Defines which lessons and their contents a user can access within a module
 */
export interface ModuleAccessControl {
  moduleId: string;
  /**
   * Array of lessons the user can access within this module
   * Each lesson can have specific content restrictions
   * If undefined or empty array, user has access to all lessons in the module
   */
  accessibleLessons?: LessonAccessControl[];
}

/**
 * Partial access control for an enrollment
 * If undefined or null, the user has full access to the entire course
 * If provided, it specifies exactly which modules, lessons, and contents are accessible
 */
export interface PartialAccessControl {
  /**
   * Array of modules the user can access
   * Each module can have specific lesson and content restrictions
   * If undefined or empty array, user has access to all modules in the course
   */
  accessibleModules?: ModuleAccessControl[];
  
  /**
   * Access type: 'full' means full course access, 'partial' means restricted access
   * This is a convenience field for quick checks
   */
  accessType: "full" | "partial";
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
  userId: User | string;
  courseId: Course | string | null;
  /** Snapshot of the course title at enrollment time. Shown when the course was
   *  deleted/unlinked (courseId === null) so enrollment history is preserved. */
  courseName?: string;
  enrolledAt: Date;
  status: "active" | "completed" | "dropped" | "revoked" | "paused";
  progress: EnrollmentProgressSummary; // Simplified progress summary
  completedContents: ContentCompletion[]; // Array of completed content with timestamps
  lastUpdated: Date;
  
  // Optional metadata
  enrollmentSource?: "direct" | "gift" | "promotion" | "trial";
  giftFrom?: User["_id"]; // If enrolled via gift
  promotionCode?: string; // If enrolled via promotion
  planType?: "elite" | "essential"; // Plan type for the enrollment
  
  // Partial access control (for admin-controlled access)
  // If undefined or null, user has full access to the entire course
  // If provided, specifies which modules, lessons, and contents are accessible
  accessControl?: PartialAccessControl;
  
  // Completion tracking
  completedAt?: Date;
  certificateIssued?: boolean;
  certificateIssuedAt?: Date;
  
  // Analytics
  totalTimeSpent?: number; // In seconds
  lastActivityAt?: Date;
  
  // Trial enrollment fields
  isTrial?: boolean; // Whether this is a trial enrollment
  trialExpiresAt?: Date | string; // When the trial expires (for TTL auto-deletion)
  trialDurationDays?: number; // Number of days the trial lasts (defaults to 7)
  
  // Validity period for non-trial enrollments (4 years from enrollment date)
  validUntil?: Date | string; // When the enrollment expires (4 years from enrolledAt for non-trial enrollments)
  
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
