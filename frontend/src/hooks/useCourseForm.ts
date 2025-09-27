import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import {
  CourseFormData,
  UseCourseFormOptions,
  UseCourseFormReturn,
} from "@/types/courseForm";
import {
  validateScreen,
  validateAllScreens,
} from "@/utils/courseFormValidation";
import {
  getInitialFormData,
  transformFormDataToCourse,
  transformCourseToFormData,
  saveFormDataToStorage,
  loadFormDataFromStorage,
  clearFormDataFromStorage,
  saveDraftToStorage,
  loadDraftFromStorage,
  clearDraftFromStorage,
  sanitizeFormData,
  isFormDataComplete,
  getIncompleteFields,
  calculateFormProgress,
  calculateScreenProgress,
  autoGenerateSlug,
  autoGenerateMetaTitle,
  autoGenerateMetaDescription,
  autoGenerateKeywords,
} from "@/utils/courseFormUtils";
import { useCourses } from "./useCourses";
import { toast } from "react-toastify";

// ===================
// Main Course Form Hook
// ===================

export const useCourseForm = (
  options: UseCourseFormOptions = {}
): UseCourseFormReturn => {
  const {
    mode = "create",
    courseId,
    initialData,
    autoSave = true,
    autoSaveInterval = 30000, // 30 seconds
  } = options;

  // ===================
  // State Management
  // ===================

  const [currentScreen, setCurrentScreen] = useState(1);
  const [completedScreens, setCompletedScreens] = useState<number[]>([]);
  const [isEditMode] = useState(mode === "edit");
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  // ===================
  // External Hooks
  // ===================

  const {
    createCourseMetadata,
    updateCourse: updateCourseAPI,
    updateCourseMetadata: updateCourseMetadataAPI,
    deleteCourseById,
    getCourseByIdAdmin,
  } = useCourses();

  // ===================
  // Form Initialization
  // ===================

  const getInitialData = useCallback((): CourseFormData => {
    if (initialData) {
      return { ...getInitialFormData(isEditMode, courseId), ...initialData };
    }

    // Try to load from draft storage first (most recent data)
    const draftData = loadDraftFromStorage(mode, courseId);
    if (draftData) {
      return { ...draftData, isEditMode, courseId };
    }

    // Fallback to main storage
    const storedData = loadFormDataFromStorage(mode, courseId);
    if (storedData) {
      return { ...storedData, isEditMode, courseId };
    }

    if (isEditMode && courseId) {
      // Load from API in edit mode as last resort
      return getInitialFormData(isEditMode, courseId);
    }

    return getInitialFormData(isEditMode, courseId);
  }, [initialData, isEditMode, courseId, mode]);

  const formMethods: UseFormReturn<CourseFormData> = useForm<CourseFormData>({
    defaultValues: getInitialData(),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState,
    reset,
    trigger,
  } = formMethods;

  // Reset form when initial data changes
  useEffect(() => {
    const initialData = getInitialData();
    reset(initialData);
  }, [reset, mode, courseId, isEditMode]);

  // ===================
  // Data Loading
  // ===================

  const loadCourseData = useCallback(async () => {
    if (!isEditMode || !courseId) return;

    try {
      setIsSaving(true);
      const response = await getCourseByIdAdmin(courseId);

      if (response.success && response.data) {
        const apiFormData = transformCourseToFormData(
          response.data,
          true
        );

        // Try to load from localStorage to preserve local changes
        const draftData = loadDraftFromStorage(mode, courseId);
        const storedData = loadFormDataFromStorage(mode, courseId);
        const localData = draftData || storedData;

        if (localData) {
          // Merge API data with localStorage data, prioritizing localStorage for certain fields
          const mergedData = {
            ...apiFormData,
            ...localData,
            // Preserve these fields from localStorage if they exist
            curriculum: localData.curriculum || apiFormData.curriculum,
            brochure: localData.brochure || apiFormData.brochure,
            curriculumSource:
              localData.curriculumSource || apiFormData.curriculumSource,
            brochureSource:
              localData.brochureSource || apiFormData.brochureSource,
            curriculumS3Key:
              localData.curriculumS3Key || apiFormData.curriculumS3Key,
            brochureS3Key: localData.brochureS3Key || apiFormData.brochureS3Key,
            isEditMode: true,
            courseId: courseId,
          };
          reset(mergedData);
        } else {
          reset(apiFormData);
        }
      }
    } catch (error) {
      console.error("Failed to load course data:", error);
      setUpdateError("Failed to load course data");
    } finally {
      setIsSaving(false);
    }
  }, [isEditMode, courseId, getCourseByIdAdmin, reset, mode]);

  // Load course data on mount for edit mode
  useEffect(() => {
    if (isEditMode && courseId) {
      loadCourseData();
    }
  }, [isEditMode, courseId, loadCourseData]);

  // ===================
  // Auto-save functionality
  // ===================

  // Save on form changes (debounced)
  useEffect(() => {
    if (!autoSave) return;

    const timeoutId = setTimeout(() => {
      const formData = getValues();
      // Always save to draft storage for auto-save
      saveDraftToStorage(formData, mode, courseId);

      if (isFormDataComplete(formData)) {
        saveFormDataToStorage(formData, mode, courseId);
      }
    }, 500); // 0.5 second debounce

    return () => clearTimeout(timeoutId);
  }, [watch(), autoSave, mode, courseId]); // Watch all form values

  // Periodic save as backup
  useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(() => {
      const formData = getValues();
      // Always save to draft storage for auto-save
      saveDraftToStorage(formData, mode, courseId);

      if (isFormDataComplete(formData)) {
        saveFormDataToStorage(formData, mode, courseId);
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, getValues, mode, courseId]);

  // ===================
  // Navigation Functions
  // ===================

  const nextScreen = useCallback(() => {
    const formData = getValues();
    const currentValidation = validateScreen(currentScreen, formData);

    // Save current progress before navigating
    saveDraftToStorage(formData, mode, courseId);

    if (currentValidation.isValid) {
      setCompletedScreens((prev) => {
        if (!prev.includes(currentScreen)) {
          return [...prev, currentScreen];
        }
        return prev;
      });
      setCurrentScreen((prev) => Math.min(prev + 1, 12));
    } else {
      setValidationErrors({
        [`screen_${currentScreen}`]: currentValidation.errors,
      });
    }
  }, [currentScreen, getValues, mode, courseId]);

  const prevScreen = useCallback(() => {
    // Save current progress before navigating
    const formData = getValues();
    saveDraftToStorage(formData, mode, courseId);

    setCurrentScreen((prev) => Math.max(prev - 1, 1));
    setValidationErrors({});
  }, [getValues, mode, courseId]);

  const goToScreen = useCallback((screen: number) => {
    if (screen >= 1 && screen <= 12) {
      setCurrentScreen(screen);
      setValidationErrors({});
    }
  }, []);

  // ===================
  // Validation Functions
  // ===================

  const isScreenCompleted = useCallback(
    (screen: number): boolean => {
      return completedScreens.includes(screen);
    },
    [completedScreens]
  );

  const validateCurrentScreen = useCallback((): boolean => {
    const formData = getValues();
    const validation = validateScreen(currentScreen, formData);

    if (!validation.isValid) {
      setValidationErrors({
        [`screen_${currentScreen}`]: validation.errors,
      });
    } else {
      setValidationErrors({});
    }

    return validation.isValid;
  }, [currentScreen, getValues]);

  const getScreenErrors = useCallback(
    (screen: number): string[] => {
      return validationErrors[`screen_${screen}`] || [];
    },
    [validationErrors]
  );

  // ===================
  // Form Actions
  // ===================

  const saveDraft = useCallback(() => {
    const formData = getValues();
    saveDraftToStorage(formData, mode, courseId);
  }, [getValues, mode, courseId]);

  const loadDraft = useCallback(() => {
    const draftData = loadDraftFromStorage(mode, courseId);
    if (draftData) {
      reset(draftData);
    }
  }, [reset, mode, courseId]);

  const clearDraft = useCallback(() => {
    clearDraftFromStorage(mode, courseId);
  }, [mode, courseId]);

  // ===================
  // Course Actions
  // ===================

  const createCourse = useCallback(async (): Promise<void> => {
    try {
      setIsCreating(true);
      setCreateError("");

      const formData = getValues();
      const sanitizedData = sanitizeFormData(formData);

      // Validate all screens
      const validation = validateAllScreens(sanitizedData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        throw new Error("Form validation failed");
      }

      // Transform to course data
      const courseData = transformFormDataToCourse(sanitizedData);

      // Create course
      const response = await createCourseMetadata(courseData);

      if (!response.success) {
        throw new Error(response.error || "Failed to create course");
      }

      // Navigate to Screen10 on success
      nextScreen();

      // Clear form data after successful creation
      clearFormDataFromStorage(mode, courseId);
    } catch (error) {
      console.error("Failed to create course:", error);
      setCreateError(
        error instanceof Error ? error.message : "Failed to create course"
      );
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [getValues, createCourseMetadata]);

  const updateCourseHandler = useCallback(async (): Promise<void> => {
    if (!isEditMode || !courseId) {
      throw new Error(
        "Cannot update course: not in edit mode or missing course ID"
      );
    }

    try {
      setIsUpdating(true);
      setUpdateError("");

      const formData = getValues();
      const sanitizedData = sanitizeFormData(formData);

      // Validate all screens
      const validation = validateAllScreens(sanitizedData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        throw new Error("Form validation failed");
      }

      // Transform to course data
      const courseData = transformFormDataToCourse(sanitizedData);

      // Update course
      const response = await updateCourseAPI(courseId, courseData);

      if (!response.success) {
        throw new Error(response.error || "Failed to update course");
      }
    } catch (error) {
      console.error("Failed to update course:", error);
      setUpdateError(
        error instanceof Error ? error.message : "Failed to update course"
      );
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [isEditMode, courseId, getValues, updateCourseAPI]);

  const updateCourseMetadataHandler = useCallback(async (): Promise<void> => {
    if (!isEditMode || !courseId) {
      throw new Error(
        "Cannot update course metadata: not in edit mode or missing course ID"
      );
    }

    try {
      setIsUpdating(true);
      setUpdateError("");

      const formData = getValues();
      const sanitizedData = sanitizeFormData(formData);

      // Validate all screens
      const validation = validateAllScreens(sanitizedData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        throw new Error("Form validation failed");
      }

      // Transform to course data
      const courseData = transformFormDataToCourse(sanitizedData);

      // Update course metadata
      const response = await updateCourseMetadataAPI(courseId, courseData);

      if (!response.success) {
        toast.error(response.error || "Failed to update course metadata");
        throw new Error(response.error || "Failed to update course metadata");
      }

      toast.success(
        response.message || "Course metadata updated successfully!"
      );

      // Navigate to Screen10 on success
      nextScreen();
    } catch (error) {
      console.error("Failed to update course metadata:", error);
      setUpdateError(
        error instanceof Error
          ? error.message
          : "Failed to update course metadata"
      );
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [isEditMode, courseId, getValues, updateCourseMetadataAPI]);

  const deleteCourse = useCallback(async (): Promise<void> => {
    if (!isEditMode || !courseId) {
      throw new Error(
        "Cannot delete course: not in edit mode or missing course ID"
      );
    }

    try {
      setIsDeleting(true);
      setDeleteError("");

      const response = await deleteCourseById(courseId);

      if (!response.success) {
        throw new Error(response.error || "Failed to delete course");
      }

      // Clear form data after successful deletion
      clearFormDataFromStorage(mode, courseId);
    } catch (error) {
      console.error("Failed to delete course:", error);
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete course"
      );
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [isEditMode, courseId, deleteCourseById]);

  // ===================
  // Computed Values
  // ===================

  // Use state-based approach for better reactivity
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const formData = getValues();
    const validation = validateScreen(currentScreen, formData);
    setIsFormValid(validation.isValid);
  }, [currentScreen, watch()]);

  const canGoNext = isFormValid && currentScreen <= 12;

  const canGoPrev = useMemo(() => {
    return currentScreen > 1;
  }, [currentScreen]);

  // ===================
  // Auto-generation Functions
  // ===================

  const generateSlug = useCallback(
    (title: string) => {
      const slug = autoGenerateSlug(title);
      setValue("slug" as any, slug);
      return slug;
    },
    [setValue]
  );

  const generateMetaTitle = useCallback(
    (title: string, category: string) => {
      const metaTitle = autoGenerateMetaTitle(title, category);
      setValue("metaTitle" as any, metaTitle);
      return metaTitle;
    },
    [setValue]
  );

  const generateMetaDescription = useCallback(
    (description: string, shortDescription?: string) => {
      const metaDescription = autoGenerateMetaDescription(
        description,
        shortDescription
      );
      setValue("metaDescription" as any, metaDescription);
      return metaDescription;
    },
    [setValue]
  );

  const generateKeywords = useCallback(
    (title: string, skills: string[], category: string) => {
      const keywords = autoGenerateKeywords(title, skills, category);
      setValue("keywords" as any, keywords);
      return keywords;
    },
    [setValue]
  );

  // ===================
  // Return Hook Interface
  // ===================

  return {
    // Form methods from react-hook-form
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState,
    reset,
    trigger,

    // Custom form state
    currentScreen,
    completedScreens,
    isEditMode,
    courseId,

    // Navigation
    nextScreen,
    prevScreen,
    goToScreen,
    canGoNext,
    canGoPrev,

    // Validation
    isScreenCompleted,
    validateCurrentScreen,
    getScreenErrors,

    // Actions
    createCourse,
    updateCourse: updateCourseHandler,
    updateCourseMetadata: updateCourseMetadataHandler,
    deleteCourse,
    saveDraft,
    loadDraft,
    clearDraft,

    // Loading states
    isCreating,
    isUpdating,
    isDeleting,
    isSaving,

    // Error states
    createError,
    updateError,
    deleteError,
    validationErrors,

    // Additional utilities
    generateSlug,
    generateMetaTitle,
    generateMetaDescription,
    generateKeywords,
  };
};

// ===================
// Screen-specific Hooks
// ===================

export const useScreenValidation = (
  screen: number,
  formData: CourseFormData
) => {
  return useMemo(() => {
    return validateScreen(screen, formData);
  }, [screen, formData]);
};

export const useFormProgress = (formData: CourseFormData) => {
  return useMemo(() => {
    return {
      overall: calculateFormProgress(formData),
      incompleteFields: getIncompleteFields(formData),
      isComplete: isFormDataComplete(formData),
    };
  }, [formData]);
};

export const useScreenProgress = (formData: CourseFormData, screen: number) => {
  return useMemo(() => {
    return calculateScreenProgress(formData, screen);
  }, [formData, screen]);
};
