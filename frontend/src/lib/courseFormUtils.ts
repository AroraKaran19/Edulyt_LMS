import {
  CourseFormData,
  CourseFormStorage,
  STORAGE_KEY,
  DRAFT_KEY,
  VERSION,
} from "@/types/courseForm";
import { Course } from "@/types/course";
import { sanitizeSlug, generateSlugFromTitle } from "./courseFormValidation";

// ===================
// HTML Text Extraction Utility
// ===================

/**
 * Extracts plain text content from HTML string for validation purposes
 * Removes HTML tags and decodes HTML entities
 */
export const getTextFromHtml = (html: string): string => {
  if (!html) return "";

  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&amp;/g, "&") // Decode &amp;
    .replace(/&lt;/g, "<") // Decode &lt;
    .replace(/&gt;/g, ">") // Decode &gt;
    .replace(/&quot;/g, '"') // Decode &quot;
    .replace(/&#39;/g, "'") // Decode &#39;
    .replace(/&apos;/g, "'") // Decode &apos;
    .replace(/&hellip;/g, "...") // Decode &hellip;
    .replace(/&mdash;/g, "—") // Decode &mdash;
    .replace(/&ndash;/g, "–") // Decode &ndash;
    .trim();
};

// ===================
// Data Transformation Functions
// ===================

export const transformFormDataToCourse = (
  formData: CourseFormData
): Partial<Course> => {
  // Extract form-specific fields that shouldn't be in the course object
  const {
    thumbnailSource,
    thumbnailS3Key,
    previewVideoSource,
    previewVideoS3Key,
    curriculumSource,
    curriculumS3Key,
    brochureSource,
    brochureS3Key,
    currentScreen,
    completedScreens,
    isEditMode,
    courseId,
    ...courseData
  } = formData;

  void thumbnailSource;
  void thumbnailS3Key;
  void previewVideoSource;
  void previewVideoS3Key;
  void curriculumSource;
  void curriculumS3Key;
  void brochureSource;
  void brochureS3Key;
  void currentScreen;
  void completedScreens;
  void isEditMode;
  void courseId;

  // Use the language as provided (full name)
  const validLanguage = courseData.language || "English";

  // Validate ObjectIds for testimonials and FAQs
  const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const validTestimonials =
    formData.testimonials?.filter(
      (id) => id && id.trim().length > 0 && isValidObjectId(id.trim())
    ) || [];

  const validFaqs =
    formData.faqs?.filter(
      (id) => id && id.trim().length > 0 && isValidObjectId(id.trim())
    ) || [];

  // Validate instructors - they should be an array of IDs
  const validInstructors =
    formData.instructor?.filter(
      (id) => id && typeof id === 'string' && id.trim().length > 0 && isValidObjectId(id.trim())
    ) || [];

  return {
    ...courseData,
    language: validLanguage, // Ensure language is always provided (full name)
    // Only include valid ObjectIds for testimonials, FAQs, and instructors
    testimonials: validTestimonials,
    faqs: validFaqs,
    instructor: validInstructors,
  } as any; // Type assertion to handle FAQ[] vs string[] mismatch
};

export const transformCourseToFormData = (
  course: Course,
  isEditMode: boolean = true
): CourseFormData => {
  return {
    // Spread all course properties
    ...course,

    // Convert testimonials and FAQs to string arrays (IDs)
    testimonials: Array.isArray(course.testimonials)
      ? course.testimonials.map((t: any) =>
          typeof t === "string" ? t : t._id || ""
        )
      : [],
    faqs: Array.isArray(course.faqs)
      ? course.faqs.map((f: any) => (typeof f === "string" ? f : f._id || ""))
      : [],

    // Map media fields and set appropriate sources
    thumbnail: course.thumbnail || "",
    previewVideoUrl: course.previewVideoUrl || "",
    curriculum: course.curriculum || "",
    brochure: course.brochure || "",

    // Set source types based on whether URLs exist
    thumbnailSource: course.thumbnail ? "url" : undefined,
    thumbnailS3Key: undefined,
    previewVideoSource: course.previewVideoUrl ? "url" : undefined,
    previewVideoS3Key: undefined,
    curriculumSource: course.curriculum ? "url" : undefined,
    curriculumS3Key: undefined,
    brochureSource: course.brochure ? "url" : undefined,
    brochureS3Key: undefined,

    // Map plans with proper discount handling
    plans: course.plans
      ? {
          essential: course.plans.essential
            ? {
                ...course.plans.essential,
                discount: course.plans.essential.discount
                  ? {
                      ...course.plans.essential.discount,
                      isActive: true, // Set to true if discount exists
                      displayTime: course.plans.essential.discount.displayTime
                        ? course.plans.essential.discount.displayTime
                        : course.discount?.displayTime
                        ? course.discount.displayTime
                        : "00:00:00",
                      resetAfter: course.plans.essential.discount.resetAfter !== undefined
                        ? course.plans.essential.discount.resetAfter
                        : course.discount?.resetAfter !== undefined
                        ? course.discount.resetAfter
                        : 0,
                    }
                  : {
                      isActive: false,
                      discount: "percentage",
                      value: 0,
                      displayTime: course.discount?.displayTime
                        ? course.discount.displayTime
                        : "00:00:00",
                      resetAfter: course.discount?.resetAfter !== undefined
                        ? course.discount.resetAfter
                        : 0,
                    },
              }
            : undefined,
          elite: course.plans.elite
            ? {
                ...course.plans.elite,
                discount: course.plans.elite.discount
                  ? {
                      ...course.plans.elite.discount,
                      isActive: true, // Set to true if discount exists
                      displayTime: course.plans.elite.discount.displayTime
                        ? course.plans.elite.discount.displayTime
                        : course.discount?.displayTime
                        ? course.discount.displayTime
                        : "00:00:00",
                      resetAfter: course.plans.elite.discount.resetAfter !== undefined
                        ? course.plans.elite.discount.resetAfter
                        : course.discount?.resetAfter !== undefined
                        ? course.discount.resetAfter
                        : 0,
                    }
                  : {
                      isActive: false,
                      discount: "percentage",
                      value: 0,
                      displayTime: course.discount?.displayTime
                        ? course.discount.displayTime
                        : "00:00:00",
                      resetAfter: course.discount?.resetAfter !== undefined
                        ? course.discount.resetAfter
                        : 0,
                    },
              }
            : undefined,
        }
      : {
          essential: undefined,
          elite: undefined,
        },

    // Map global discount with proper handling
    discount: course.discount
      ? {
          ...course.discount,
          isActive: course.discount.isActive || false,
          displayTime: course.discount.displayTime || "00:00:00",
          resetAfter: course.discount.resetAfter !== undefined ? course.discount.resetAfter : 0,
        }
      : {
          isActive: false,
          discount: "percentage",
          value: 0,
          displayTime: "00:00:00",
          resetAfter: 0,
        },

    // Navigation & State
    currentScreen: 1,
    completedScreens: [],
    isEditMode,
    courseId: course._id,
  };
};

// ===================
// Storage Key Generation
// ===================

export const getStorageKey = (
  mode: "create" | "edit",
  courseId?: string
): string => {
  if (mode === "edit" && courseId) {
    return `course_form_edit_${courseId}`;
  }
  return STORAGE_KEY; // Default create mode key
};

export const getDraftKey = (
  mode: "create" | "edit",
  courseId?: string
): string => {
  if (mode === "edit" && courseId) {
    return `course_form_draft_edit_${courseId}`;
  }
  return DRAFT_KEY; // Default create mode key
};

export const getModulesStorageKey = (
  mode: "create" | "edit",
  courseId?: string,
  effectiveCourseId?: string
): string => {
  // Use effectiveCourseId if provided (for create mode after course creation)
  if (effectiveCourseId) {
    return `course_modules_${effectiveCourseId}`;
  }
  
  // For edit mode, use courseId directly
  if (mode === "edit" && courseId) {
    return `course_modules_${courseId}`;
  }
  
  // For create mode before course creation
  return "course_modules_new";
};

/**
 * Clean up localStorage for a specific course
 * This should be called when leaving edit mode or finalizing course creation
 */
export const cleanupCourseStorage = (
  mode: "create" | "edit",
  courseId?: string,
  effectiveCourseId?: string
): void => {
  if (typeof window === "undefined") return;

  try {
    // Clear form storage
    const storageKey = getStorageKey(mode, courseId);
    const draftKey = getDraftKey(mode, courseId);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(draftKey);

    // Clear modules storage
    const modulesKey = getModulesStorageKey(mode, courseId, effectiveCourseId);
    localStorage.removeItem(modulesKey);

  } catch (error) {
    console.error("Failed to cleanup course storage:", error);
  }
};

/**
 * Clean up all course-related localStorage keys
 * Use with caution - this will remove ALL course data
 */
export const cleanupAllCourseStorage = (): void => {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("course_form_") || 
         key.startsWith("course_modules_") ||
         key === "createdCourseId" ||
         key === "courseCreationTimestamp")
      ) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Failed to cleanup all course storage:", error);
  }
};

/**
 * Clean up storage for a specific course by ID
 */
export const cleanupStorageForCourse = (courseId: string): void => {
  if (typeof window === "undefined") return;

  try {
    const keys = [
      `course_form_edit_${courseId}`,
      `course_form_draft_edit_${courseId}`,
      `course_modules_${courseId}`,
    ];

    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Failed to cleanup storage for course:", error);
  }
};

/**
 * Get all course IDs from localStorage
 */
export const getAllCourseIdsFromStorage = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    const courseIds = new Set<string>();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Extract course ID from various key patterns
        const editMatch = key.match(/course_form_edit_([^_]+)$/);
        if (editMatch) {
          courseIds.add(editMatch[1]);
          continue;
        }

        const modulesMatch = key.match(/course_modules_([^_]+)$/);
        if (modulesMatch && modulesMatch[1] !== "new") {
          courseIds.add(modulesMatch[1]);
        }
      }
    }

    return Array.from(courseIds);
  } catch (error) {
    console.error("Failed to get course IDs from storage:", error);
    return [];
  }
};

// ===================
// Module Storage Functions
// ===================

export const saveModulesToStorage = (
  modules: any[],
  mode: "create" | "edit",
  courseId?: string,
  effectiveCourseId?: string
): void => {
  if (typeof window === "undefined") return;

  try {
    const storageKey = getModulesStorageKey(mode, courseId, effectiveCourseId);
    localStorage.setItem(storageKey, JSON.stringify(modules));
  } catch (error) {
    console.error("Failed to save modules to storage:", error);
  }
};

export const loadModulesFromStorage = (
  mode: "create" | "edit",
  courseId?: string,
  effectiveCourseId?: string
): any[] => {
  if (typeof window === "undefined") return [];

  try {
    const storageKey = getModulesStorageKey(mode, courseId, effectiveCourseId);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load modules from storage:", error);
    return [];
  }
};

export const clearModulesFromStorage = (
  mode: "create" | "edit",
  courseId?: string,
  effectiveCourseId?: string
): void => {
  if (typeof window === "undefined") return;

  try {
    const storageKey = getModulesStorageKey(mode, courseId, effectiveCourseId);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear modules from storage:", error);
  }
};

// ===================
// Storage Functions
// ===================

export const saveFormDataToStorage = (
  formData: CourseFormData,
  mode: "create" | "edit" = "create",
  courseId?: string
): void => {
  // Skip during SSR
  if (typeof window === "undefined") return;

  try {
    const storageKey = getStorageKey(mode, courseId);
    const storageData: CourseFormStorage = {
      formData,
      lastSaved: new Date().toISOString(),
      version: VERSION,
    };

    localStorage.setItem(storageKey, JSON.stringify(storageData));
  } catch (error) {
    console.error("Failed to save form data to storage:", error);
  }
};

export const loadFormDataFromStorage = (
  mode: "create" | "edit" = "create",
  courseId?: string
): CourseFormData | null => {
  // Return null during SSR
  if (typeof window === "undefined") return null;

  try {
    const storageKey = getStorageKey(mode, courseId);
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const storageData: CourseFormStorage = JSON.parse(stored);

    // Check version compatibility
    if (storageData.version !== VERSION) {
      console.warn("Storage version mismatch, clearing old data");
      clearFormDataFromStorage(mode, courseId);
      return null;
    }

    return storageData.formData;
  } catch (error) {
    console.error("Failed to load form data from storage:", error);
    return null;
  }
};

export const clearFormDataFromStorage = (
  mode: "create" | "edit" = "create",
  courseId?: string
): void => {
  // Skip during SSR
  if (typeof window === "undefined") return;

  try {
    const storageKey = getStorageKey(mode, courseId);
    const draftKey = getDraftKey(mode, courseId);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(draftKey);
  } catch (error) {
    console.error("Failed to clear form data from storage:", error);
  }
};

export const saveDraftToStorage = (
  formData: CourseFormData,
  mode: "create" | "edit" = "create",
  courseId?: string
): void => {
  // Skip during SSR
  if (typeof window === "undefined") return;

  try {
    const draftKey = getDraftKey(mode, courseId);
    const draftData: CourseFormStorage = {
      formData,
      lastSaved: new Date().toISOString(),
      version: VERSION,
    };

    localStorage.setItem(draftKey, JSON.stringify(draftData));
  } catch (error) {
    console.error("Failed to save draft to storage:", error);
  }
};

export const loadDraftFromStorage = (
  mode: "create" | "edit" = "create",
  courseId?: string
): CourseFormData | null => {
  // Return null during SSR
  if (typeof window === "undefined") return null;

  try {
    const draftKey = getDraftKey(mode, courseId);
    const stored = localStorage.getItem(draftKey);
    if (!stored) return null;

    const draftData: CourseFormStorage = JSON.parse(stored);

    // Check version compatibility
    if (draftData.version !== VERSION) {
      console.warn("Draft version mismatch, clearing old draft");
      clearDraftFromStorage(mode, courseId);
      return null;
    }

    return draftData.formData;
  } catch (error) {
    console.error("Failed to load draft from storage:", error);
    return null;
  }
};

export const clearDraftFromStorage = (
  mode: "create" | "edit" = "create",
  courseId?: string
): void => {
  // Skip during SSR
  if (typeof window === "undefined") return;

  try {
    const draftKey = getDraftKey(mode, courseId);
    localStorage.removeItem(draftKey);
  } catch (error) {
    console.error("Failed to clear draft from storage:", error);
  }
};

// ===================
// Storage Management Utilities
// ===================

export const getAllCourseFormKeys = (): string[] => {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("course_form_") || key.startsWith("course_form_draft_"))
      ) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.error("Failed to get course form keys:", error);
    return [];
  }
};

export const clearAllCourseFormData = (): void => {
  try {
    const keys = getAllCourseFormKeys();
    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Failed to clear all course form data:", error);
  }
};

export const getStorageInfo = (
  mode: "create" | "edit",
  courseId?: string
): {
  hasData: boolean;
  lastSaved?: string;
  version?: string;
  key: string;
} => {
  // Return default values during SSR
  if (typeof window === "undefined") {
    return { hasData: false, key: getStorageKey(mode, courseId) };
  }

  try {
    const key = getStorageKey(mode, courseId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return { hasData: false, key };
    }

    const storageData: CourseFormStorage = JSON.parse(stored);
    return {
      hasData: true,
      lastSaved: storageData.lastSaved,
      version: storageData.version,
      key,
    };
  } catch (error) {
    console.error("Failed to get storage info:", error);
    return { hasData: false, key: getStorageKey(mode, courseId) };
  }
};

// ===================
// Form Data Initialization
// ===================

export const getInitialFormData = (
  isEditMode: boolean = false,
  courseId?: string
): CourseFormData => {
  const initialData = {
    // Basic Course properties with defaults
    title: "",
    description: "",
    shortDescription: "",
    category: "",
    audience: "college-students" as const,
    thumbnail: "",
    previewVideoUrl: "",
    isActive: true,
    isFeatured: false,
    isCertified: false,
    whatYouWillLearn: "",
    skills: [],
    highlights: [],
    features: [],
    careerPaths: [],
    skillLevel: "",
    whoShouldJoin: "",
    prerequisites: [],
    duration: "",
    language: "en",
    instructor: [],
    plans: {},
    discount: undefined,
    slug: "",
    metaTitle: "",
    metaDescription: "",
    keywords: [],
    tags: [],
    curriculum: "",
    brochure: "",
    testimonials: [],
    faqs: [],

    // Form-specific fields
    thumbnailSource: undefined,
    thumbnailS3Key: undefined,
    previewVideoSource: undefined,
    previewVideoS3Key: undefined,
    curriculumSource: undefined,
    curriculumS3Key: undefined,
    brochureSource: undefined,
    brochureS3Key: undefined,

    // Navigation & State
    currentScreen: 1,
    completedScreens: [],
    isEditMode,
    courseId,
  };

  return initialData;
};

// ===================
// Auto-generation Functions
// ===================

export const autoGenerateSlug = (title: string): string => {
  return generateSlugFromTitle(title);
};

export const autoGenerateMetaTitle = (
  title: string,
  category: string
): string => {
  const baseTitle = title.trim();
  const categoryText = category ? ` - ${category}` : "";
  return `${baseTitle}${categoryText}`;
};

export const autoGenerateMetaDescription = (
  description: string,
  shortDescription?: string
): string => {
  const source = shortDescription || description;
  const maxLength = 160;

  if (source.length <= maxLength) {
    return source;
  }

  // Truncate at the last complete sentence before maxLength
  const truncated = source.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?")
  );

  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  // If no good sentence break, truncate at word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
};

export const autoGenerateKeywords = (
  title: string,
  skills: string[],
  category: string
): string[] => {
  const keywords = new Set<string>();

  // Add title words
  title
    .toLowerCase()
    .split(/\s+/)
    .forEach((word) => {
      if (word.length > 3) {
        keywords.add(word);
      }
    });

  // Add skills
  skills.forEach((skill) => {
    keywords.add(skill.toLowerCase());
  });

  // Add category
  if (category) {
    keywords.add(category.toLowerCase());
  }

  // Add common course-related keywords
  keywords.add("course");
  keywords.add("learning");
  keywords.add("education");
  keywords.add("online");

  return Array.from(keywords).slice(0, 10); // Limit to 10 keywords
};

// ===================
// Form Data Sanitization
// ===================

export const sanitizeFormData = (formData: CourseFormData): CourseFormData => {
  const sanitizedData = {
    ...formData,
    title: formData.title?.trim() || "",
    description: formData.description?.trim() || "",
    shortDescription: formData.shortDescription?.trim() || "",
    category: formData.category?.trim() || "",
    slug: sanitizeSlug(formData.slug || ""),
    metaTitle: formData.metaTitle?.trim() || "",
    metaDescription: formData.metaDescription?.trim() || "",
    whatYouWillLearn: formData.whatYouWillLearn?.trim() || "",
    skillLevel: formData.skillLevel?.trim() || "",
    whoShouldJoin: formData.whoShouldJoin?.trim() || "",
    duration: formData.duration?.trim() || "",
    language: formData.language?.trim() || "en",
    skills: formData.skills?.filter((skill) => skill.trim().length > 0) || [],
    keywords:
      formData.keywords?.filter((keyword) => keyword.trim().length > 0) || [],
    tags: formData.tags?.filter((tag) => tag.trim().length > 0) || [],
    prerequisites:
      formData.prerequisites?.filter((prereq) => prereq.trim().length > 0) ||
      [],
    highlights:
      formData.highlights?.filter(
        (highlight) =>
          highlight.title?.trim().length > 0 &&
          highlight.description?.trim().length > 0
      ) || [],
    features:
      formData.features?.filter((feature) => feature.trim().length > 0) || [],
    careerPaths:
      formData.careerPaths?.filter((path) => path.trim().length > 0) || [],
    instructor:
      formData.instructor?.filter(
        (id) => id && typeof id === 'string' && id.trim().length > 0
      ) || [],
    testimonials:
      formData.testimonials?.filter((id) => id.trim().length > 0) || [],
  };

  return sanitizedData as CourseFormData;
};

// ===================
// Form Data Validation Helpers
// ===================

export const isFormDataComplete = (formData: CourseFormData): boolean => {
  return !!(
    formData.title &&
    formData.description &&
    formData.category &&
    formData.thumbnail &&
    formData.whatYouWillLearn &&
    formData.skills?.length > 0 &&
    formData.instructor?.length > 0 &&
    (formData.plans?.essential || formData.plans?.elite) &&
    formData.slug &&
    formData.metaTitle &&
    formData.metaDescription
  );
};

export const getIncompleteFields = (formData: CourseFormData): string[] => {
  const incomplete: string[] = [];

  if (!formData.title) incomplete.push("Title");
  if (!formData.description) incomplete.push("Description");
  if (!formData.category) incomplete.push("Category");
  if (!formData.thumbnail) incomplete.push("Thumbnail");
  if (!formData.whatYouWillLearn) incomplete.push("What You Will Learn");
  if (!formData.skills?.length) incomplete.push("Skills");
  if (!formData.instructor?.length) incomplete.push("Instructor");
  if (!formData.plans?.essential && !formData.plans?.elite)
    incomplete.push("Pricing Plans");
  if (!formData.slug) incomplete.push("Slug");
  if (!formData.metaTitle) incomplete.push("Meta Title");
  if (!formData.metaDescription) incomplete.push("Meta Description");

  return incomplete;
};

// ===================
// Progress Calculation
// ===================

export const calculateFormProgress = (formData: CourseFormData): number => {
  const totalFields = 12; // Total required fields
  let completedFields = 0;

  if (formData.title) completedFields++;
  if (formData.description) completedFields++;
  if (formData.category) completedFields++;
  if (formData.thumbnail) completedFields++;
  if (formData.whatYouWillLearn) completedFields++;
  if (formData.skills?.length) completedFields++;
  if (formData.instructor?.length) completedFields++;
  if (formData.plans?.essential || formData.plans?.elite) completedFields++;
  if (formData.slug) completedFields++;
  if (formData.metaTitle) completedFields++;
  if (formData.metaDescription) completedFields++;
  if (formData.audience) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
};

export const calculateScreenProgress = (
  formData: CourseFormData,
  screen: number
): number => {
  const screenConfig: Record<number, string[]> = {
    1: ["title", "description", "category", "thumbnail"],
    2: ["whatYouWillLearn", "skills"],
    3: ["instructor"],
    4: [], // Content screen
    5: ["plans"],
    6: [], // Modules screen
    7: [], // Testimonials screen
    8: ["slug", "metaTitle", "metaDescription"],
    9: [], // Review screen
  };

  const requiredFields = screenConfig[screen] || [];
  if (requiredFields.length === 0) return 100;

  let completedFields = 0;
  requiredFields.forEach((field: string) => {
    const value = formData[field as keyof CourseFormData];
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        if (value.length > 0) completedFields++;
      } else if (typeof value === "object") {
        if (Object.keys(value).length > 0) completedFields++;
      } else {
        completedFields++;
      }
    }
  });

  return Math.round((completedFields / requiredFields.length) * 100);
};
