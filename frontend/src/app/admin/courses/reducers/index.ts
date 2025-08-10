// ===================
// Main Reducers Exports
// ===================

// Course reducer
export {
  courseActions,
  courseReducer,
  initialCourseState,
  useCourseReducer,
  CourseReducerProvider,
  useCourseContext,
  validationUtils,
  entityValidators,
  actionValidators,
  validateAction,
  type CourseState,
  type CourseReducerContextType,
  type ValidationError,
  type ValidationResult
} from "./course";

// Types
export type {
  CourseAction,
  ReducerResult,
  ReducerError
} from "./types";
