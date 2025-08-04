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
    slug: "",
    language: "English",
    
    // Status
    isFeatured: false,
    isCertified: false,
    isActive: true,
    scholarship: false,
    scholarshipDescription: "",
    
    // Metrics
    enrolledCount: 0,
    totalRatings: 0,
    totalLectures: 0,
    
    // Learning Info
    whatYouWillLearn: "",
    skills: [],
    keyFeatures: [],
    features: [],
    careerPaths: [],
    skillLevel: "Beginner",
    whoShouldJoin: "",
    prerequisites: [],
    discount: undefined,
    audience: "college-students",
    duration: "",
    tags: [],
    
    // Content
    modules: [],
    instructor: [],
    plans: {},
    
    // Reviews & FAQs
    reviews: [],
    featuredReviews: [],
    faqs: [],
    
    // Quiz
    scholarshipQuiz: [],
    
    // SEO
    metaTitle: "",
    metaDescription: "",
    keywords: [],
    
    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "",
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