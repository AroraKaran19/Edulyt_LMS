import { useState, useEffect, useCallback } from "react";
import {
  Plan,
  FAQ,
  Review,
  FeaturedReview,
  CourseModule,
  Discount,
} from "@/types/course";
import { Instructor } from "@/types";

// Simplified form state type
export type CourseFormState = {
  // Basic Information - required
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  previewVideoUrl: string;
  
  // Optional basic fields
  shortDescription?: string;
  subcategory?: string;

  // Flags
  isFeatured: boolean;
  isCertified: boolean;

  // Metrics
  enrolledCount: number;
  totalRatings: number;
  totalLectures: number;

  // Learning Information - required
  whatYouWillLearn: string;
  skillLevel: string;
  whoShouldJoin: string;
  duration: string;
  
  // Arrays
  skills: string[];
  keyFeatures: Array<{ title: string; description: string }>;
  features: string[];
  careerPaths: string[];
  prerequisites: string[];

  // Content
  modules: CourseModule[];
  instructor: Instructor[];

  // Pricing
  plans: {
    elite?: Plan;
    essential?: Plan;
  };

  // Reviews and FAQs
  reviews: Review[];
  featuredReviews: FeaturedReview[];
  faqs: FAQ[];

  // Administrative
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  language: string;
  audience: "college-students" | "professionals";
  tags: string[];

  // SEO
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];

  // Scholarship
  scholarship: boolean;
  scholarshipDescription?: string;

  // Additional
  uploadedThumbnail: string | null;
  discount?: Discount;
};

// Initial state with sensible defaults
const initialState: CourseFormState = {
  // Basic Information
  title: "",
  description: "",
  category: "",
  thumbnail: "",
  previewVideoUrl: "",
  shortDescription: "",
  subcategory: "",

  // Flags
  isFeatured: false,
  isCertified: false,

  // Metrics
  enrolledCount: 0,
  totalRatings: 0,
  totalLectures: 0,

  // Learning Information
  whatYouWillLearn: "",
  skillLevel: "",
  whoShouldJoin: "",
  duration: "",

  // Arrays
  skills: [],
  keyFeatures: [],
  features: [],
  careerPaths: [],
  prerequisites: [],

  // Content
  modules: [],
  instructor: [],

  // Pricing
  plans: {},

  // Reviews and FAQs
  reviews: [],
  featuredReviews: [],
  faqs: [],

  // Administrative
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "",
  language: "English",
  audience: "college-students",
  tags: [],

  // SEO
  slug: "",
  metaTitle: "",
  metaDescription: "",
  keywords: [],

  // Scholarship
  scholarship: false,
  scholarshipDescription: "",

  // Additional
  uploadedThumbnail: null,
  discount: undefined,
};

// Simplified hook using useState instead of useReducer
export const useCourseForm = (storageKey: string = "course-form-draft") => {
  const [state, setState] = useState<CourseFormState>(initialState);

  useEffect(() => {
    console.log("state", state);
  }, [state]);

  // Auto-save to localStorage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.warn("Failed to save form data:", error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state, storageKey]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);
        setState(prevState => ({ ...prevState, ...parsedData }));
      }
    } catch (error) {
      console.warn("Failed to load saved form data:", error);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Generic field update function
  const updateField = useCallback(<K extends keyof CourseFormState>(
    field: K,
    value: CourseFormState[K]
  ) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((fields: Partial<CourseFormState>) => {
    setState(prev => ({ ...prev, ...fields }));
  }, []);

  // Array helpers
  const addToArray = useCallback(<K extends keyof CourseFormState>(
    field: K,
    item: CourseFormState[K] extends Array<infer T> ? T : never
  ) => {
    setState(prev => {
      const currentArray = prev[field] as Array<typeof item>;
      return { ...prev, [field]: [...currentArray, item] };
    });
  }, []);

  const removeFromArray = useCallback(<K extends keyof CourseFormState>(
    field: K,
    index: number
  ) => {
    setState(prev => {
      const currentArray = prev[field] as unknown[];
      return { ...prev, [field]: currentArray.filter((_, i) => i !== index) };
    });
  }, []);

  const updateArrayItem = useCallback(<K extends keyof CourseFormState>(
    field: K,
    index: number,
    item: CourseFormState[K] extends Array<infer T> ? T : never
  ) => {
    setState(prev => {
      const currentArray = prev[field] as Array<typeof item>;
      return {
        ...prev,
        [field]: currentArray.map((existing, i) => i === index ? item : existing)
      };
    });
  }, []);

  // Specific helper functions for common operations
  const addSkill = useCallback((skill: string) => {
    if (skill.trim() && !state.skills.includes(skill.trim())) {
      addToArray("skills", skill.trim());
    }
  }, [state.skills, addToArray]);

  const removeSkill = useCallback((index: number) => {
    removeFromArray("skills", index);
  }, [removeFromArray]);

  const addTag = useCallback((tag: string) => {
    if (tag.trim() && !state.tags.includes(tag.trim())) {
      addToArray("tags", tag.trim());
    }
  }, [state.tags, addToArray]);

  const removeTag = useCallback((index: number) => {
    removeFromArray("tags", index);
  }, [removeFromArray]);

  const addKeyFeature = useCallback((feature: { title: string; description: string }) => {
    if (feature.title.trim() && feature.description.trim()) {
      addToArray("keyFeatures", feature);
    }
  }, [addToArray]);

  const updateKeyFeature = useCallback((index: number, feature: { title: string; description: string }) => {
    updateArrayItem("keyFeatures", index, feature);
  }, [updateArrayItem]);

  const removeKeyFeature = useCallback((index: number) => {
    removeFromArray("keyFeatures", index);
  }, [removeFromArray]);

  const setPlan = useCallback((planType: "elite" | "essential", plan: Plan) => {
    setState(prev => ({
      ...prev,
      plans: { ...prev.plans, [planType]: plan }
    }));
  }, []);

  const removePlan = useCallback((planType: "elite" | "essential") => {
    setState(prev => {
      const newPlans = { ...prev.plans };
      delete newPlans[planType];
      return { ...prev, plans: newPlans };
    });
  }, []);

  const addModule = useCallback((module: CourseModule) => {
    addToArray("modules", module);
  }, [addToArray]);

  const updateModule = useCallback((index: number, module: CourseModule) => {
    updateArrayItem("modules", index, module);
  }, [updateArrayItem]);

  const removeModule = useCallback((index: number) => {
    removeFromArray("modules", index);
  }, [removeFromArray]);

  const addInstructor = useCallback((instructor: Instructor) => {
    addToArray("instructor", instructor);
  }, [addToArray]);

  const updateInstructor = useCallback((index: number, instructor: Instructor) => {
    updateArrayItem("instructor", index, instructor);
  }, [updateArrayItem]);

  const removeInstructor = useCallback((index: number) => {
    removeFromArray("instructor", index);
  }, [removeFromArray]);

  const addFAQ = useCallback((faq: FAQ) => {
    if (faq.question.trim() && faq.answer.trim()) {
      addToArray("faqs", faq);
    }
  }, [addToArray]);

  const updateFAQ = useCallback((index: number, faq: FAQ) => {
    updateArrayItem("faqs", index, faq);
  }, [updateArrayItem]);

  const removeFAQ = useCallback((index: number) => {
    removeFromArray("faqs", index);
  }, [removeFromArray]);

  const addReview = useCallback((review: Review) => {
    addToArray("reviews", review);
  }, [addToArray]);

  const removeReview = useCallback((index: number) => {
    removeFromArray("reviews", index);
  }, [removeFromArray]);

  const addFeaturedReview = useCallback((review: FeaturedReview) => {
    addToArray("featuredReviews", review);
  }, [addToArray]);

  const removeFeaturedReview = useCallback((index: number) => {
    removeFromArray("featuredReviews", index);
  }, [removeFromArray]);

  // Auto-generate slug from title
  const generateSlug = useCallback(() => {
    if (state.title) {
      const slug = state.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      updateField("slug", slug);
    }
  }, [state.title, updateField]);

  // Load existing course data
  const loadCourseData = useCallback((courseData: Partial<CourseFormState>) => {
    try {
      const cleanData: Partial<CourseFormState> = {
        title: courseData.title || "",
        description: courseData.description || "",
        shortDescription: courseData.shortDescription || "",
        category: courseData.category || "",
        subcategory: courseData.subcategory || "",
        thumbnail: courseData.thumbnail || "",
        previewVideoUrl: courseData.previewVideoUrl || "",
        
        isFeatured: courseData.isFeatured || false,
        isCertified: courseData.isCertified || false,
        
        enrolledCount: courseData.enrolledCount || 0,
        totalRatings: courseData.totalRatings || 0,
        totalLectures: courseData.totalLectures || 0,
        
        whatYouWillLearn: courseData.whatYouWillLearn || "",
        skillLevel: courseData.skillLevel || "",
        whoShouldJoin: courseData.whoShouldJoin || "",
        duration: courseData.duration || "",
        
        skills: Array.isArray(courseData.skills) ? courseData.skills : [],
        keyFeatures: Array.isArray(courseData.keyFeatures) ? courseData.keyFeatures : [],
        features: Array.isArray(courseData.features) ? courseData.features : [],
        careerPaths: Array.isArray(courseData.careerPaths) ? courseData.careerPaths : [],
        prerequisites: Array.isArray(courseData.prerequisites) ? courseData.prerequisites : [],
        
        modules: Array.isArray(courseData.modules) ? courseData.modules : [],
        instructor: Array.isArray(courseData.instructor) ? courseData.instructor : [],
        
        plans: courseData.plans || {},
        
        reviews: Array.isArray(courseData.reviews) ? courseData.reviews : [],
        featuredReviews: Array.isArray(courseData.featuredReviews) ? courseData.featuredReviews : [],
        faqs: Array.isArray(courseData.faqs) ? courseData.faqs : [],
        
        isActive: courseData.isActive !== undefined ? courseData.isActive : true,
        language: courseData.language || "en",
        audience: courseData.audience || "college-students",
        tags: Array.isArray(courseData.tags) ? courseData.tags : [],
        
        slug: courseData.slug || "",
        metaTitle: courseData.metaTitle || "",
        metaDescription: courseData.metaDescription || "",
        keywords: Array.isArray(courseData.keywords) ? courseData.keywords : [],
        
        scholarship: courseData.scholarship || false,
        scholarshipDescription: courseData.scholarshipDescription || "",
        
        uploadedThumbnail: courseData.thumbnail || null,
        discount: courseData.discount || undefined,
        
        createdBy: courseData.createdBy || "",
        createdAt: courseData.createdAt ? new Date(courseData.createdAt) : new Date(),
        updatedAt: new Date(),
      };
      
      setState(prev => ({ ...prev, ...cleanData }));
    } catch (error) {
      console.error("Failed to load course data:", error);
    }
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setState(initialState);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Clear storage
  const clearStorage = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Validation helpers
  const isBasicInfoValid = useCallback(() => {
    return !!(
      state.title.trim() &&
      state.description.trim() &&
      state.category.trim() &&
      state.thumbnail.trim() &&
      state.previewVideoUrl.trim() &&
      state.skillLevel.trim() &&
      state.whatYouWillLearn.trim() &&
      state.whoShouldJoin.trim() &&
      state.duration.trim() &&
      state.language.trim()
    );
  }, [state]);

  const isDraft = useCallback(() => {
    return !state.title.trim() && !state.description.trim();
  }, [state.title, state.description]);

  return {
    // State
    state,
    
    // Basic operations
    updateField,
    updateFields,
    
    // Array operations
    addToArray,
    removeFromArray,
    updateArrayItem,
    
    // Specific helpers
    addSkill,
    removeSkill,
    addTag,
    removeTag,
    addKeyFeature,
    updateKeyFeature,
    removeKeyFeature,
    setPlan,
    removePlan,
    addModule,
    updateModule,
    removeModule,
    addInstructor,
    updateInstructor,
    removeInstructor,
    addFAQ,
    updateFAQ,
    removeFAQ,
    addReview,
    removeReview,
    addFeaturedReview,
    removeFeaturedReview,
    
    // Utilities
    generateSlug,
    loadCourseData,
    resetForm,
    clearStorage,
    
    // Validation
    isBasicInfoValid,
    isDraft,
  };
};

export default useCourseForm;
