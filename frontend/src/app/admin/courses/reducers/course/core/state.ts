import { Course } from "@/types";

// ===================
// State Interface
// ===================

export interface CourseState {
  // Course Data
  course: Course;

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
    subcategory: "",
    thumbnail: "",
    thumbnailSource: undefined,
    thumbnailS3Key: "",
    previewVideoUrl: "",
    previewVideoSource: undefined,
    previewVideoS3Key: "",

    isFeatured: false,
    isCertified: false,

    // Analytics
    analytics: {
      totalEnrollments: 0,
      activeEnrollments: 0,
      completionRate: 0,
      averageRating: 0,
      averageCompletionTime: 0,
      dropoffPoints: [],
    },

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
    
    // Discount settings
    discount: undefined,

    // Content - Store full module objects for frontend
    modules: [],

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
    createdBy: "",
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
