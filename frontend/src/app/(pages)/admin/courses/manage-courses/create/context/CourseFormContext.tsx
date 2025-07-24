"use client";
import React, { createContext, useContext, ReactNode } from 'react';
import { useCourseForm } from '../hooks/useCourseForm';
import type { CourseFormState } from '../hooks/useCourseForm';

// Context type
type CourseFormContextType = ReturnType<typeof useCourseForm>;

// Create context
const CourseFormContext = createContext<CourseFormContextType | undefined>(undefined);

// Provider component
interface CourseFormProviderProps {
  children: ReactNode;
  storageKey?: string;
}

export const CourseFormProvider: React.FC<CourseFormProviderProps> = ({ 
  children, 
  storageKey = 'course-form-draft' 
}) => {
  const courseFormValue = useCourseForm(storageKey);

  return (
    <CourseFormContext.Provider value={courseFormValue}>
      {children}
    </CourseFormContext.Provider>
  );
};

// Custom hook to use the context
export const useCourseFormContext = () => {
  const context = useContext(CourseFormContext);
  if (context === undefined) {
    throw new Error('useCourseFormContext must be used within a CourseFormProvider');
  }
  return context;
};

// Export types for convenience
export type { CourseFormState }; 