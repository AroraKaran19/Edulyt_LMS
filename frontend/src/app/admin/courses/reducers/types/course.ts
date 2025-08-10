// ===================
// Course Reducer Types
// ===================

import { Course } from "@/types/course";

export interface CourseState {
  course: Course;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  validationErrors: Record<string, string[]>;
  isDirty: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  version: number;
}

export interface CourseAction {
  type: string;
  payload?: any;
}

export type ReducerResult = {
  state: CourseState;
  error?: string;
};

export type ReducerError = {
  message: string;
  field?: string;
};
