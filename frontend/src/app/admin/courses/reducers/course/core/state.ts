import { Course } from "@/types";

// ===================
// Frontend-Only Course Interface
// ===================

// Frontend-only fields that should not be sent to backend
interface FrontendOnlyFields {
  thumbnailSource?: "upload" | "url";
  thumbnailS3Key?: string;
  previewVideoSource?: "upload" | "url";
  previewVideoS3Key?: string;
}

// Extended course interface for frontend state management
export interface FrontendCourse extends Course, FrontendOnlyFields {}

// ===================
// State Interface
// ===================

export interface CourseState {
  // Course Data
  course: FrontendCourse;

  // UI States
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  validationErrors: Record<string, string[]>;

  // Form States
  isDirty: boolean;
  hasUnsavedChanges: boolean;

  // Metadata
  lastSaved: Date | null;
  version: number;
}

// ===================
// Initial State
// ===================

export const initialCourseState: CourseState = {
  course: {
    _id: "",
    title: "",
    description: "",
    shortDescription: "",
    category: "",
    thumbnail: "",
    thumbnailSource: undefined,
    thumbnailS3Key: "",
    previewVideoUrl: "",
    previewVideoSource: undefined,
    previewVideoS3Key: "",

    isFeatured: false,
    isCertified: false,

    // UI & Learning Info
    whatYouWillLearn: "",
    skills: [],
    highlights: [
      {
        title: "",
        description: "",
      },
    ],
    features: [],
    careerPaths: [],
    skillLevel: "",
    whoShouldJoin: "",
    prerequisites: [],

    duration: "", // like: 3 months, 1 year, 2 years, etc. (will not be accurate)

    // Content
    moduleIds: [],
    modules: [],

    // Discount settings
    discount: undefined,

    // Instructor
    instructor: [], // can be multiple instructors

    // Pricing Plans
    plans: {
      elite: undefined,
      essential: undefined,
    },

    // Reviews
    reviews: [],
    testimonials: [],

    // FAQs
    faqs: [],

    // Administrative
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    audience: "college-students" as "college-students" | "professionals",

    // SEO
    slug: "",
    metaTitle: "",
    metaDescription: "",
    keywords: [],

    // Scholarship
    scholarship: false,
    scholarshipDescription: "",
    // scholarshipQuiz?: Quiz[];

    // Language
    language: "",

    // Curriculum
    curriculum: "",
    curriculumSource: undefined,
    curriculumS3Key: "",
  },

  // UI States
  isLoading: false,
  isSaving: false,
  error: null,
  validationErrors: {},

  // Form States
  isDirty: false,
  hasUnsavedChanges: false,

  // Metadata
  lastSaved: null,
  version: 1,
};
