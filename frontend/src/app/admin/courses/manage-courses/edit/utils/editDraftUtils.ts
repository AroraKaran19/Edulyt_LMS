// Utility functions for managing course edit drafts

import { Course } from "@/types";

const COURSE_EDIT_DRAFT_KEY = "course_edit_draft";
const COURSE_EDIT_CURRENT_SCREEN_KEY = "course_edit_current_screen";
const COURSE_EDIT_ID_KEY = "course_edit_id";

export const editDraftUtils = {
  // Check if there's a saved edit draft
  hasDraft: (): boolean => {
    try {
      return localStorage.getItem(COURSE_EDIT_DRAFT_KEY) !== null;
    } catch {
      return false;
    }
  },

  // Check if there's a saved screen for edit
  hasScreenHistory: (): boolean => {
    try {
      return localStorage.getItem(COURSE_EDIT_CURRENT_SCREEN_KEY) !== null;
    } catch {
      return false;
    }
  },

  // Get edit draft data
  getDraft: (): Course | null => {
    try {
      const draft = localStorage.getItem(COURSE_EDIT_DRAFT_KEY);
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        console.log("📄 Restored edit draft from localStorage", {
          curriculum: !!parsedDraft.curriculum,
          curriculumSource: parsedDraft.curriculumSource,
          curriculumS3Key: !!parsedDraft.curriculumS3Key
        });
        return parsedDraft;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Get saved screen for edit
  getSavedScreen: (): string | null => {
    try {
      return localStorage.getItem(COURSE_EDIT_CURRENT_SCREEN_KEY);
    } catch {
      return null;
    }
  },

  // Get the course ID being edited
  getEditCourseId: (): string | null => {
    try {
      return localStorage.getItem(COURSE_EDIT_ID_KEY);
    } catch {
      return null;
    }
  },

  // Save edit draft data
  saveDraft: (courseData: Course): void => {
    try {
      localStorage.setItem(COURSE_EDIT_DRAFT_KEY, JSON.stringify(courseData));
      console.log("📄 Edit draft saved", {
        curriculum: !!courseData.curriculum,
        curriculumSource: courseData.curriculumSource,
        curriculumS3Key: !!courseData.curriculumS3Key
      });
    } catch (error) {
      console.error("Failed to save edit draft:", error);
    }
  },

  // Save current screen for edit
  saveScreen: (screen: string): void => {
    try {
      localStorage.setItem(COURSE_EDIT_CURRENT_SCREEN_KEY, screen);
    } catch (error) {
      console.error("Failed to save edit screen:", error);
    }
  },

  // Save course ID being edited
  saveEditCourseId: (courseId: string): void => {
    try {
      localStorage.setItem(COURSE_EDIT_ID_KEY, courseId);
    } catch (error) {
      console.error("Failed to save edit course ID:", error);
    }
  },

  // Clear all edit draft data
  clearAll: (): void => {
    try {
      localStorage.removeItem(COURSE_EDIT_DRAFT_KEY);
      localStorage.removeItem(COURSE_EDIT_CURRENT_SCREEN_KEY);
      localStorage.removeItem(COURSE_EDIT_ID_KEY);
      // Also clear any potential creation screen data that might interfere
      localStorage.removeItem("course_creation_current_screen");
      console.log("All edit draft data cleared");
    } catch (error) {
      console.error("Failed to clear edit draft data:", error);
    }
  },

  // Clear only the draft data but keep the course ID
  clearDraftOnly: (): void => {
    try {
      localStorage.removeItem(COURSE_EDIT_DRAFT_KEY);
      localStorage.removeItem(COURSE_EDIT_CURRENT_SCREEN_KEY);
      console.log("Edit draft data cleared (course ID preserved)");
    } catch (error) {
      console.error("Failed to clear edit draft data:", error);
    }
  },

  // Get edit draft info for display
  getDraftInfo: () => {
    const draft = editDraftUtils.getDraft();
    const screen = editDraftUtils.getSavedScreen();
    const courseId = editDraftUtils.getEditCourseId();
    
    if (!draft) return null;

    return {
      courseId,
      hasTitle: !!draft.title,
      hasDescription: !!draft.description,
      skillsCount: draft.skills?.length || 0,
      careerPathsCount: draft.careerPaths?.length || 0,
      currentScreen: screen || "screen1",
      lastModified: new Date().toLocaleString(),
      isEditMode: true
    };
  },

  // Check if the draft belongs to the current course being edited
  isDraftForCourse: (courseId: string): boolean => {
    const savedCourseId = editDraftUtils.getEditCourseId();
    return savedCourseId === courseId;
  }
};
