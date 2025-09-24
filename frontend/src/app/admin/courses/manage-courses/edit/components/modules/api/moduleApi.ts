import { CourseModule, CourseLesson, Content } from "@/types/course";
import apiClient from "@/configs/apiConfig";

export interface SaveModuleRequest {
  title: string;
  description?: string;
  thumbnailUrl: string;
  thumbnailSource?: "upload" | "url";
  isActive: boolean;
  isCompleted: boolean;
  lessons: CourseLesson[];
}

export interface SaveModuleResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    module: CourseModule;
  };
  timestamp: string;
}

export interface UpdateModuleResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    module: CourseModule;
  };
  timestamp: string;
}

// Mutate response to extract module data
const mutateModuleResponse = (response: any): CourseModule => {
  if (response?.data?.module) {
    return response.data.module;
  }
  throw new Error("Invalid response structure: module data not found");
};

// Mutate response to extract lesson data
const mutateLessonResponse = (response: any): CourseLesson => {
  if (response?.data?.lesson) {
    return response.data.lesson;
  }
  throw new Error("Invalid response structure: lesson data not found");
};

// Mutate response to extract content data
const mutateContentResponse = (response: any): Content => {
  if (response?.data?.content) {
    return response.data.content;
  }
  throw new Error("Invalid response structure: content data not found");
};

export interface SaveLessonRequest {
  title: string;
  description?: string;
  contentIds?: string[];
}

export interface SaveLessonResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    lesson: CourseLesson;
  };
  timestamp: string;
}

export interface UpdateLessonResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    lesson: CourseLesson;
  };
  timestamp: string;
}

export interface SaveContentRequest {
  title: string;
  description?: string;
  type: "video" | "quiz";
  // Video specific
  sources?: Array<{
    quality: "1080p" | "720p" | "480p" | "360p";
    videoUrl: string;
  }>;
  thumbnailUrl?: string;
  duration?: number;
  // Quiz specific
  questions?: Array<{
    question: string;
    options: string[];
    correctAnswer: string[];
    timeLimit?: number;
  }>;
  passingScore?: number;
  maxAttempts?: number;
  readingMaterials?: Array<{
    content: "pdf" | "docx";
    estimatedReadTime: number;
    downloadUrl?: string;
  }>;
}

export interface SaveContentResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    content: Content;
  };
  timestamp: string;
}

export interface UpdateContentResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    content: Content;
  };
  timestamp: string;
}

/**
 * Save a module to the backend
 */
export const saveModule = async (
  courseId: string,
  moduleData: SaveModuleRequest
): Promise<CourseModule> => {
  try {
    const response = await apiClient.post(
      `/courses/${courseId}/modules`,
      moduleData
    );

    return mutateModuleResponse(response.data);
  } catch (error) {
    console.error("Error saving module:", error);
    throw error;
  }
};

/**
 * Update a module in the backend
 */
export const updateModule = async (
  courseId: string,
  moduleId: string,
  moduleData: Partial<SaveModuleRequest>
): Promise<CourseModule> => {
  try {
    const response = await apiClient.put(
      `/courses/${courseId}/modules/${moduleId}`,
      moduleData
    );

    return mutateModuleResponse(response.data);
  } catch (error) {
    console.error("Error updating module:", error);
    throw error;
  }
};

/**
 * Delete a module from the backend
 */
export const deleteModule = async (
  courseId: string,
  moduleId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete(
      `/courses/${courseId}/modules/${moduleId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
};

/**
 * Save a lesson to the backend
 */
export const saveLesson = async (
  courseId: string,
  moduleId: string,
  lessonData: SaveLessonRequest
): Promise<CourseLesson> => {
  try {
    const response = await apiClient.post(
      `/courses/${courseId}/modules/${moduleId}/lessons`,
      lessonData
    );

    return mutateLessonResponse(response.data);
  } catch (error) {
    console.error("Error saving lesson:", error);
    throw error;
  }
};

/**
 * Update a lesson in the backend
 */
export const updateLesson = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  lessonData: Partial<SaveLessonRequest>
): Promise<CourseLesson> => {
  try {
    const response = await apiClient.put(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      lessonData
    );

    return mutateLessonResponse(response.data);
  } catch (error) {
    console.error("Error updating lesson:", error);
    throw error;
  }
};

/**
 * Delete a lesson from the backend
 */
export const deleteLesson = async (
  courseId: string,
  moduleId: string,
  lessonId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting lesson:", error);
    throw error;
  }
};

/**
 * Save content to the backend
 */
export const saveContent = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  contentData: SaveContentRequest
): Promise<Content> => {
  try {
    const response = await apiClient.post(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents`,
      contentData
    );

    return mutateContentResponse(response.data);
  } catch (error) {
    console.error("Error saving content:", error);
    throw error;
  }
};

/**
 * Update content in the backend
 */
export const updateContent = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  contentId: string,
  contentData: Partial<SaveContentRequest>
): Promise<Content> => {
  try {
    const response = await apiClient.put(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents/${contentId}`,
      contentData
    );

    return mutateContentResponse(response.data);
  } catch (error) {
    console.error("Error updating content:", error);
    throw error;
  }
};

/**
 * Delete content from the backend
 */
export const deleteContent = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  contentId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents/${contentId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting content:", error);
    throw error;
  }
};

/**
 * Get course ID from localStorage (edit flow)
 */
export const getCourseId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("course_edit_course_id");
};

/**
 * Save course ID to localStorage (edit flow)
 */
export const setCourseId = (courseId: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("course_edit_course_id", courseId);
};

/**
 * Update module ID in localStorage and state
 */
export const updateModuleIdInStorage = (
  tempId: string,
  realId: string
): void => {
  if (typeof window === "undefined") return;

  // Get existing modules from localStorage
  const existingModules = localStorage.getItem("course_modules_draft");
  if (existingModules) {
    try {
      const modules = JSON.parse(existingModules);
      const updatedModules = modules.map((module: any) =>
        module._id === tempId ? { ...module, _id: realId } : module
      );
      localStorage.setItem(
        "course_modules_edit_draft",
        JSON.stringify(updatedModules)
      );
    } catch (error) {
      console.error("Error updating module ID in localStorage:", error);
    }
  }
};

/**
 * Save module data to localStorage
 */
export const saveModuleToStorage = (moduleData: any): void => {
  if (typeof window === "undefined") return;

  try {
    const existingModules = localStorage.getItem("course_modules_edit_draft");
    const modules = existingModules ? JSON.parse(existingModules) : [];

    // Add or update the module
    const existingIndex = modules.findIndex(
      (m: any) => m._id === moduleData._id
    );
    if (existingIndex >= 0) {
      modules[existingIndex] = moduleData;
    } else {
      modules.push(moduleData);
    }

    localStorage.setItem("course_modules_edit_draft", JSON.stringify(modules));
  } catch (error) {
    console.error("Error saving module to edit localStorage:", error);
  }
};

/**
 * Save lesson data to localStorage
 */
export const saveLessonToStorage = (lessonData: CourseLesson): void => {
  if (typeof window === "undefined") return;

  try {
    const existingLessons = localStorage.getItem("course_lessons_edit_draft");
    const lessons = existingLessons ? JSON.parse(existingLessons) : [];

    // Add or update the lesson
    const existingIndex = lessons.findIndex(
      (l: any) => l._id === lessonData._id
    );
    if (existingIndex >= 0) {
      lessons[existingIndex] = lessonData;
    } else {
      lessons.push(lessonData);
    }

    localStorage.setItem("course_lessons_edit_draft", JSON.stringify(lessons));
  } catch (error) {
    console.error("Error saving lesson to edit localStorage:", error);
  }
};

/**
 * Get lessons from localStorage
 */
export const getLessonsFromStorage = (): CourseLesson[] => {
  if (typeof window === "undefined") return [];

  try {
    const existingLessons = localStorage.getItem("course_lessons_edit_draft");
    return existingLessons ? JSON.parse(existingLessons) : [];
  } catch (error) {
    console.error("Error getting lessons from edit localStorage:", error);
    return [];
  }
};

/**
 * Update lesson ID in localStorage
 */
export const updateLessonIdInStorage = (
  tempId: string,
  realId: string
): void => {
  if (typeof window === "undefined") return;

  try {
    const existingLessons = localStorage.getItem("course_lessons_edit_draft");
    if (existingLessons) {
      const lessons = JSON.parse(existingLessons);
      const updatedLessons = lessons.map((lesson: any) =>
        lesson._id === tempId ? { ...lesson, _id: realId } : lesson
      );
      localStorage.setItem(
        "course_lessons_edit_draft",
        JSON.stringify(updatedLessons)
      );
    }
  } catch (error) {
    console.error("Error updating lesson ID in localStorage:", error);
  }
};

/**
 * Save content data to localStorage
 */
export const saveContentToStorage = (contentData: Content): void => {
  if (typeof window === "undefined") return;

  try {
    const existingContent = localStorage.getItem("course_content_edit_draft");
    const content = existingContent ? JSON.parse(existingContent) : [];

    // Add or update the content
    const existingIndex = content.findIndex(
      (c: any) => c._id === contentData._id
    );
    if (existingIndex >= 0) {
      content[existingIndex] = contentData;
    } else {
      content.push(contentData);
    }

    localStorage.setItem("course_content_edit_draft", JSON.stringify(content));
  } catch (error) {
    console.error("Error saving content to edit localStorage:", error);
  }
};

/**
 * Get content from localStorage
 */
export const getContentFromStorage = (): Content[] => {
  if (typeof window === "undefined") return [];

  try {
    const existingContent = localStorage.getItem("course_content_edit_draft");
    return existingContent ? JSON.parse(existingContent) : [];
  } catch (error) {
    console.error("Error getting content from edit localStorage:", error);
    return [];
  }
};

/**
 * Update content ID in localStorage
 */
export const updateContentIdInStorage = (
  tempId: string,
  realId: string
): void => {
  if (typeof window === "undefined") return;

  try {
    const existingContent = localStorage.getItem("course_content_edit_draft");
    if (existingContent) {
      const content = JSON.parse(existingContent);
      const updatedContent = content.map((c: any) =>
        c._id === tempId ? { ...c, _id: realId } : c
      );
      localStorage.setItem(
        "course_content_edit_draft",
        JSON.stringify(updatedContent)
      );
    }
  } catch (error) {
    console.error("Error updating content ID in localStorage:", error);
  }
};

/**
 * Remove lesson from localStorage
 */
export const removeLessonFromStorage = (lessonId: string): void => {
  if (typeof window === "undefined") return;

  try {
    const existingLessons = localStorage.getItem("course_lessons_edit_draft");
    if (existingLessons) {
      const lessons = JSON.parse(existingLessons);
      const updatedLessons = lessons.filter((lesson: any) => lesson._id !== lessonId);
      localStorage.setItem(
        "course_lessons_edit_draft",
        JSON.stringify(updatedLessons)
      );
      console.log("Removed lesson from localStorage:", lessonId);
    }
  } catch (error) {
    console.error("Error removing lesson from localStorage:", error);
  }
};

/**
 * Remove content from localStorage
 */
export const removeContentFromStorage = (contentId: string): void => {
  if (typeof window === "undefined") return;

  try {
    const existingContent = localStorage.getItem("course_content_edit_draft");
    if (existingContent) {
      const content = JSON.parse(existingContent);
      const updatedContent = content.filter((c: any) => c._id !== contentId);
      localStorage.setItem(
        "course_content_edit_draft",
        JSON.stringify(updatedContent)
      );
      console.log("Removed content from localStorage:", contentId);
    }
  } catch (error) {
    console.error("Error removing content from localStorage:", error);
  }
};

/**
 * Remove module from localStorage
 */
export const removeModuleFromStorage = (moduleId: string): void => {
  if (typeof window === "undefined") return;

  try {
    const existingModules = localStorage.getItem("course_modules_edit_draft");
    if (existingModules) {
      const modules = JSON.parse(existingModules);
      const updatedModules = modules.filter((module: any) => module._id !== moduleId);
      localStorage.setItem(
        "course_modules_edit_draft",
        JSON.stringify(updatedModules)
      );
      console.log("Removed module from localStorage:", moduleId);
    }
  } catch (error) {
    console.error("Error removing module from localStorage:", error);
  }
};

/**
 * Update course module references in the backend
 */
export const updateCourseModuleIds = async (
  courseId: string,
  moduleIds: string[]
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.put(
      `/courses/${courseId}/modules/references`,
      { moduleIds: moduleIds }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating course module references:", error);
    throw error;
  }
};
