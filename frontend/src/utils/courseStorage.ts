/**
 * Utility functions for managing course-related localStorage keys
 */

// Course Creation Keys
const COURSE_CREATION_KEYS = [
  "course_creation_current_screen",
  "current_course_id", 
  "course_modules",
  "course_modules_draft",
  "course_lessons",
  "course_content",
  "course_creation_draft",
] as const;

// Course Edit Keys
const COURSE_EDIT_KEYS = [
  "course_edit_draft",
  "course_edit_current_screen", 
  "course_edit_course_id",
  "course_edit_last_modified",
] as const;

// All course-related keys
const ALL_COURSE_KEYS = [
  ...COURSE_CREATION_KEYS,
  ...COURSE_EDIT_KEYS,
] as const;

/**
 * Clear all course-related localStorage keys
 * This should be called when starting a new course creation or editing session
 */
export const clearAllCourseStorage = (): void => {
  if (typeof window === "undefined") return;

  try {
    ALL_COURSE_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    console.log("Cleared all course-related localStorage keys");
  } catch (error) {
    console.error("Error clearing course localStorage:", error);
  }
};

/**
 * Clear only course creation related localStorage keys
 */
export const clearCourseCreationStorage = (): void => {
  if (typeof window === "undefined") return;

  try {
    COURSE_CREATION_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    console.log("Cleared course creation localStorage keys");
  } catch (error) {
    console.error("Error clearing course creation localStorage:", error);
  }
};

/**
 * Clear only course edit related localStorage keys
 */
export const clearCourseEditStorage = (): void => {
  if (typeof window === "undefined") return;

  try {
    COURSE_EDIT_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    console.log("Cleared course edit localStorage keys");
  } catch (error) {
    console.error("Error clearing course edit localStorage:", error);
  }
};

/**
 * Check if there's any course data in localStorage
 */
export const hasCourseDataInStorage = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    return ALL_COURSE_KEYS.some(key => {
      const value = localStorage.getItem(key);
      return value !== null && value !== "";
    });
  } catch (error) {
    console.error("Error checking course data in localStorage:", error);
    return false;
  }
};

/**
 * Get all course-related localStorage keys that have values
 */
export const getCourseStorageKeys = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    return ALL_COURSE_KEYS.filter(key => {
      const value = localStorage.getItem(key);
      return value !== null && value !== "";
    });
  } catch (error) {
    console.error("Error getting course storage keys:", error);
    return [];
  }
};
