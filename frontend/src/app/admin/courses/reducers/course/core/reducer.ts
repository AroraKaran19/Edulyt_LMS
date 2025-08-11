import { CourseActionType, CourseAction } from "./actions";
import { CourseState, initialCourseState } from "./state";
import { validateAction, ValidationError } from "../utils/validation";

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
  details,
});

const handleValidationError = (
  validationErrors: ValidationError[]
): ReducerError => {
  const firstError = validationErrors[0];
  return createReducerError(
    "VALIDATION_ERROR",
    firstError.message,
    firstError.code,
    firstError.field,
    { allErrors: validationErrors }
  );
};

const handleRuntimeError = (
  error: Error,
  action: CourseAction
): ReducerError => {
  return createReducerError(
    "RUNTIME_ERROR",
    `Runtime error in ${action.type}: ${error.message}`,
    "RUNTIME_ERROR",
    undefined,
    { originalError: error, action }
  );
};

const handleBusinessLogicError = (
  message: string,
  code: string,
  field?: string
): ReducerError => {
  return createReducerError("BUSINESS_LOGIC_ERROR", message, code, field);
};

// ===================
// Safe State Update Utilities
// ===================

const safeUpdateCourseField = (
  state: CourseState,
  field: string,
  value: any
): CourseState => {
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
  const index = array.findIndex((item) => item._id === id);
  if (index === -1) {
    throw new Error(`Item with ID '${id}' not found in array`);
  }

  return array.map((item, i) => (i === index ? { ...item, ...updates } : item));
};

const safeRemoveArrayItem = <T extends { _id?: string }>(
  array: T[],
  id: string
): T[] => {
  const index = array.findIndex((item) => item._id === id);
  if (index === -1) {
    throw new Error(`Item with ID '${id}' not found in array`);
  }

  return array.filter((item) => item._id !== id);
};

// ===================
// Enhanced Reducer
// ===================

export const courseReducer = (
  state: CourseState,
  action: CourseAction
): ReducerResult => {
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
          }, {} as Record<string, string[]>),
        },
        error,
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
        newState = safeUpdateCourseField(
          state,
          action.payload.field,
          action.payload.value
        );
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
        newState = safeUpdateCourseField(
          state,
          "shortDescription",
          action.payload
        );
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

      case CourseActionType.SET_COURSE_THUMBNAIL_SOURCE:
        newState = safeUpdateCourseField(state, "thumbnailSource", action.payload);
        break;

      case CourseActionType.SET_COURSE_THUMBNAIL_S3_KEY:
        newState = safeUpdateCourseField(state, "thumbnailS3Key", action.payload);
        break;

      case CourseActionType.SET_COURSE_PREVIEW_VIDEO_URL:
        newState = safeUpdateCourseField(
          state,
          "previewVideoUrl",
          action.payload
        );
        break;

      case CourseActionType.SET_COURSE_PREVIEW_VIDEO_SOURCE:
        newState = safeUpdateCourseField(state, "previewVideoSource", action.payload);
        break;

      case CourseActionType.SET_COURSE_PREVIEW_VIDEO_S3_KEY:
        newState = safeUpdateCourseField(state, "previewVideoS3Key", action.payload);
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
        newState = safeUpdateCourseField(
          state,
          "scholarshipDescription",
          action.payload
        );
        break;

      // ===================
      // Learning Information
      // ===================

      case CourseActionType.SET_COURSE_WHAT_YOU_WILL_LEARN:
        newState = safeUpdateCourseField(
          state,
          "whatYouWillLearn",
          action.payload
        );
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

      case CourseActionType.SET_COURSE_HIGHLIGHTS:
        newState = safeUpdateCourseField(state, "highlights", action.payload);
        break;

      case CourseActionType.SET_COURSE_SKILL_LEVEL:
        newState = safeUpdateCourseField(state, "skillLevel", action.payload);
        break;

      case CourseActionType.SET_COURSE_WHO_SHOULD_JOIN:
        newState = safeUpdateCourseField(
          state,
          "whoShouldJoin",
          action.payload
        );
        break;

      case CourseActionType.SET_COURSE_PREREQUISITES:
        newState = safeUpdateCourseField(
          state,
          "prerequisites",
          action.payload
        );
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
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: state.course.modules.map((module) =>
              module._id === action.payload.moduleId 
                ? { ...module, ...action.payload.updates }
                : module
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };

        break;

      case CourseActionType.DELETE_COURSE_MODULE:
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: state.course.modules.filter((module) => module._id !== action.payload),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };

        break;

      case CourseActionType.REORDER_COURSE_MODULES:
        newState = safeUpdateCourseField(state, "modules", action.payload);
        break;

      // ===================
      // Lesson Management
      // ===================

      case CourseActionType.ADD_COURSE_LESSON:
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: state.course.modules.map((module) =>
              module._id === action.payload.moduleId
                ? {
                    ...module,
                    lessons: [...module.lessons, action.payload.lesson],
                  }
                : module
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;

      case CourseActionType.UPDATE_COURSE_LESSON:
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: state.course.modules.map((module) =>
              module._id === action.payload.moduleId
                ? {
                    ...module,
                    lessons: module.lessons.map((lesson) =>
                      lesson._id === action.payload.lessonId
                        ? { ...lesson, ...action.payload.updates }
                        : lesson
                    ),
                  }
                : module
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;

      case CourseActionType.DELETE_COURSE_LESSON:
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: state.course.modules.map((module) =>
              module._id === action.payload.moduleId
                ? {
                    ...module,
                    lessons: module.lessons.filter((lesson) => lesson._id !== action.payload.lessonId),
                  }
                : module
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;

      case CourseActionType.REORDER_COURSE_LESSONS:
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: state.course.modules.map((module) =>
              module._id === action.payload.moduleId
                ? {
                    ...module,
                    lessons: action.payload.lessons,
                  }
                : module
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;

      // ===================
      // Content Management
      // ===================

      case CourseActionType.ADD_COURSE_CONTENT:
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: state.course.modules.map((module) =>
              module._id === action.payload.moduleId
                ? {
                    ...module,
                    lessons: module.lessons.map((lesson) =>
                      lesson._id === action.payload.lessonId
                        ? {
                            ...lesson,
                            contents: [...lesson.contents, action.payload.content],
                          }
                        : lesson
                    ),
                  }
                : module
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;

      case CourseActionType.UPDATE_COURSE_CONTENT:
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: state.course.modules.map((module) =>
              module._id === action.payload.moduleId
                ? {
                    ...module,
                    lessons: module.lessons.map((lesson) =>
                      lesson._id === action.payload.lessonId
                        ? {
                            ...lesson,
                            contents: lesson.contents.map((content) =>
                              content._id === action.payload.contentId
                                ? { ...content, ...action.payload.updates }
                                : content
                            ),
                          }
                        : lesson
                    ),
                  }
                : module
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;

      case CourseActionType.DELETE_COURSE_CONTENT:
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: state.course.modules.map((module) =>
              module._id === action.payload.moduleId
                ? {
                    ...module,
                    lessons: module.lessons.map((lesson) =>
                      lesson._id === action.payload.lessonId
                        ? {
                            ...lesson,
                            contents: lesson.contents.filter((content) => content._id !== action.payload.contentId),
                          }
                        : lesson
                    ),
                  }
                : module
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
        break;

      case CourseActionType.REORDER_COURSE_CONTENT:
        newState = {
          ...state,
          course: {
            ...state.course,
            modules: state.course.modules.map((module) =>
              module._id === action.payload.moduleId
                ? {
                    ...module,
                    lessons: module.lessons.map((lesson) =>
                      lesson._id === action.payload.lessonId
                        ? {
                            ...lesson,
                            contents: action.payload.contents,
                          }
                        : lesson
                    ),
                  }
                : module
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };
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
        newState = {
          ...state,
          course: {
            ...state.course,
            instructor: state.course.instructor.filter(
              (id) => id !== action.payload
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };

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
        newState = {
          ...state,
          course: {
            ...state.course,
            reviews: state.course.reviews.map((id) =>
              id === action.payload.reviewId ? action.payload.reviewId : id
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };

        break;

      case CourseActionType.DELETE_COURSE_REVIEW:
        newState = {
          ...state,
          course: {
            ...state.course,
            reviews: state.course.reviews.filter((id) => id !== action.payload),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };

        break;

      case CourseActionType.SET_FEATURED_REVIEWS:
        newState = safeUpdateCourseField(
          state,
          "featuredReviews",
          action.payload
        );
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
        newState = {
          ...state,
          course: {
            ...state.course,
            faqs: state.course.faqs.map((faq, index) =>
              index === action.payload.faqIndex
                ? { ...faq, ...action.payload.updates }
                : faq
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };

        break;

      case CourseActionType.DELETE_COURSE_FAQ:
        newState = {
          ...state,
          course: {
            ...state.course,
            faqs: state.course.faqs.filter(
              (_, index) => index !== action.payload
            ),
          },
          isDirty: true,
          hasUnsavedChanges: true,
        };

        break;

      case CourseActionType.REORDER_COURSE_FAQS:
        newState = safeUpdateCourseField(state, "faqs", action.payload);
        break;

      // ===================
      // Quiz Management
      // ===================

      // Remove scholarship quiz cases as scholarshipQuiz doesn't exist on Course type
      // If needed, these should be added to the Course interface first

      // ===================
      // SEO Management
      // ===================

      case CourseActionType.SET_COURSE_META_TITLE:
        newState = safeUpdateCourseField(state, "metaTitle", action.payload);
        break;

      case CourseActionType.SET_COURSE_META_DESCRIPTION:
        newState = safeUpdateCourseField(
          state,
          "metaDescription",
          action.payload
        );
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
        newState = safeUpdateCourseField(
          state,
          "enrolledCount",
          action.payload
        );
        break;

      case CourseActionType.SET_COURSE_TOTAL_RATINGS:
        newState = safeUpdateCourseField(state, "totalRatings", action.payload);
        break;

      case CourseActionType.SET_COURSE_TOTAL_LECTURES:
        newState = safeUpdateCourseField(
          state,
          "totalLectures",
          action.payload
        );
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
          warnings: [`Unknown action type: ${action.type}`],
        };
    }

    // Clear any previous errors on successful action
    newState.error = null;
    newState.validationErrors = {};

    return {
      state: newState,
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
      error: runtimeError,
    };
  }
};
