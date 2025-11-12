import {
  PartialAccessControl,
  ModuleAccessControl,
  LessonAccessControl,
} from "@/types/enrollment";

/**
 * Check if user has access to a specific module
 */
export const canAccessModule = (
  accessControl: PartialAccessControl | null | undefined,
  moduleId: string
): boolean => {
  // If no accessControl, user has full access
  if (!accessControl || accessControl.accessType === "full") {
    return true;
  }

  // If accessControl exists but no accessibleModules, user has no access
  if (!accessControl.accessibleModules || accessControl.accessibleModules.length === 0) {
    return false;
  }

  // Check if module is in accessibleModules
  return accessControl.accessibleModules.some(
    (module) => module.moduleId === moduleId
  );
};

/**
 * Check if user has access to a specific lesson within a module
 */
export const canAccessLesson = (
  accessControl: PartialAccessControl | null | undefined,
  moduleId: string,
  lessonId: string
): boolean => {
  // If no accessControl, user has full access
  if (!accessControl || accessControl.accessType === "full") {
    return true;
  }

  // If no accessibleModules, user has no access
  if (!accessControl.accessibleModules || accessControl.accessibleModules.length === 0) {
    return false;
  }

  // Find the module
  const module = accessControl.accessibleModules.find(
    (m) => m.moduleId === moduleId
  );

  if (!module) {
    return false; // Module not in accessible modules
  }

  // If no accessibleLessons specified, user has access to all lessons in this module
  if (!module.accessibleLessons || module.accessibleLessons.length === 0) {
    return true;
  }

  // Check if lesson is in accessibleLessons
  return module.accessibleLessons.some((lesson) => lesson.lessonId === lessonId);
};

/**
 * Check if user has access to a specific content within a lesson
 */
export const canAccessContent = (
  accessControl: PartialAccessControl | null | undefined,
  moduleId: string,
  lessonId: string,
  contentId: string
): boolean => {
  // If no accessControl, user has full access
  if (!accessControl || accessControl.accessType === "full") {
    return true;
  }

  // If no accessibleModules, user has no access
  if (!accessControl.accessibleModules || accessControl.accessibleModules.length === 0) {
    return false;
  }

  // Find the module
  const module = accessControl.accessibleModules.find(
    (m) => m.moduleId === moduleId
  );

  if (!module) {
    return false; // Module not in accessible modules
  }

  // If no accessibleLessons specified, user has access to all lessons (and all contents)
  if (!module.accessibleLessons || module.accessibleLessons.length === 0) {
    return true;
  }

  // Find the lesson
  const lesson = module.accessibleLessons.find((l) => l.lessonId === lessonId);

  if (!lesson) {
    return false; // Lesson not in accessible lessons
  }

  // If no accessibleContentIds specified, user has access to all contents in this lesson
  if (!lesson.accessibleContentIds || lesson.accessibleContentIds.length === 0) {
    return true;
  }

  // Check if content is in accessibleContentIds
  return lesson.accessibleContentIds.includes(contentId);
};

