import { Course } from "./course";

// ===================
// Form Data Types
// ===================

export interface CourseFormData
  extends Omit<
    Course,
    | "testimonials"
    | "faqs"
    | "reviews"
    | "modules"
    | "moduleIds"
    | "analytics"
    | "createdBy"
    | "createdAt"
    | "updatedAt"
  > {
  // Override testimonials to be string array (IDs) instead of full objects
  testimonials: string[]; // Array of testimonial IDs
  faqs: string[]; // Array of FAQ IDs

  thumbnailSource?: "upload" | "url";
  thumbnailS3Key?: string;
  previewVideoSource?: "upload" | "url";
  previewVideoS3Key?: string;
  curriculumSource?: "upload" | "url";
  curriculumS3Key?: string;
  brochureSource?: "upload" | "url";
  brochureS3Key?: string;

  // Navigation & State
  currentScreen: number;
  completedScreens: number[];
  isEditMode: boolean;
  courseId?: string;
}

// ===================
// Form Context Types
// ===================

export interface CourseFormContextType {
  // Form state
  currentScreen: number;
  completedScreens: number[];
  isEditMode: boolean;
  courseId?: string;

  // Navigation
  nextScreen: () => void;
  prevScreen: () => void;
  goToScreen: (screen: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;

  // Screen validation
  isScreenCompleted: (screen: number) => boolean;
  validateCurrentScreen: () => boolean;
  getScreenErrors: (screen: number) => string[];

  // Form actions
  resetForm: () => void;
  trigger: () => Promise<boolean>;
  saveDraft: () => void;
  loadDraft: () => void;
  clearDraft: () => void;

  // Course actions
  createCourse: () => Promise<void>;
  updateCourse: () => Promise<void>;
  updateCourseMetadata: () => Promise<void>;
  deleteCourse: () => Promise<void>;

  // Loading states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSaving: boolean;

  // Error states
  createError: string;
  updateError: string;
  deleteError: string;
  validationErrors: Record<string, string[]>;

  // Additional utilities
  generateSlug: (title: string) => string;
  generateMetaTitle: (title: string, category: string) => string;
  generateMetaDescription: (
    description: string,
    shortDescription?: string
  ) => string;
  generateKeywords: (
    title: string,
    skills: string[],
    category: string
  ) => string[];
}

// ===================
// Screen Configuration
// ===================

export interface ScreenConfig {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType;
  validation: (data: CourseFormData) => boolean;
  requiredFields: (keyof CourseFormData)[];
  optionalFields: (keyof CourseFormData)[];
}

// ===================
// Validation Types
// ===================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export interface ScreenValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
}

// ===================
// Form Actions Types
// ===================

export interface CreateCourseRequest {
  courseData: Omit<
    CourseFormData,
    "currentScreen" | "completedScreens" | "isEditMode" | "courseId"
  >;
}

export interface UpdateCourseRequest {
  courseId: string;
  courseData: Partial<
    Omit<
      CourseFormData,
      "currentScreen" | "completedScreens" | "isEditMode" | "courseId"
    >
  >;
}

export interface CourseFormResponse {
  success: boolean;
  data?: {
    course: Course;
    courseId: string;
  };
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// ===================
// Storage Types
// ===================

export interface CourseFormStorage {
  formData: CourseFormData;
  lastSaved: string;
  version: string;
}

// ===================
// Hook Types
// ===================

export interface UseCourseFormOptions {
  mode?: "create" | "edit";
  courseId?: string;
  initialData?: Partial<CourseFormData>;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export interface UseCourseFormReturn {
  // Form methods from react-hook-form
  register: any;
  control: any;
  handleSubmit: any;
  watch: any;
  setValue: any;
  getValues: any;
  formState: any;
  reset: any;
  trigger: any;

  // Custom form state
  currentScreen: number;
  completedScreens: number[];
  isEditMode: boolean;
  courseId?: string;

  // Navigation
  nextScreen: () => void;
  prevScreen: () => void;
  goToScreen: (screen: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;

  // Validation
  isScreenCompleted: (screen: number) => boolean;
  validateCurrentScreen: () => boolean;
  getScreenErrors: (screen: number) => string[];

  // Actions
  createCourse: () => Promise<void>;
  updateCourse: () => Promise<void>;
  updateCourseMetadata: () => Promise<void>;
  deleteCourse: () => Promise<void>;
  saveDraft: () => void;
  loadDraft: () => void;
  clearDraft: () => void;

  // Loading states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSaving: boolean;

  // Error states
  createError: string;
  updateError: string;
  deleteError: string;
  validationErrors: Record<string, string[]>;

  // Additional utilities
  generateSlug: (title: string) => string;
  generateMetaTitle: (title: string, category: string) => string;
  generateMetaDescription: (
    description: string,
    shortDescription?: string
  ) => string;
  generateKeywords: (
    title: string,
    skills: string[],
    category: string
  ) => string[];
}

// ===================
// Constants
// ===================

export const SCREEN_CONFIG: Record<number, ScreenConfig> = {
  1: {
    id: 1,
    title: "Basic Information",
    description: "Define the core details of your course",
    component: null as any, // Will be set dynamically
    validation: (data) =>
      !!(data.title && data.description && data.category && data.thumbnail),
    requiredFields: ["title", "description", "category", "thumbnail"],
    optionalFields: [
      "shortDescription",
      "previewVideoUrl",
      "isActive",
      "isFeatured",
      "isCertified",
    ],
  },
  2: {
    id: 2,
    title: "Course Details",
    description: "Add detailed information about your course",
    component: null as any,
    validation: (data) => !!(data.whatYouWillLearn && data.skills?.length > 0),
    requiredFields: ["whatYouWillLearn", "skills"],
    optionalFields: [
      "highlights",
      "features",
      "careerPaths",
      "skillLevel",
      "whoShouldJoin",
      "prerequisites",
      "duration",
      "language",
    ],
  },
  3: {
    id: 3,
    title: "Instructor Information",
    description: "Add instructor details for your course",
    component: null as any,
    validation: (data) => !!(data.instructor && data.instructor.length > 0),
    requiredFields: ["instructor"],
    optionalFields: [],
  },
  4: {
    id: 4,
    title: "Course Content",
    description: "Add modules and lessons to your course",
    component: null as any,
    validation: () => true, // Content is added separately
    requiredFields: [],
    optionalFields: [],
  },
  5: {
    id: 5,
    title: "Pricing & Plans",
    description: "Set up pricing plans for your course",
    component: null as any,
    validation: (data) => !!(data.plans?.essential || data.plans?.elite),
    requiredFields: ["plans"],
    optionalFields: ["discount"],
  },
  6: {
    id: 6,
    title: "Course Modules",
    description: "Add modules and lessons to your course",
    component: null as any,
    validation: () => true, // Modules are managed separately
    requiredFields: [],
    optionalFields: [],
  },
  7: {
    id: 7,
    title: "Testimonials",
    description: "Add testimonials and reviews",
    component: null as any,
    validation: () => true, // Testimonials are optional
    requiredFields: [],
    optionalFields: ["testimonials"],
  },
  8: {
    id: 8,
    title: "SEO Information",
    description: "Optimize your course for search engines",
    component: null as any,
    validation: (data) =>
      !!(data.slug && data.metaTitle && data.metaDescription),
    requiredFields: ["slug", "metaTitle", "metaDescription"],
    optionalFields: ["keywords", "tags"],
  },
  9: {
    id: 9,
    title: "Review & Create",
    description: "Review all information before creating your course",
    component: null as any,
    validation: (data) => {
      // All previous screens must be completed
      return [1, 2, 3, 5, 8].every((screen) =>
        SCREEN_CONFIG[screen].validation(data)
      );
    },
    requiredFields: [],
    optionalFields: [],
  },
  10: {
    id: 10,
    title: "Course Created",
    description: "Your course has been successfully created",
    component: null as any,
    validation: () => true, // No validation needed for success screen
    requiredFields: [],
    optionalFields: [],
  },
  11: {
    id: 11,
    title: "Course Modules & Content",
    description: "Create modules, lessons, and course content",
    component: null as any,
    validation: () => true, // Modules will be managed separately
    requiredFields: [],
    optionalFields: [],
  },
  12: {
    id: 12,
    title: "Course Summary",
    description: "Review your course before publishing",
    component: null as any,
    validation: () => true, // Summary screen - no validation needed
    requiredFields: [],
    optionalFields: [],
  },
};

export const TOTAL_SCREENS = 12;
export const STORAGE_KEY = "course_form_data";
export const DRAFT_KEY = "course_form_draft";
export const VERSION = "1.0.0";
