import { Course } from "../../../../types/course";

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
    previewVideoUrl: "",

    isFeatured: false,
    isCertified: false,

    // Metrics
    enrolledCount: 0,
    totalRatings: 0,

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
    fakeDiscount: 0, // in percentage for display purposes
    duration: "", // like: 3 months, 1 year, 2 years, etc. (will not be accurate)

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
