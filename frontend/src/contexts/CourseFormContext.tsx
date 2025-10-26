"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import {
  CourseFormData,
  CourseFormContextType,
  UseCourseFormOptions,
} from "@/types/courseForm";
import { useCourseForm } from "@/hooks/useCourseForm";

// ===================
// Context Creation
// ===================

const CourseFormContext = createContext<CourseFormContextType | undefined>(
  undefined
);

// ===================
// Provider Component
// ===================

interface CourseFormProviderProps {
  children: ReactNode;
  options?: UseCourseFormOptions;
}

export const CourseFormProvider: React.FC<CourseFormProviderProps> = ({
  children,
  options = {},
}) => {
  const courseFormHook = useCourseForm(options);

  const contextValue: CourseFormContextType = {
    // Form state
    currentScreen: courseFormHook.currentScreen,
    completedScreens: courseFormHook.completedScreens,
    isEditMode: courseFormHook.isEditMode,
    courseId: courseFormHook.courseId,

    // Navigation
    nextScreen: courseFormHook.nextScreen,
    prevScreen: courseFormHook.prevScreen,
    goToScreen: courseFormHook.goToScreen,
    canGoNext: courseFormHook.canGoNext,
    canGoPrev: courseFormHook.canGoPrev,

    // Screen validation
    isScreenCompleted: courseFormHook.isScreenCompleted,
    validateCurrentScreen: courseFormHook.validateCurrentScreen,
    getScreenErrors: courseFormHook.getScreenErrors,

    // Form actions
    resetForm: courseFormHook.reset,
    trigger: courseFormHook.trigger,
    saveDraft: courseFormHook.saveDraft,
    loadDraft: courseFormHook.loadDraft,
    clearDraft: courseFormHook.clearDraft,

    // Course actions
    createCourse: courseFormHook.createCourse,
    updateCourse: courseFormHook.updateCourse,
    updateCourseMetadata: courseFormHook.updateCourseMetadata,
    deleteCourse: courseFormHook.deleteCourse,

    // Loading states
    isCreating: courseFormHook.isCreating,
    isUpdating: courseFormHook.isUpdating,
    isDeleting: courseFormHook.isDeleting,
    isSaving: courseFormHook.isSaving,

    // Error states
    createError: courseFormHook.createError,
    updateError: courseFormHook.updateError,
    deleteError: courseFormHook.deleteError,
    validationErrors: courseFormHook.validationErrors,

    // Additional utilities
    generateSlug: courseFormHook.generateSlug,
    generateMetaTitle: courseFormHook.generateMetaTitle,
    generateMetaDescription: courseFormHook.generateMetaDescription,
    generateKeywords: courseFormHook.generateKeywords,

    // Course creation status
    isCourseCreated: courseFormHook.isCourseCreated,
    getCreatedCourseId: courseFormHook.getCreatedCourseId,
    clearCourseCreationStatus: courseFormHook.clearCourseCreationStatus,
  };

  return (
    <CourseFormContext.Provider value={contextValue}>
      <FormProvider {...(courseFormHook as any)}>{children}</FormProvider>
    </CourseFormContext.Provider>
  );
};

// ===================
// Context Hooks
// ===================

export const useCourseFormContext = (): CourseFormContextType => {
  const context = useContext(CourseFormContext);
  if (context === undefined) {
    throw new Error(
      "useCourseFormContext must be used within a CourseFormProvider"
    );
  }
  return context;
};

// ===================
// Form Methods Hook
// ===================

export const useCourseFormMethods = (): UseFormReturn<CourseFormData> => {
  const context = useContext(CourseFormContext);
  if (context === undefined) {
    throw new Error(
      "useCourseFormMethods must be used within a CourseFormProvider"
    );
  }

  // This will be provided by the FormProvider from react-hook-form
  // The actual form methods are available through useFormContext from react-hook-form
  return {} as UseFormReturn<CourseFormData>;
};

// ===================
// Screen-specific Hooks
// ===================

export const useScreenNavigation = () => {
  const context = useCourseFormContext();

  return {
    currentScreen: context.currentScreen,
    completedScreens: context.completedScreens,
    nextScreen: context.nextScreen,
    prevScreen: context.prevScreen,
    goToScreen: context.goToScreen,
    canGoNext: context.canGoNext,
    canGoPrev: context.canGoPrev,
    isScreenCompleted: context.isScreenCompleted,
  };
};

export const useScreenValidation = () => {
  const context = useCourseFormContext();

  return {
    validateCurrentScreen: context.validateCurrentScreen,
    getScreenErrors: context.getScreenErrors,
    validationErrors: context.validationErrors,
  };
};

export const useCourseActions = () => {
  const context = useCourseFormContext();

  return {
    createCourse: context.createCourse,
    updateCourse: context.updateCourse,
    deleteCourse: context.deleteCourse,
    isCreating: context.isCreating,
    isUpdating: context.isUpdating,
    isDeleting: context.isDeleting,
    createError: context.createError,
    updateError: context.updateError,
    deleteError: context.deleteError,
  };
};

export const useFormPersistence = () => {
  const context = useCourseFormContext();

  return {
    saveDraft: context.saveDraft,
    loadDraft: context.loadDraft,
    clearDraft: context.clearDraft,
    isSaving: context.isSaving,
  };
};

// ===================
// Higher-Order Component
// ===================

export const withCourseForm = <P extends object>(
  Component: React.ComponentType<P>,
  options?: UseCourseFormOptions
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <CourseFormProvider options={options}>
        <Component {...props} />
      </CourseFormProvider>
    );
  };

  WrappedComponent.displayName = `withCourseForm(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

// ===================
// Context Consumer (for class components)
// ===================

export const CourseFormConsumer = CourseFormContext.Consumer;

// ===================
// Default Export
// ===================

export default CourseFormContext;
