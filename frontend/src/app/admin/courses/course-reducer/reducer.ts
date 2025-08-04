import { CourseActionType, CourseAction } from "./actions";
import { CourseState, initialCourseState } from "./state";
import { validateAction, ValidationError } from "./validation";

// ===================
// Error Handling Types
// ===================

export interface ReducerError {
  type: "VALIDATION_ERROR" | "RUNTIME_ERROR" | "BUSINESS_LOGIC_ERROR";
  message: string;
  code: string;
  field?: string;
  details?: any;
}

export interface ReducerResult {
  state: CourseState;
  error?: ReducerError;
  warnings?: string[];
}

// ===================
// Error Handling Utilities
// ===================

const createReducerError = (
  type: ReducerError["type"],
  message: string,
  code: string,
  field?: string,
  details?: any
): ReducerError => ({
  type,
  message,
  code,
  field,
  details
});

const handleValidationError = (validationErrors: ValidationError[]): ReducerError => {
  const firstError = validationErrors[0];
  return createReducerError(
    "VALIDATION_ERROR",
    firstError.message,
    firstError.code,
    firstError.field,
    { allErrors: validationErrors }
  );
};

const handleRuntimeError = (error: Error, action: CourseAction): ReducerError => {
  return createReducerError(
    "RUNTIME_ERROR",
    `Runtime error in ${action.type}: ${error.message}`,
    "RUNTIME_ERROR",
    undefined,
    { originalError: error, action }
  );
};

const handleBusinessLogicError = (message: string, code: string, field?: string): ReducerError => {
  return createReducerError(
    "BUSINESS_LOGIC_ERROR",
    message,
    code,
    field
  );
};

// ===================
// Safe State Update Utilities
// ===================

const safeUpdateCourseField = (state: CourseState, field: string, value: any): CourseState => {
  // Validate field exists on course object
  if (!(field in state.course)) {
    throw new Error(`Invalid field '${field}' for course update`);
  }

  return {
    ...state,
    course: {
      ...state.course,
      [field]: value,
    },
    isDirty: true,
    hasUnsavedChanges: true,
  };
};

const safeUpdateArrayItem = <T extends { _id?: string }>(
  array: T[],
  id: string,
  updates: Partial<T>
): T[] => {
  const index = array.findIndex(item => item._id === id);
  if (index === -1) {
    throw new Error(`Item with ID '${id}' not found in array`);
  }

  return array.map((item, i) => 
    i === index ? { ...item, ...updates } : item
  );
};

const safeRemoveArrayItem = <T extends { _id?: string }>(
  array: T[],
  id: string
): T[] => {
  const index = array.findIndex(item => item._id === id);
  if (index === -1) {
    throw new Error(`Item with ID '${id}' not found in array`);
  }

  return array.filter(item => item._id !== id);
};

// ===================
// Enhanced Reducer
// ===================

export const courseReducer = (state: CourseState, action: CourseAction): ReducerResult => {
  try {
    // Validate action before processing
    const validationResult = validateAction(action, state);
    if (!validationResult.isValid) {
      const error = handleValidationError(validationResult.errors);
      return {
        state: {
          ...state,
          error: error.message,
          validationErrors: validationResult.errors.reduce((acc, err) => {
            if (!acc[err.field]) acc[err.field] = [];
            acc[err.field].push(err.message);
            return acc;
          }, {} as Record<string, string[]>)
        },
        error
      };
    }

    // Process action based on type
    let newState: CourseState;

    switch (action.type) {
      // ===================
      // Basic Course Management
      // ===================
      
      case CourseActionType.SET_COURSE:
        newState = {
          ...state,
          course: action.payload,
          isDirty: false,
          hasUnsavedChanges: false,
          error: null,
          validationErrors: {},
        };
        break;
      
      case CourseActionType.RESET_COURSE:
        newState = {
          ...initialCourseState,
          course: { ...initialCourseState.course, ...action.payload },
        };
        break;
      
      case CourseActionType.UPDATE_COURSE_FIELD:
        newState = safeUpdateCourseField(state, action.payload.field, action.payload.value);
        break;
      
      // ===================
      // Basic Information
      // ===================
      
      case CourseActionType.SET_COURSE_TITLE:
        newState = safeUpdateCourseField(state, "title", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_DESCRIPTION:
        newState = safeUpdateCourseField(state, "description", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_SHORT_DESCRIPTION:
        newState = safeUpdateCourseField(state, "shortDescription", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_CATEGORY:
        newState = safeUpdateCourseField(state, "category", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_SUBCATEGORY:
        newState = safeUpdateCourseField(state, "subcategory", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_THUMBNAIL:
        newState = safeUpdateCourseField(state, "thumbnail", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_PREVIEW_VIDEO_URL:
        newState = safeUpdateCourseField(state, "previewVideoUrl", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_SLUG:
        newState = safeUpdateCourseField(state, "slug", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_LANGUAGE:
        newState = safeUpdateCourseField(state, "language", action.payload);
        break;
      
      // ===================
      // Status & Features
      // ===================
      
      case CourseActionType.SET_COURSE_IS_FEATURED:
        newState = safeUpdateCourseField(state, "isFeatured", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_IS_CERTIFIED:
        newState = safeUpdateCourseField(state, "isCertified", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_IS_ACTIVE:
        newState = safeUpdateCourseField(state, "isActive", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_SCHOLARSHIP:
        newState = safeUpdateCourseField(state, "scholarship", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_SCHOLARSHIP_DESCRIPTION:
        newState = safeUpdateCourseField(state, "scholarshipDescription", action.payload);
        break;
      
      // ===================
      // Learning Information
      // ===================
      
      case CourseActionType.SET_COURSE_WHAT_YOU_WILL_LEARN:
        newState = safeUpdateCourseField(state, "whatYouWillLearn", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_SKILLS:
        newState = safeUpdateCourseField(state, "skills", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_KEY_FEATURES:
        newState = safeUpdateCourseField(state, "keyFeatures", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_FEATURES:
        newState = safeUpdateCourseField(state, "features", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_CAREER_PATHS:
        newState = safeUpdateCourseField(state, "careerPaths", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_SKILL_LEVEL:
        newState = safeUpdateCourseField(state, "skillLevel", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_WHO_SHOULD_JOIN:
        newState = safeUpdateCourseField(state, "whoShouldJoin", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_PREREQUISITES:
        newState = safeUpdateCourseField(state, "prerequisites", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_AUDIENCE:
        newState = safeUpdateCourseField(state, "audience", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_DURATION:
        newState = safeUpdateCourseField(state, "duration", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_TAGS:
        newState = safeUpdateCourseField(state, "tags", action.payload);
        break;
      
      // ===================
      // Content Management
      // ===================
      
      case CourseActionType.SET_COURSE_MODULES:
        newState = safeUpdateCourseField(state, "modules", action.payload);
        break;
      
      case CourseActionType.ADD_COURSE_MODULE:
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: [...state.course.modules, action.payload],
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;
      
      case CourseActionType.UPDATE_COURSE_MODULE:
        try {
          const updatedModules = safeUpdateArrayItem(
            state.course.modules,
            action.payload.moduleId,
            action.payload.updates
          );
          newState = {
            ...state,
            course: {
              ...state.course,
              modules: updatedModules,
            },
            isDirty: true,
            hasUnsavedChanges: true,
          };
        } catch (error) {
          const businessError = handleBusinessLogicError(
            error instanceof Error ? error.message : "Failed to update module",
            "MODULE_UPDATE_FAILED",
            "moduleId"
          );
          return {
            state: {
              ...state,
              error: businessError.message,
            },
            error: businessError
          };
        }
        break;
      
      case CourseActionType.DELETE_COURSE_MODULE:
        try {
          const updatedModules = safeRemoveArrayItem(
            state.course.modules,
            action.payload
          );
          newState = {
            ...state,
            course: {
              ...state.course,
              modules: updatedModules,
            },
            isDirty: true,
            hasUnsavedChanges: true,
          };
        } catch (error) {
          const businessError = handleBusinessLogicError(
            error instanceof Error ? error.message : "Failed to delete module",
            "MODULE_DELETE_FAILED",
            "moduleId"
          );
          return {
            state: {
              ...state,
              error: businessError.message,
            },
            error: businessError
          };
        }
        break;
      
      case CourseActionType.REORDER_COURSE_MODULES:
        newState = safeUpdateCourseField(state, "modules", action.payload);
        break;
      
      // ===================
      // Instructor Management
      // ===================
      
      case CourseActionType.SET_COURSE_INSTRUCTOR:
        newState = safeUpdateCourseField(state, "instructor", action.payload);
        break;
      
      case CourseActionType.ADD_COURSE_INSTRUCTOR:
        newState = {
          ...state,
          course: {
            ...state.course,
            instructor: [...state.course.instructor, action.payload],
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;
      
      case CourseActionType.REMOVE_COURSE_INSTRUCTOR:
        try {
          const updatedInstructors = safeRemoveArrayItem(
            state.course.instructor,
            action.payload
          );
          newState = {
            ...state,
            course: {
              ...state.course,
              instructor: updatedInstructors,
            },
            isDirty: true,
            hasUnsavedChanges: true,
          };
        } catch (error) {
          const businessError = handleBusinessLogicError(
            error instanceof Error ? error.message : "Failed to remove instructor",
            "INSTRUCTOR_REMOVE_FAILED",
            "instructorId"
          );
          return {
            state: {
              ...state,
              error: businessError.message,
            },
            error: businessError
          };
        }
        break;
      
      // ===================
      // Reviews Management
      // ===================
      
      case CourseActionType.SET_COURSE_REVIEWS:
        newState = safeUpdateCourseField(state, "reviews", action.payload);
        break;
      
      case CourseActionType.ADD_COURSE_REVIEW:
        newState = {
          ...state,
          course: {
            ...state.course,
            reviews: [...state.course.reviews, action.payload],
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;
      
      case CourseActionType.UPDATE_COURSE_REVIEW:
        try {
          const updatedReviews = safeUpdateArrayItem(
            state.course.reviews,
            action.payload.reviewId,
            action.payload.updates
          );
          newState = {
            ...state,
            course: {
              ...state.course,
              reviews: updatedReviews,
            },
            isDirty: true,
            hasUnsavedChanges: true,
          };
        } catch (error) {
          const businessError = handleBusinessLogicError(
            error instanceof Error ? error.message : "Failed to update review",
            "REVIEW_UPDATE_FAILED",
            "reviewId"
          );
          return {
            state: {
              ...state,
              error: businessError.message,
            },
            error: businessError
          };
        }
        break;
      
      case CourseActionType.DELETE_COURSE_REVIEW:
        try {
          const updatedReviews = safeRemoveArrayItem(
            state.course.reviews,
            action.payload
          );
          newState = {
            ...state,
            course: {
              ...state.course,
              reviews: updatedReviews,
            },
            isDirty: true,
            hasUnsavedChanges: true,
          };
        } catch (error) {
          const businessError = handleBusinessLogicError(
            error instanceof Error ? error.message : "Failed to delete review",
            "REVIEW_DELETE_FAILED",
            "reviewId"
          );
          return {
            state: {
              ...state,
              error: businessError.message,
            },
            error: businessError
          };
        }
        break;
      
      case CourseActionType.SET_FEATURED_REVIEWS:
        newState = safeUpdateCourseField(state, "featuredReviews", action.payload);
        break;
      
      // ===================
      // FAQ Management
      // ===================
      
      case CourseActionType.SET_COURSE_FAQS:
        newState = safeUpdateCourseField(state, "faqs", action.payload);
        break;
      
      case CourseActionType.ADD_COURSE_FAQ:
        newState = {
          ...state,
          course: {
            ...state.course,
            faqs: [...state.course.faqs, action.payload],
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;
      
      case CourseActionType.UPDATE_COURSE_FAQ:
        try {
          const updatedFaqs = safeUpdateArrayItem(
            state.course.faqs,
            action.payload.faqId,
            action.payload.updates
          );
          newState = {
            ...state,
            course: {
              ...state.course,
              faqs: updatedFaqs,
            },
            isDirty: true,
            hasUnsavedChanges: true,
          };
        } catch (error) {
          const businessError = handleBusinessLogicError(
            error instanceof Error ? error.message : "Failed to update FAQ",
            "FAQ_UPDATE_FAILED",
            "faqId"
          );
          return {
            state: {
              ...state,
              error: businessError.message,
            },
            error: businessError
          };
        }
        break;
      
      case CourseActionType.DELETE_COURSE_FAQ:
        try {
          const updatedFaqs = safeRemoveArrayItem(
            state.course.faqs,
            action.payload
          );
          newState = {
            ...state,
            course: {
              ...state.course,
              faqs: updatedFaqs,
            },
            isDirty: true,
            hasUnsavedChanges: true,
          };
        } catch (error) {
          const businessError = handleBusinessLogicError(
            error instanceof Error ? error.message : "Failed to delete FAQ",
            "FAQ_DELETE_FAILED",
            "faqId"
          );
          return {
            state: {
              ...state,
              error: businessError.message,
            },
            error: businessError
          };
        }
        break;
      
      case CourseActionType.REORDER_COURSE_FAQS:
        newState = safeUpdateCourseField(state, "faqs", action.payload);
        break;
      
      // ===================
      // Quiz Management
      // ===================
      
      case CourseActionType.SET_COURSE_SCHOLARSHIP_QUIZ:
        newState = safeUpdateCourseField(state, "scholarshipQuiz", action.payload);
        break;
      
      case CourseActionType.ADD_COURSE_QUIZ:
        newState = {
          ...state,
          course: {
            ...state.course,
            scholarshipQuiz: [...(state.course.scholarshipQuiz || []), action.payload],
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;
      
      case CourseActionType.UPDATE_COURSE_QUIZ:
        try {
          const updatedQuizzes = safeUpdateArrayItem(
            state.course.scholarshipQuiz || [],
            action.payload.quizId,
            action.payload.updates
          );
          newState = {
            ...state,
            course: {
              ...state.course,
              scholarshipQuiz: updatedQuizzes,
            },
            isDirty: true,
            hasUnsavedChanges: true,
          };
        } catch (error) {
          const businessError = handleBusinessLogicError(
            error instanceof Error ? error.message : "Failed to update quiz",
            "QUIZ_UPDATE_FAILED",
            "quizId"
          );
          return {
            state: {
              ...state,
              error: businessError.message,
            },
            error: businessError
          };
        }
        break;
      
      case CourseActionType.DELETE_COURSE_QUIZ:
        try {
          const updatedQuizzes = safeRemoveArrayItem(
            state.course.scholarshipQuiz || [],
            action.payload
          );
          newState = {
            ...state,
            course: {
              ...state.course,
              scholarshipQuiz: updatedQuizzes,
            },
            isDirty: true,
            hasUnsavedChanges: true,
          };
        } catch (error) {
          const businessError = handleBusinessLogicError(
            error instanceof Error ? error.message : "Failed to delete quiz",
            "QUIZ_DELETE_FAILED",
            "quizId"
          );
          return {
            state: {
              ...state,
              error: businessError.message,
            },
            error: businessError
          };
        }
        break;
      
      // ===================
      // SEO Management
      // ===================
      
      case CourseActionType.SET_COURSE_META_TITLE:
        newState = safeUpdateCourseField(state, "metaTitle", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_META_DESCRIPTION:
        newState = safeUpdateCourseField(state, "metaDescription", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_KEYWORDS:
        newState = safeUpdateCourseField(state, "keywords", action.payload);
        break;
      
      // ===================
      // Pricing & Discount
      // ===================
      
      case CourseActionType.SET_COURSE_DISCOUNT:
        newState = safeUpdateCourseField(state, "discount", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_PLANS:
        newState = safeUpdateCourseField(state, "plans", action.payload);
        break;
      
      case CourseActionType.UPDATE_COURSE_PLAN:
        newState = {
          ...state,
          course: {
            ...state.course,
            plans: {
              ...state.course.plans,
              [action.payload.planType]: action.payload.plan,
            },
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;
      
      // ===================
      // Error Handling
      // ===================
      
      case CourseActionType.SET_COURSE_ERROR:
        newState = {
          ...state,
          error: action.payload,
          isLoading: false,
          isSaving: false,
        };
        break;
      
      case CourseActionType.CLEAR_COURSE_ERROR:
        newState = {
          ...state,
          error: null,
        };
        break;
      
      // ===================
      // Loading States
      // ===================
      
      case CourseActionType.SET_COURSE_LOADING:
        newState = {
          ...state,
          isLoading: action.payload,
          error: action.payload ? null : state.error,
        };
        break;
      
      case CourseActionType.SET_COURSE_SAVING:
        newState = {
          ...state,
          isSaving: action.payload,
          error: action.payload ? null : state.error,
        };
        break;
      
      // ===================
      // Validation
      // ===================
      
      case CourseActionType.SET_COURSE_VALIDATION_ERRORS:
        newState = {
          ...state,
          validationErrors: action.payload,
        };
        break;
      
      case CourseActionType.CLEAR_COURSE_VALIDATION_ERRORS:
        newState = {
          ...state,
          validationErrors: {},
        };
        break;
      
      // ===================
      // Timestamps
      // ===================
      
      case CourseActionType.SET_COURSE_CREATED_AT:
        newState = safeUpdateCourseField(state, "createdAt", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_UPDATED_AT:
        newState = safeUpdateCourseField(state, "updatedAt", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_CREATED_BY:
        newState = safeUpdateCourseField(state, "createdBy", action.payload);
        break;
      
      // ===================
      // Metrics
      // ===================
      
      case CourseActionType.SET_COURSE_ENROLLED_COUNT:
        newState = safeUpdateCourseField(state, "enrolledCount", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_TOTAL_RATINGS:
        newState = safeUpdateCourseField(state, "totalRatings", action.payload);
        break;
      
      case CourseActionType.SET_COURSE_TOTAL_LECTURES:
        newState = safeUpdateCourseField(state, "totalLectures", action.payload);
        break;
      
      default:
        // Unknown action type - return current state with warning
        return {
          state: {
            ...state,
            error: `Unknown action type: ${action.type}`,
          },
          error: handleBusinessLogicError(
            `Unknown action type: ${action.type}`,
            "UNKNOWN_ACTION_TYPE"
          ),
          warnings: [`Unknown action type: ${action.type}`]
        };
    }

    // Clear any previous errors on successful action
    newState.error = null;
    newState.validationErrors = {};

    return {
      state: newState
    };

  } catch (error) {
    // Handle any unexpected runtime errors
    const runtimeError = handleRuntimeError(
      error instanceof Error ? error : new Error("Unknown runtime error"),
      action
    );

    return {
      state: {
        ...state,
        error: runtimeError.message,
        isLoading: false,
        isSaving: false,
      },
      error: runtimeError
    };
  }
}; 