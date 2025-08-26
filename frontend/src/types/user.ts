// ===================
// User Interface
// ===================

interface Marks {
  score: number;
  unit: 'percentage' | 'cgpa';
}

interface PursuingMarks {
  period: string;
  score: number;
  unit: 'percentage' | 'cgpa';
  createdAt?: Date;
  updatedAt?: Date;
}

interface SocialProfiles {
  linkedin?: string;
  github?: string;
}

interface User {
  _id?: string;
  role: 'super-admin' | 'admin' | 'instructor' | 'affiliate' | 'user';
  username: string;
  fullName: string;
  profilePicture?: string;
  email: string;
  password: string;
  phone: string;
  isPhoneVerified: boolean;
  dob: Date;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  experienceLevel: 'Student' | 'Graduate' | 'Post Graduate' | 'Fresher' | '0 - 2 Years' | '2 - 5 Years' | '5 - 10 Years';
  universityName?: string;
  collegeName?: string;
  collegeState?: string;
  country: string;
  currentDegree?: 'graduation' | 'postgraduation' | '';
  currentCourse?: string;
  socialProfiles: SocialProfiles;
  placementCellEmail?: string;
  guardianPhone?: string;
  isGuardianPhoneVerified?: boolean;
  tenthMarks?: Marks;
  twelfthMarks?: Marks;
  pursuingMarks?: PursuingMarks[];
  enrolledCourses?: string[]; // Array of Course IDs
  referral?: string;
  refreshToken?: string;
  pendingPayments?: string[]; // Array of Order IDs whos status is pending
  provider?: 'google' | 'linkedin' | 'credentials';
  progress?: UserProgress;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===================
// User Progress Interface
// ===================

interface QuizAttempt {
  attemptNumber: number;
  score: number;
  passed: boolean;
  answers: {
    questionIndex: number;
    selectedAnswers: string[];
  }[];
  attemptedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContentProgress {
  contentId: string; // Content ID
  type: 'video' | 'quiz';
  completed: boolean;
  progress: number;
  watchedTime?: number;
  attempts?: QuizAttempt[];
  lastAccessed?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LessonProgress {
  lessonId: string; // CourseLesson ID
  completed: boolean;
  progress: number;
  contents: ContentProgress[];
  lastAccessed?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ModuleProgress {
  moduleId: string; // CourseModule ID
  completed: boolean;
  progress: number;
  lessons: LessonProgress[];
  lastAccessed?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserProgress {
  _id?: string;
  userId: string; // User ID
  courseId: string; // Course ID
  enrolledAt: Date;
  completed: boolean;
  completionDate?: Date;
  overallProgress: number;
  totalTimeSpent: number;
  modules: ModuleProgress[];
  certificateIssued: boolean;
  certificateUrl?: string;
  lastAccessed?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type { User, UserProgress, Marks, PursuingMarks, SocialProfiles, QuizAttempt, ContentProgress, LessonProgress, ModuleProgress };