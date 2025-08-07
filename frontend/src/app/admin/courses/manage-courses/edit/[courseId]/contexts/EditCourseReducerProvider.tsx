"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useCourses } from "@/hooks/useCourses";
import { CourseState, ReducerResult } from "@/types";
import { useCourseReducer } from "@/app/admin/courses/course-reducer/useCourseReducer";

// ===================
// Edit Course Reducer Context
// ===================

interface EditCourseReducerContextType {
  state: CourseState;
  actions: ReturnType<typeof useCourseReducer>["actions"];
  utils: ReturnType<typeof useCourseReducer>["utils"];
  dispatch: (action: any) => ReducerResult;
  clearDraft: () => void;
  hasDraft: () => boolean;
  isLoading: boolean;
  loadError: string | null;
}

const EditCourseReducerContext = createContext<EditCourseReducerContextType | null>(
  null
);

// ===================
// LocalStorage Keys
// ===================

const getCourseDraftKey = (courseId: string) => `course_edit_${courseId}_draft`;

// ===================
// Edit Course Reducer Provider
// ===================

export const EditCourseReducerProvider = ({
  children,
  courseId,
}: {
  children: React.ReactNode;
  courseId: string;
}) => {
  const courseReducer = useCourseReducer();
  const { getCourseById } = useCourses();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const courseDraftKey = getCourseDraftKey(courseId);

  // Load course data on mount
  useEffect(() => {
    const loadCourseData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // First, try to load from localStorage draft
        const savedDraft = localStorage.getItem(courseDraftKey);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          courseReducer.actions.setCourse(parsedDraft);
          console.log("Restored course edit draft from localStorage");
          setIsLoading(false);
          return;
        }

        // If no draft, fetch from API
        const response = await getCourseById(courseId);
        if (response.success && response.data) {
          courseReducer.actions.setCourse(response.data);
          console.log("Loaded course data from API for editing");
        } else {
          setLoadError(response.error || "Failed to load course data");
        }
      } catch (error) {
        console.error("Failed to load course data:", error);
        setLoadError(error instanceof Error ? error.message : "Failed to load course data");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, courseDraftKey]);

  // Save course data to localStorage whenever it changes (but only if we have loaded data)
  useEffect(() => {
    if (isLoading) return; // Don't save while loading

    try {
      // Ensure course object exists before checking properties
      if (!courseReducer.state.course) {
        return;
      }

      // Save the current state as draft
      localStorage.setItem(courseDraftKey, JSON.stringify(courseReducer.state.course));
      console.log("Saved course edit draft to localStorage");
    } catch (error) {
      console.error("Failed to save course edit draft to localStorage:", error);
    }
  }, [courseReducer.state.course, courseDraftKey, isLoading]);

  // Enhanced course reducer with localStorage methods
  const enhancedCourseReducer = {
    ...courseReducer,
    clearDraft: () => {
      try {
        localStorage.removeItem(courseDraftKey);
        console.log("Cleared course edit draft from localStorage");
      } catch (error) {
        console.error("Failed to clear course edit draft:", error);
      }
    },
    hasDraft: () => {
      try {
        return localStorage.getItem(courseDraftKey) !== null;
      } catch {
        return false;
      }
    },
    isLoading,
    loadError
  };

  return (
    <EditCourseReducerContext.Provider value={enhancedCourseReducer}>
      {children}
    </EditCourseReducerContext.Provider>
  );
};

// ===================
// Custom Hook to Use Edit Course Reducer
// ===================

export const useEditCourseContext = (): EditCourseReducerContextType => {
  const context = useContext(EditCourseReducerContext);

  if (!context) {
    throw new Error(
      "useEditCourseContext must be used within an EditCourseReducerProvider"
    );
  }

  return context;
};

// ===================
// Export Types for TypeScript
// ===================

export type { EditCourseReducerContextType };