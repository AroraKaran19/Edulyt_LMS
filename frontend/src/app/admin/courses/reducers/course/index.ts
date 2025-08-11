// ===================
// Course Reducer Exports
// ===================

// Core exports
export { 
  courseActions,
  courseReducer,
  initialCourseState,
  type CourseState
} from "./core";

// Hooks
export { useCourseReducer } from "./hooks";

// Providers
export { 
  CourseReducerProvider,
  useCourseContext,
  type CourseReducerContextType
} from "./providers";

// Utils
export { 
  validationUtils,
  entityValidators,
  actionValidators,
  validateAction,
  type ValidationError,
  type ValidationResult
} from "./utils";

// Sanitization
export { 
  sanitizeCourseForBackend,
  validateSanitizedCourse,
  type SanitizedCourse
} from "./utils/sanitization";
