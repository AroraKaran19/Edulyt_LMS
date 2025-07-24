// ===================
// User-related types for Edulyt platform
// ===================

// ===================
// Profile & Authentication Types
// ===================

export interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  profileImage?: string;
  bio?: string;
  // Address information
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  // Professional information
  occupation?: string;
  organization?: string;
  experience?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  // Preferences
  timezone?: string;
  language?: string;
  emailNotifications?: boolean;
  marketingEmails?: boolean;
}

export interface SocialProfile {
  provider: "google" | "linkedin";
  providerId: string;
  email: string;
  name: string;
  picture?: string;
  connectedAt: Date;
}

// ===================
// Learning & Progress Types
// ===================

export interface UserVideoNote {
  _id: string;
  contentId: string;
  note: string;
  timestamp: number; // in seconds
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// export interface UserBookmark {
//   _id: string;
//   courseId: string;
//   moduleId?: string;
//   lessonId?: string;
//   lessonContentId?: string;
//   title: string;
//   description?: string;
//   timestamp?: number; // for video bookmarks
//   createdAt: Date;
// }

export interface UserLearningStreak {
  currentStreak: number; // days
  longestStreak: number; // days
  lastActivityDate: Date;
  totalActiveDays: number;
}

export interface UserLearningStats {
  totalTimeSpent: number; // minutes
  coursesCompleted: number;
  coursesInProgress: number;
  certificatesEarned: number;
  averageRating: number; // user's average rating given to courses
  streak: UserLearningStreak;
  weeklyGoal?: number; // minutes per week
  dailyGoal?: number; // minutes per day
}

// ===================
// Enrollment & Progress Types
// ===================

export interface UserEnrollmentPlan {
  tier: "elite" | "essential";
  price: number;
  enrolledAt: Date;
  expiresAt?: Date;
  paymentId?: string;
  discountApplied?: {
    code: string;
    amount: number;
    type: "percentage" | "fixed";
  };
}

// export interface UserQuizAttempt {
//   _id: string;
//   quizId: string;
//   score: number;
//   totalQuestions: number;
//   correctAnswers: number;
//   timeSpent: number; // seconds
//   answers: {
//     questionId: string;
//     selectedOptions: string[];
//     isCorrect: boolean;
//   }[];
//   attemptedAt: Date;
//   passed: boolean;
// }

export interface UserEnrollment {
  _id: string;
  courseId: string;
  enrolledDate: Date;
  completedDate?: Date;
  progress: number; // 0-100
  status: "active" | "completed" | "paused" | "expired";

  // Current position tracking
  currentModule?: string;
  currentLesson?: string;
  currentLessonContent?: string;
  lastWatchedTimestamp?: number; // for video resume

  // Completion tracking
  completedModules: string[];
  completedLessons: string[];
  completedLessonContent: string[];

  // Engagement metrics
  timeSpent: number; // minutes
  lastAccessDate: Date;
  totalVideoWatched: number; // minutes
  // quizAttempts: UserQuizAttempt[];

  // Plan and payment
  plan: UserEnrollmentPlan;

  // User feedback
  rating?: number; // 1-5
  review?: string;
  reviewDate?: Date;

  // Certificates
  certificateId?: string;
  certificateIssuedAt?: Date;
  certificateUrl?: string;

  // Notes and bookmarks for this course
  notes: UserVideoNote[];
  // bookmarks: UserBookmark[];
}

// ===================
// Notification & Activity Types
// ===================

export interface UserNotification {
  _id: string;
  type:
    | "course_update"
    | "new_course"
    | "certificate"
    | "reminder"
    | "announcement"
    | "promotion";
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: {
    courseId?: string;
    enrollmentId?: string;
    [key: string]: unknown;
  };
}

export interface UserActivity {
  _id: string;
  type:
    | "course_enrolled"
    | "lesson_completed"
    | "quiz_passed"
    | "certificate_earned"
    | "course_completed"
    | "note_added"
    | "bookmark_added";
  description: string;
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  metadata?: {
    score?: number;
    timeSpent?: number;
    [key: string]: unknown;
  };
  createdAt: Date;
}

// ===================
// Goals & Achievements Types
// ===================

export interface UserGoal {
  _id: string;
  type: "daily_time" | "weekly_time" | "monthly_courses" | "streak" | "custom";
  title: string;
  description?: string;
  target: number;
  current: number;
  unit: "minutes" | "hours" | "courses" | "days" | "lessons";
  deadline?: Date;
  isActive: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface UserAchievement {
  _id: string;
  type:
    | "first_course"
    | "streak_7"
    | "streak_30"
    | "fast_learner"
    | "course_master"
    | "review_writer";
  title: string;
  description: string;
  iconUrl?: string;
  unlockedAt: Date;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// ===================
// Application & Scholarship Types
// ===================

export interface ScholarshipApplication {
  _id: string;
  courseId: string;
  applicationDate: Date;
  status: "pending" | "approved" | "rejected" | "waitlisted";
  documents: {
    type:
      | "transcript"
      | "essay"
      | "recommendation"
      | "financial_proof"
      | "portfolio";
    name: string;
    url: string;
    uploadedAt: Date;
  }[];
  essay?: string;
  // quizResults?: UserQuizAttempt[];
  reviewNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  notificationSent?: boolean;
}

export interface InternshipApplication {
  _id: string;
  internshipId: string;
  applicationDate: Date;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "interview_scheduled"
    | "completed";
  resume?: string;
  coverLetter?: string;
  portfolio?: string;
  documents: {
    type: string;
    name: string;
    url: string;
    uploadedAt: Date;
  }[];
  interviewDate?: Date;
  interviewNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

// ===================
// Main User Type
// ===================

export interface User {
  // Core user information
  _id: string;
  profile: UserProfile;
  socialProfiles?: SocialProfile[];

  // Learning data
  enrollments: UserEnrollment[];
  learningStats: UserLearningStats;

  // Goals and achievements
  goals: UserGoal[];
  achievements: UserAchievement[];

  // Communication
  notifications: UserNotification[];
  activities: UserActivity[];

  // Applications
  scholarshipApplications: ScholarshipApplication[];
  internshipApplications: InternshipApplication[];

  // Administrative
  role: "student" | "instructor" | "admin" | "moderator" | "third-party";
  status:
    | "active"
    | "inactive"
    | "suspended"
    | "pending_verification"
    | "banned";

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;

  // Verification status
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;
  isInstructor?: boolean; // if user can create courses

  // Preferences
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: "public" | "private" | "friends";
      showProgress: boolean;
      showAchievements: boolean;
    };
    learning: {
      autoplay: boolean;
      playbackSpeed: number;
      subtitles: boolean;
      quality: "auto" | "1080p" | "720p" | "480p" | "360p";
    };
  };

  // Analytics and tracking (optional for admin insights)
  analytics?: {
    totalLoginDays: number;
    averageSessionTime: number; // minutes
    deviceTypes: string[];
    referralSource?: string;
    lastActiveDevice?: string;
    geolocation?: {
      country: string;
      city: string;
    };
  };
}

// ===================
// API Response Types
// ===================

export interface UserPublicProfile {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  bio?: string;
  joinedAt: Date;
  learningStats: {
    coursesCompleted: number;
    certificatesEarned: number;
    currentStreak: number;
  };
  achievements: UserAchievement[];
  // Only if user allows public visibility
  currentCourses?: {
    courseId: string;
    courseTitle: string;
    progress: number;
  }[];
}

export interface UserDashboardData {
  user: Pick<User, "_id" | "profile" | "learningStats" | "preferences">;
  recentActivities: UserActivity[];
  currentCourses: UserEnrollment[];
  upcomingDeadlines: {
    type: "assignment" | "quiz" | "course_deadline";
    title: string;
    deadline: Date;
    courseId?: string;
  }[];
  suggestions: {
    courses: string[]; // course IDs
    instructors: string[]; // instructor IDs
  };
  notifications: UserNotification[];
}

// ===================
// Utility Types
// ===================

export type UserRole = User["role"];
export type UserStatus = User["status"];
export type EnrollmentStatus = UserEnrollment["status"];
export type NotificationType = UserNotification["type"];
export type ActivityType = UserActivity["type"];
export type GoalType = UserGoal["type"];
export type AchievementType = UserAchievement["type"];
