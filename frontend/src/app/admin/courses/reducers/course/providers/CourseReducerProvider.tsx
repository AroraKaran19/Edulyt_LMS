"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useCourseReducer } from "../hooks/useCourseReducer";
import { CourseState, initialCourseState } from "../core/state";
import { ReducerResult } from "../core/reducer";

// ===================
// Course Reducer Context
// ===================

interface CourseReducerContextType {
  state: CourseState;
  actions: ReturnType<typeof useCourseReducer>["actions"];
  utils: ReturnType<typeof useCourseReducer>["utils"];
  dispatch: (action: any) => ReducerResult;
  clearDraft: () => void;
  hasDraft: () => boolean;
}

const CourseReducerContext = createContext<CourseReducerContextType | null>(
  null
);

// ===================
// LocalStorage Keys
// ===================

const COURSE_DRAFT_KEY = "course_creation_draft";

// ===================
// Course Reducer Provider
// ===================

export const CourseReducerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const courseReducer = useCourseReducer();

  // Load saved course data from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(COURSE_DRAFT_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        // Merge saved data with initial state to ensure all fields exist
        const mergedCourse = {
          ...initialCourseState.course,
          ...parsedDraft
        };
        courseReducer.actions.setCourse(mergedCourse);
        console.log("📄 Restored course draft from localStorage with merged initial state", {
          curriculum: !!mergedCourse.curriculum,
          curriculumSource: mergedCourse.curriculumSource,
          curriculumS3Key: !!mergedCourse.curriculumS3Key
        });
      } else {
        // Ensure we start with a complete initial state
        courseReducer.actions.setCourse(initialCourseState.course);
      }
    } catch (error) {
      console.error("Failed to load course draft from localStorage:", error);
      // Fallback to initial state if localStorage fails
      courseReducer.actions.setCourse(initialCourseState.course);
    }
  }, []);

  // Save course data to localStorage whenever it changes
  useEffect(() => {
    try {
      // Ensure course object exists before checking properties
      if (!courseReducer.state.course) {
        return;
      }

      // Only save if the course has some meaningful data (not just initial state)
      const hasData = 
        courseReducer.state.course.title ||
        courseReducer.state.course.description ||
        courseReducer.state.course.curriculum ||
        (courseReducer.state.course.skills && courseReducer.state.course.skills.length > 0) ||
        (courseReducer.state.course.careerPaths && courseReducer.state.course.careerPaths.length > 0);

      if (hasData) {
        localStorage.setItem(COURSE_DRAFT_KEY, JSON.stringify(courseReducer.state.course));
        console.log("📄 Saved course draft to localStorage", {
          curriculum: !!courseReducer.state.course.curriculum,
          curriculumSource: courseReducer.state.course.curriculumSource,
          curriculumS3Key: !!courseReducer.state.course.curriculumS3Key
        });
      }
    } catch (error) {
      console.error("Failed to save course draft to localStorage:", error);
    }
  }, [courseReducer.state.course]);

  // Enhanced course reducer with localStorage methods
  const enhancedCourseReducer = {
    ...courseReducer,
    clearDraft: () => {
      try {
        localStorage.removeItem(COURSE_DRAFT_KEY);
        courseReducer.actions.resetCourse();
        console.log("Cleared course draft from localStorage");
      } catch (error) {
        console.error("Failed to clear course draft:", error);
      }
    },
    hasDraft: () => {
      try {
        return localStorage.getItem(COURSE_DRAFT_KEY) !== null;
      } catch {
        return false;
      }
    }
  };

  return (
    <CourseReducerContext.Provider value={enhancedCourseReducer}>
      {children}
    </CourseReducerContext.Provider>
  );
};

// ===================
// Custom Hook to Use Course Reducer
// ===================

export const useCourseContext = (): CourseReducerContextType => {
  const context = useContext(CourseReducerContext);

  if (!context) {
    throw new Error(
      "useCourseContext must be used within a CourseReducerProvider"
    );
  }

  return context;
};

// ===================
// Export Types for TypeScript
// ===================

export type { CourseReducerContextType };
