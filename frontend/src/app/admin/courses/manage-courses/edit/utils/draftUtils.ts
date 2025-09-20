// Utility functions for managing course editing drafts

import { Course, CourseModule } from "@/types";

const COURSE_DRAFT_KEY = "course_edit_draft";
const CURRENT_SCREEN_KEY = "course_edit_current_screen";
const EDIT_COURSE_ID_KEY = "course_edit_course_id";
const MODULES_DRAFT_KEY = "course_modules_draft";
const LAST_MODIFIED_KEY = "course_edit_last_modified";

export const draftUtils = {
  // Check if there's a saved draft
  hasDraft: (): boolean => {
    try {
      return localStorage.getItem(COURSE_DRAFT_KEY) !== null;
    } catch {
      return false;
    }
  },

  // Check if there's a saved screen
  hasScreenHistory: (): boolean => {
    try {
      return localStorage.getItem(CURRENT_SCREEN_KEY) !== null;
    } catch {
      return false;
    }
  },

  // Get draft data
  getDraft: (): Course | null => {
    try {
      const draft = localStorage.getItem(COURSE_DRAFT_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  },

  // Get saved screen
  getSavedScreen: (): string | null => {
    try {
      return localStorage.getItem(CURRENT_SCREEN_KEY);
    } catch {
      return null;
    }
  },

  // Save draft data
  saveDraft: (course: Course): void => {
    try {
      localStorage.setItem(COURSE_DRAFT_KEY, JSON.stringify(course));
      localStorage.setItem(LAST_MODIFIED_KEY, new Date().toISOString());
      console.log("Draft saved successfully");
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  },

  // Save modules draft data
  saveModulesDraft: (modules: CourseModule[]): void => {
    try {
      localStorage.setItem(MODULES_DRAFT_KEY, JSON.stringify(modules));
      localStorage.setItem(LAST_MODIFIED_KEY, new Date().toISOString());
      console.log("Modules draft saved successfully");
    } catch (error) {
      console.error("Failed to save modules draft:", error);
    }
  },

  // Get modules draft data
  getModulesDraft: (): CourseModule[] => {
    try {
      const modules = localStorage.getItem(MODULES_DRAFT_KEY);
      return modules ? JSON.parse(modules) : [];
    } catch {
      return [];
    }
  },

  // Check if there are saved modules
  hasModulesDraft: (): boolean => {
    try {
      return localStorage.getItem(MODULES_DRAFT_KEY) !== null;
    } catch {
      return false;
    }
  },

  // Save edit course ID
  saveEditCourseId: (courseId: string): void => {
    try {
      localStorage.setItem(EDIT_COURSE_ID_KEY, courseId);
      console.log("Edit course ID saved:", courseId);
    } catch (error) {
      console.error("Failed to save edit course ID:", error);
    }
  },

  // Check if draft is for specific course
  isDraftForCourse: (courseId: string): boolean => {
    try {
      const savedCourseId = localStorage.getItem(EDIT_COURSE_ID_KEY);
      return savedCourseId === courseId;
    } catch {
      return false;
    }
  },

  // Clear all draft data
  clearAll: (): void => {
    try {
      localStorage.removeItem(COURSE_DRAFT_KEY);
      localStorage.removeItem(CURRENT_SCREEN_KEY);
      localStorage.removeItem(EDIT_COURSE_ID_KEY);
      localStorage.removeItem(MODULES_DRAFT_KEY);
      localStorage.removeItem(LAST_MODIFIED_KEY);
      console.log("All draft data cleared");
    } catch (error) {
      console.error("Failed to clear draft data:", error);
    }
  },

  // Clear draft data for specific course
  clearForCourse: (courseId: string): void => {
    try {
      const savedCourseId = localStorage.getItem(EDIT_COURSE_ID_KEY);
      if (savedCourseId === courseId) {
        localStorage.removeItem(COURSE_DRAFT_KEY);
        localStorage.removeItem(CURRENT_SCREEN_KEY);
        localStorage.removeItem(EDIT_COURSE_ID_KEY);
        localStorage.removeItem(MODULES_DRAFT_KEY);
        localStorage.removeItem(LAST_MODIFIED_KEY);
        console.log(`Draft data cleared for course: ${courseId}`);
      }
    } catch (error) {
      console.error("Failed to clear draft data for course:", error);
    }
  },

  // Get last modified timestamp
  getLastModified: (): Date | null => {
    try {
      const timestamp = localStorage.getItem(LAST_MODIFIED_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch {
      return null;
    }
  },

  // Validate draft data integrity
  validateDraft: (course: Course): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!course.title || course.title.trim() === "") {
      errors.push("Course title is required");
    }
    
    if (!course.description || course.description.trim() === "") {
      errors.push("Course description is required");
    }
    
    if (!course.category) {
      errors.push("Course category is required");
    }
    
    if (!course.thumbnail) {
      errors.push("Course thumbnail is required");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Get editing progress
  getEditingProgress: (): { progress: number; completedSteps: string[]; totalSteps: number } => {
    const draft = draftUtils.getDraft();
    const modules = draftUtils.getModulesDraft();
    
    if (!draft) {
      return { progress: 0, completedSteps: [], totalSteps: 10 };
    }
    
    const steps = [
      { key: "title", condition: !!draft.title },
      { key: "description", condition: !!draft.description },
      { key: "category", condition: !!draft.category },
      { key: "thumbnail", condition: !!draft.thumbnail },
      { key: "plans", condition: !!(draft.plans?.essential || draft.plans?.elite) },
      { key: "highlights", condition: (draft.highlights?.length || 0) > 0 },
      { key: "skills", condition: (draft.skills?.length || 0) > 0 },
      { key: "faqs", condition: (draft.faqs?.length || 0) > 0 },
      { key: "testimonials", condition: (draft.testimonials?.length || 0) > 0 },
      { key: "modules", condition: modules.length > 0 }
    ];
    
    const completedSteps = steps.filter(step => step.condition).map(step => step.key);
    const progress = Math.round((completedSteps.length / steps.length) * 100);
    
    return {
      progress,
      completedSteps,
      totalSteps: steps.length
    };
  },

  // Get draft info for display
  getDraftInfo: () => {
    const draft = draftUtils.getDraft();
    const screen = draftUtils.getSavedScreen();
    const modules = draftUtils.getModulesDraft();
    const lastModified = draftUtils.getLastModified();
    const progress = draftUtils.getEditingProgress();
    
    if (!draft) return null;

    return {
      hasTitle: !!draft.title,
      hasDescription: !!draft.description,
      skillsCount: draft.skills?.length || 0,
      careerPathsCount: draft.careerPaths?.length || 0,
      modulesCount: modules.length,
      currentScreen: screen || "screen1",
      lastModified: lastModified ? lastModified.toLocaleString() : "Unknown",
      progress: progress.progress,
      completedSteps: progress.completedSteps,
      totalSteps: progress.totalSteps,
      courseId: localStorage.getItem(EDIT_COURSE_ID_KEY)
    };
  },

  // Check if editing session is active
  isEditingSessionActive: (): boolean => {
    const courseId = localStorage.getItem(EDIT_COURSE_ID_KEY);
    const hasDraft = draftUtils.hasDraft();
    return !!(courseId && hasDraft);
  },

  // Get current editing course ID
  getCurrentEditingCourseId: (): string | null => {
    return localStorage.getItem(EDIT_COURSE_ID_KEY);
  },

  // Save current screen
  saveCurrentScreen: (screen: string): void => {
    try {
      localStorage.setItem(CURRENT_SCREEN_KEY, screen);
      console.log("Current screen saved:", screen);
    } catch (error) {
      console.error("Failed to save current screen:", error);
    }
  }
};