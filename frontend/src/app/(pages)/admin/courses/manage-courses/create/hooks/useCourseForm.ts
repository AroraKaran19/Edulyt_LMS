import { useReducer, useEffect } from 'react';
import { Plan, Instructor, FAQ, Review, FeaturedReview, CourseModule } from '@/types/course';

// Form state type (subset of Course for creation)
export type CourseFormState = {
  // Basic Information
  title: string;
  subtitle: string;
  description: string;
  shortDescription: string;
  category: string;
  subcategory: string;
  thumbnail: string;
  images: string[];
  previewVideoUrl: string;

  // Flags
  isFeatured: boolean;
  isCertified: boolean;

  // UI & Learning Info
  whatYouWillLearn: string;
  skills: string[];
  keyFeatures: {
    title: string;
    description: string;
  }[];
  features: string[];
  careerPaths: string[];
  skillLevel: string;
  whoShouldJoin: string;
  prerequisites: string[];

  // Content
  modules: CourseModule[];

  // Instructor
  instructor: Instructor[];

  // Pricing Plans
  plans: {
    elite: Plan[];
    essential: Plan[];
  };

  // Reviews
  reviews: Review[];
  featuredReviews: FeaturedReview[];

  // FAQs
  faqs: FAQ[];

  // Administrative
  tags: string[];
  audience: "college-students" | "professionals" | "";

  // SEO
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];

  // Scholarship
  scholarship: boolean;
  scholarshipDescription: string;

  // Additional form-specific fields
  duration: string;
  uploadedThumbnail: string | null;
};

// Action types
export type CourseFormAction = 
  // Basic field updates
  | { type: 'SET_FIELD'; field: keyof CourseFormState; value: CourseFormState[keyof CourseFormState] } 
  | { type: 'SET_MULTIPLE_FIELDS'; fields: Partial<CourseFormState> }
  
  // Array operations
  | { type: 'ADD_TO_ARRAY'; field: keyof CourseFormState; value: string | Instructor | Plan | FAQ | Review | FeaturedReview | CourseModule }
  | { type: 'REMOVE_FROM_ARRAY'; field: keyof CourseFormState; index: number }
  | { type: 'UPDATE_ARRAY_ITEM'; field: keyof CourseFormState; index: number; value: string | Instructor | Plan | FAQ | Review | FeaturedReview | CourseModule }
  
  // Complex object operations
  | { type: 'ADD_KEY_FEATURE'; feature: { title: string; description: string } }
  | { type: 'REMOVE_KEY_FEATURE'; index: number }
  | { type: 'UPDATE_KEY_FEATURE'; index: number; feature: { title: string; description: string } }
  
  // Plan operations
  | { type: 'ADD_PLAN'; planType: 'elite' | 'essential'; plan: Plan }
  | { type: 'REMOVE_PLAN'; planType: 'elite' | 'essential'; index: number }
  | { type: 'UPDATE_PLAN'; planType: 'elite' | 'essential'; index: number; plan: Plan }
  
  // Module operations
  | { type: 'ADD_MODULE'; module: CourseModule }
  | { type: 'REMOVE_MODULE'; index: number }
  | { type: 'UPDATE_MODULE'; index: number; module: CourseModule }
  
  // Instructor operations
  | { type: 'ADD_INSTRUCTOR'; instructor: Instructor }
  | { type: 'REMOVE_INSTRUCTOR'; index: number }
  | { type: 'UPDATE_INSTRUCTOR'; index: number; instructor: Instructor }
  
  // FAQ operations
  | { type: 'ADD_FAQ'; faq: FAQ }
  | { type: 'REMOVE_FAQ'; index: number }
  | { type: 'UPDATE_FAQ'; index: number; faq: FAQ }
  
  // Review operations
  | { type: 'ADD_REVIEW'; review: Review }
  | { type: 'REMOVE_REVIEW'; index: number }
  | { type: 'ADD_FEATURED_REVIEW'; review: FeaturedReview }
  | { type: 'REMOVE_FEATURED_REVIEW'; index: number }
  
  // Form management
  | { type: 'LOAD_FROM_STORAGE'; data: Partial<CourseFormState> }
  | { type: 'RESET_FORM' }
  | { type: 'RESET_SECTION'; section: keyof CourseFormState };

// Initial state
const initialState: CourseFormState = {
  // Basic Information
  title: '',
  subtitle: '',
  description: '',
  shortDescription: '',
  category: '',
  subcategory: '',
  thumbnail: '',
  images: [],
  previewVideoUrl: '',

  // Flags
  isFeatured: false,
  isCertified: false,

  // UI & Learning Info
  whatYouWillLearn: '',
  skills: [],
  keyFeatures: [],
  features: [],
  careerPaths: [],
  skillLevel: '',
  whoShouldJoin: '',
  prerequisites: [],

  // Content
  modules: [],

  // Instructor
  instructor: [],

  // Pricing Plans
  plans: {
    elite: [],
    essential: [],
  },

  // Reviews
  reviews: [],
  featuredReviews: [],

  // FAQs
  faqs: [],

  // Administrative
  tags: [],
  audience: '',

  // SEO
  slug: '',
  metaTitle: '',
  metaDescription: '',
  keywords: [],

  // Scholarship
  scholarship: false,
  scholarshipDescription: '',

  // Additional form-specific fields
  duration: '',
  uploadedThumbnail: null,
};

// Reducer function
const courseFormReducer = (state: CourseFormState, action: CourseFormAction): CourseFormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_MULTIPLE_FIELDS':
      return { ...state, ...action.fields };

    case 'ADD_TO_ARRAY': {
      const currentArray = state[action.field] as unknown[];
      return {
        ...state,
        [action.field]: [...currentArray, action.value]
      };
    }

    case 'REMOVE_FROM_ARRAY': {
      const currentArray = state[action.field] as unknown[];
      return {
        ...state,
        [action.field]: currentArray.filter((_, index) => index !== action.index)
      };
    }

    case 'UPDATE_ARRAY_ITEM': {
      const currentArray = state[action.field] as unknown[];
      return {
        ...state,
        [action.field]: currentArray.map((item, index) => 
          index === action.index ? action.value : item
        )
      };
    }

    case 'ADD_KEY_FEATURE':
      return {
        ...state,
        keyFeatures: [...state.keyFeatures, action.feature]
      };

    case 'REMOVE_KEY_FEATURE':
      return {
        ...state,
        keyFeatures: state.keyFeatures.filter((_, index) => index !== action.index)
      };

    case 'UPDATE_KEY_FEATURE':
      return {
        ...state,
        keyFeatures: state.keyFeatures.map((feature, index) =>
          index === action.index ? action.feature : feature
        )
      };

    case 'ADD_PLAN':
      return {
        ...state,
        plans: {
          ...state.plans,
          [action.planType]: [...state.plans[action.planType], action.plan]
        }
      };

    case 'REMOVE_PLAN':
      return {
        ...state,
        plans: {
          ...state.plans,
          [action.planType]: state.plans[action.planType].filter((_, index) => index !== action.index)
        }
      };

    case 'UPDATE_PLAN':
      return {
        ...state,
        plans: {
          ...state.plans,
          [action.planType]: state.plans[action.planType].map((plan, index) =>
            index === action.index ? action.plan : plan
          )
        }
      };

    case 'ADD_MODULE':
      return {
        ...state,
        modules: [...state.modules, action.module]
      };

    case 'REMOVE_MODULE':
      return {
        ...state,
        modules: state.modules.filter((_, index) => index !== action.index)
      };

    case 'UPDATE_MODULE':
      return {
        ...state,
        modules: state.modules.map((module, index) =>
          index === action.index ? action.module : module
        )
      };

    case 'ADD_INSTRUCTOR':
      return {
        ...state,
        instructor: [...state.instructor, action.instructor]
      };

    case 'REMOVE_INSTRUCTOR':
      return {
        ...state,
        instructor: state.instructor.filter((_, index) => index !== action.index)
      };

    case 'UPDATE_INSTRUCTOR':
      return {
        ...state,
        instructor: state.instructor.map((inst, index) =>
          index === action.index ? action.instructor : inst
        )
      };

    case 'ADD_FAQ':
      return {
        ...state,
        faqs: [...state.faqs, action.faq]
      };

    case 'REMOVE_FAQ':
      return {
        ...state,
        faqs: state.faqs.filter((_, index) => index !== action.index)
      };

    case 'UPDATE_FAQ':
      return {
        ...state,
        faqs: state.faqs.map((faq, index) =>
          index === action.index ? action.faq : faq
        )
      };

    case 'ADD_REVIEW':
      return {
        ...state,
        reviews: [...state.reviews, action.review]
      };

    case 'REMOVE_REVIEW':
      return {
        ...state,
        reviews: state.reviews.filter((_, index) => index !== action.index)
      };

    case 'ADD_FEATURED_REVIEW':
      return {
        ...state,
        featuredReviews: [...state.featuredReviews, action.review]
      };

    case 'REMOVE_FEATURED_REVIEW':
      return {
        ...state,
        featuredReviews: state.featuredReviews.filter((_, index) => index !== action.index)
      };

    case 'LOAD_FROM_STORAGE':
      return { ...state, ...action.data };

    case 'RESET_FORM':
      return initialState;

    case 'RESET_SECTION': {
      const resetValue = initialState[action.section];
      return { ...state, [action.section]: resetValue };
    }

    default:
      return state;
  }
};

// Custom hook with localStorage persistence
export const useCourseForm = (storageKey: string = 'course-form-draft') => {
  const [state, dispatch] = useReducer(courseFormReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        dispatch({ type: 'LOAD_FROM_STORAGE', data: parsedData });
      } catch (error) {
        console.warn('Failed to load saved form data:', error);
      }
    }
  }, [storageKey]);

  // Save to localStorage on state change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Filter out null/undefined values and file objects before saving
      const dataToSave = Object.entries(state).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
          (acc as Record<string, unknown>)[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [state, storageKey]);

  // Helper functions for common operations
  const updateField = <K extends keyof CourseFormState>(field: K, value: CourseFormState[K]) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const updateMultipleFields = (fields: Partial<CourseFormState>) => {
    dispatch({ type: 'SET_MULTIPLE_FIELDS', fields });
  };

  const addToArray = (field: keyof CourseFormState, value: string | Instructor | Plan | FAQ | Review | FeaturedReview | CourseModule) => {
    dispatch({ type: 'ADD_TO_ARRAY', field, value });
  };

  const removeFromArray = (field: keyof CourseFormState, index: number) => {
    dispatch({ type: 'REMOVE_FROM_ARRAY', field, index });
  };

  const updateArrayItem = (field: keyof CourseFormState, index: number, value: string | Instructor | Plan | FAQ | Review | FeaturedReview | CourseModule) => {
    dispatch({ type: 'UPDATE_ARRAY_ITEM', field, index, value });
  };

  // Specific helper functions
  const addTag = (tag: string) => {
    if (tag && !state.tags.includes(tag)) {
      addToArray('tags', tag);
    }
  };

  const removeTag = (tag: string) => {
    const index = state.tags.indexOf(tag);
    if (index > -1) {
      removeFromArray('tags', index);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !state.skills.includes(skill)) {
      addToArray('skills', skill);
    }
  };

  const removeSkill = (skill: string) => {
    const index = state.skills.indexOf(skill);
    if (index > -1) {
      removeFromArray('skills', index);
    }
  };

  const addKeyFeature = (feature: { title: string; description: string }) => {
    dispatch({ type: 'ADD_KEY_FEATURE', feature });
  };

  const removeKeyFeature = (index: number) => {
    dispatch({ type: 'REMOVE_KEY_FEATURE', index });
  };

  const updateKeyFeature = (index: number, feature: { title: string; description: string }) => {
    dispatch({ type: 'UPDATE_KEY_FEATURE', index, feature });
  };

  const addPlan = (planType: 'elite' | 'essential', plan: Plan) => {
    dispatch({ type: 'ADD_PLAN', planType, plan });
  };

  const removePlan = (planType: 'elite' | 'essential', index: number) => {
    dispatch({ type: 'REMOVE_PLAN', planType, index });
  };

  const addModule = (module: CourseModule) => {
    dispatch({ type: 'ADD_MODULE', module });
  };

  const removeModule = (index: number) => {
    dispatch({ type: 'REMOVE_MODULE', index });
  };

  const addInstructor = (instructor: Instructor) => {
    dispatch({ type: 'ADD_INSTRUCTOR', instructor });
  };

  const removeInstructor = (index: number) => {
    dispatch({ type: 'REMOVE_INSTRUCTOR', index });
  };

  const addFAQ = (faq: FAQ) => {
    dispatch({ type: 'ADD_FAQ', faq });
  };

  const removeFAQ = (index: number) => {
    dispatch({ type: 'REMOVE_FAQ', index });
  };

  const addReview = (review: Review) => {
    dispatch({ type: 'ADD_REVIEW', review });
  };

  const removeReview = (index: number) => {
    dispatch({ type: 'REMOVE_REVIEW', index });
  };

  const addFeaturedReview = (review: FeaturedReview) => {
    dispatch({ type: 'ADD_FEATURED_REVIEW', review });
  };

  const removeFeaturedReview = (index: number) => {
    dispatch({ type: 'REMOVE_FEATURED_REVIEW', index });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
    localStorage.removeItem(storageKey);
  };

  const clearStorage = () => {
    localStorage.removeItem(storageKey);
  };

  const resetSection = (section: keyof CourseFormState) => {
    dispatch({ type: 'RESET_SECTION', section });
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    updateField('slug', slug);
  };

  return {
    // State
    state,
    dispatch,

    // Basic operations
    updateField,
    updateMultipleFields,
    addToArray,
    removeFromArray,
    updateArrayItem,

    // Specific helpers
    addTag,
    removeTag,
    addSkill,
    removeSkill,
    addKeyFeature,
    removeKeyFeature,
    updateKeyFeature,
    addPlan,
    removePlan,
    addModule,
    removeModule,
    addInstructor,
    removeInstructor,
    addFAQ,
    removeFAQ,
    addReview,
    removeReview,
    addFeaturedReview,
    removeFeaturedReview,

    // Form management
    resetForm,
    clearStorage,
    resetSection,
    generateSlug,

    // Validation helpers
    isBasicInfoValid: () => {
      return !!(state.title && state.description && state.category && state.skillLevel && state.audience);
    },

    isDraft: () => {
      return !state.title && !state.description;
    }
  };
};

export default useCourseForm; 