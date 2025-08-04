// Utility functions for managing course creation drafts

const COURSE_DRAFT_KEY = "course_creation_draft";
const CURRENT_SCREEN_KEY = "course_creation_current_screen";

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
  getDraft: (): any | null => {
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

  // Clear all draft data
  clearAll: (): void => {
    try {
      localStorage.removeItem(COURSE_DRAFT_KEY);
      localStorage.removeItem(CURRENT_SCREEN_KEY);
      console.log("All draft data cleared");
    } catch (error) {
      console.error("Failed to clear draft data:", error);
    }
  },

  // Get draft info for display
  getDraftInfo: () => {
    const draft = draftUtils.getDraft();
    const screen = draftUtils.getSavedScreen();
    
    if (!draft) return null;

    return {
      hasTitle: !!draft.title,
      hasDescription: !!draft.description,
      skillsCount: draft.skills?.length || 0,
      careerPathsCount: draft.careerPaths?.length || 0,
      currentScreen: screen || "screen1",
      lastModified: new Date().toLocaleString() // You could save timestamp in localStorage too
    };
  }
};