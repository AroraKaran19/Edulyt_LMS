import { useCallback, useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import {
  CourseFormData,
  UseCourseFormOptions,
  UseCourseFormReturn,
} from "@/types/courseForm";
import {
  validateAllScreens,
  validateScreen1,
  validateScreen2,
  validateScreen3,
  validateScreen4,
  validateScreen5,
  validateScreen8,
} from "@/lib/courseFormValidation";
import {
  getInitialFormData,
  transformFormDataToCourse,
  transformCourseToFormData,
  clearFormDataFromStorage,
  sanitizeFormData,
  loadDraftFromStorage,
  loadFormDataFromStorage,
  saveDraftToStorage,
  saveFormDataToStorage,
  isFormDataComplete,
} from "@/lib/courseFormUtils";
import { toast } from "react-toastify";
import { Course } from "@/types";
import apiClient from "@/configs/apiConfig";

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
  const [isEditMode] = useState(mode === "edit");
  const [currentCourseId, setCurrentCourseId] = useState<string | undefined>(
    courseId
  );

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState<string>("");
  const [updateError, setUpdateError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  const createCourseMetadata = useCallback(
    async (courseData: Partial<Course>): Promise<any> => {
      console.log("courseData", courseData);

      const response = await apiClient.post("/courses/metadata", courseData);
      return response.data;
    },
    []
  );

  const updateCourseMetadata = useCallback(
    async (courseId: string, courseData: Partial<Course>): Promise<any> => {
      const response = await apiClient.put(
        `/courses/${courseId}/metadata`,
        courseData
      );
      return response.data;
    },
    []
  );

  const getCourseByIdAdmin = useCallback(
    async (courseId: string): Promise<any> => {
      const response = await apiClient.get(`/courses/admin/id/${courseId}`);
      return response.data;
    },
    []
  );

  // ===================
  // Form Initialization
  // ===================

  const getInitialData = useCallback((): CourseFormData => {
    if (initialData) {
      return {
        ...getInitialFormData(isEditMode, currentCourseId),
        ...initialData,
      };
    }

    // Try to load from draft storage first (most recent data)
    const draftData = loadDraftFromStorage(mode, courseId);
    if (draftData) {
      return { ...draftData, isEditMode, courseId: currentCourseId };
    }

    // Fallback to main storage
    const storedData = loadFormDataFromStorage(mode, courseId);
    if (storedData) {
      return { ...storedData, isEditMode, courseId: currentCourseId };
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
    if (!isEditMode || !currentCourseId) return;

    try {
      setIsSaving(true);
      const response = await getCourseByIdAdmin(currentCourseId);

      if (response.success && response.data) {
        const apiFormData = transformCourseToFormData(response.data, true);

        // Try to load from localStorage to preserve local changes
        const draftData = loadDraftFromStorage(mode, courseId);
        const storedData = loadFormDataFromStorage(mode, courseId);
        const localData = draftData || storedData;

        if (localData) {
          // Merge API data with localStorage data, prioritizing localStorage for certain fields
          const mergedData = {
            ...localData,
            ...apiFormData,
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
            // Preserve form state from localStorage
            currentScreen: localData.currentScreen || apiFormData.currentScreen,
            completedScreens: localData.completedScreens || apiFormData.completedScreens,
            isEditMode: true,
            courseId: currentCourseId,
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
  }, [isEditMode, currentCourseId, getCourseByIdAdmin, reset, mode]);

  // Load course data on mount for edit mode
  useEffect(() => {
    if (isEditMode && currentCourseId) {
      loadCourseData();
    }
  }, [isEditMode, currentCourseId, loadCourseData]);

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

  const nextScreen = useCallback(async () => {
    // Validate current screen before moving to next
    const formData = getValues();
    const sanitizedData = sanitizeFormData(formData);

    // Get current screen validation
    const screenValidators = {
      1: validateScreen1,
      2: validateScreen2,
      3: validateScreen3,
      4: validateScreen4,
      5: validateScreen5,
      6: () => ({ isValid: true, errors: [], warnings: [], missingFields: [] }), // Modules screen
      7: () => ({ isValid: true, errors: [], warnings: [], missingFields: [] }), // Testimonials screen
      8: validateScreen8,
      9: () => ({ isValid: true, errors: [], warnings: [], missingFields: [] }), // Review & Create screen
      10: () => ({ isValid: true, errors: [], warnings: [], missingFields: [] }), // Course Created screen
      11: () => ({ isValid: true, errors: [], warnings: [], missingFields: [] }), // Course Modules & Content screen
      12: () => ({ isValid: true, errors: [], warnings: [], missingFields: [] }), // Course Summary screen
      13: () => ({ isValid: true, errors: [], warnings: [], missingFields: [] }), // Instructor Selection screen
    };

    const currentScreenValidator =
      screenValidators[currentScreen as keyof typeof screenValidators];
    if (currentScreenValidator) {
      const validation = currentScreenValidator(sanitizedData);
      if (!validation.isValid) {
        // Convert errors array to Record format
        const errorsRecord: Record<string, string[]> = {};
        validation.errors.forEach((error, index) => {
          errorsRecord[`screen${currentScreen}_error_${index}`] = [error];
        });
        setValidationErrors(errorsRecord);

        // Show specific error messages instead of generic message
        if (validation.errors.length === 1) {
          toast.error(validation.errors[0]);
        } else if (validation.errors.length <= 3) {
          // Show all errors if 3 or fewer
          validation.errors.forEach((error, index) => {
            setTimeout(() => {
              toast.error(`${index + 1}. ${error}`);
            }, index * 100); // Stagger the toasts slightly
          });
        } else {
          // Show first few errors and indicate there are more
          toast.error(`${validation.errors[0]}`);
          setTimeout(() => {
            toast.error(
              `${validation.errors[1]} (and ${
                validation.errors.length - 2
              } more issues)`
            );
          }, 100);
        }
        return; // Don't navigate if validation fails
      }
    }

    // Clear validation errors if validation passes
    setValidationErrors({});

    // Navigate to next screen
    setCurrentScreen((prev) => Math.min(prev + 1, 13));
  }, [currentScreen, getValues, setValidationErrors]);

  const prevScreen = useCallback(() => {
    setCurrentScreen((prev) => Math.max(prev - 1, 1));
  }, []);

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
        const errorMessage =
          "Form validation failed. Please check the required fields.";
        toast.error(errorMessage);
        setCreateError(errorMessage);
        return; // Don't throw, just return to prevent further execution
      }

      // Transform to course data
      const courseData = transformFormDataToCourse(sanitizedData);

      // Create course
      const response = await createCourseMetadata(courseData);

      if (!response.success) {
        const errorMessage = response.error || "Failed to create course";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Update courseId with the newly created course ID
      // The backend returns the course data directly with _id field
      const responseData = response.data as any;
      let newCourseId: string | null = null;

      if (responseData?._id) {
        // Course ID is directly in the response data
        newCourseId = responseData._id;
        setCurrentCourseId(responseData._id);
      } else if (responseData?.courseId) {
        // Fallback: check for courseId field
        newCourseId = responseData.courseId;
        setCurrentCourseId(responseData.courseId);
      } else if (responseData?.course?._id) {
        // Fallback: check for nested course._id
        newCourseId = responseData.course._id;
        setCurrentCourseId(responseData.course._id);
      }

      // Store course ID in localStorage to track course creation
      if (newCourseId) {
        localStorage.setItem("createdCourseId", newCourseId);
        localStorage.setItem("courseCreationTimestamp", Date.now().toString());
      } else {
        console.error("No course ID found in response:", responseData);
      }

      toast.success(
        "Course Successfully Created!\n\nYour course has been created and is now ready for students to enroll. You can manage it from the courses dashboard."
      );

      // Navigate to Screen10 on success
      nextScreen();

      // Clear form data after successful creation
      clearFormDataFromStorage(mode, currentCourseId);
    } catch (error) {
      console.error("Failed to create course:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create course";
      setCreateError(errorMessage);
      toast.error(errorMessage);
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
      const response = await updateCourseMetadata(courseId, courseData);

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
  }, [isEditMode, courseId, getValues, updateCourseMetadata]);

  const updateCourseMetadataHandler = useCallback(async (): Promise<void> => {
    // In create mode, use the course ID from localStorage
    let targetCourseId = courseId;

    if (!isEditMode) {
      // We're in create mode, get the course ID from localStorage
      const createdCourseId = localStorage.getItem("createdCourseId");
      if (!createdCourseId) {
        throw new Error(
          "Cannot update course metadata: course not found. Please create the course first."
        );
      }
      targetCourseId = createdCourseId;
    } else if (!courseId) {
      throw new Error("Cannot update course metadata: missing course ID");
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
        const errorMessage =
          "Form validation failed. Please check the required fields.";
        toast.error(errorMessage);
        setUpdateError(errorMessage);
        return; // Don't throw, just return to prevent further execution
      }

      // Transform to course data
      const courseData = transformFormDataToCourse(sanitizedData);

      // Update course metadata
      const response = await updateCourseMetadata(targetCourseId!, courseData);

      if (!response.success) {
        const errorMessage =
          response.error || "Failed to update course metadata";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(
        "Course Successfully Updated!\n\nYour course metadata has been updated and changes are now live. Students will see the updated information."
      );

      // Navigate to Screen10 on success
      nextScreen();
    } catch (error) {
      console.error("Failed to update course metadata:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update course metadata";
      setUpdateError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [isEditMode, courseId, getValues, updateCourseMetadata]);

  // ===================
  // Computed Values
  // ===================

  const canGoNext = currentScreen <= 13;

  // ===================
  // Course Creation Status
  // ===================

  const isCourseCreated = useCallback((): boolean => {
    if (typeof window === "undefined") return false;

    const createdCourseId = localStorage.getItem("createdCourseId");
    const creationTimestamp = localStorage.getItem("courseCreationTimestamp");

    if (!createdCourseId || !creationTimestamp) return false;

    // Check if the timestamp is recent (within last 24 hours)
    const timestamp = parseInt(creationTimestamp);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const isRecent = now - timestamp < twentyFourHours;
    console.log("Course creation check:", { timestamp, now, isRecent });

    return isRecent;
  }, []);

  const getCreatedCourseId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("createdCourseId");
  }, []);

  const clearCourseCreationStatus = useCallback((): void => {
    if (typeof window === "undefined") return;
    
    // Clear course creation status
    localStorage.removeItem("createdCourseId");
    localStorage.removeItem("courseCreationTimestamp");
    
    // Clear form data and draft
    localStorage.removeItem("course_form_data");
    localStorage.removeItem("course_form_draft");
    
    // Clear course modules data for the created course
    const createdCourseId = localStorage.getItem("createdCourseId");
    if (createdCourseId) {
      localStorage.removeItem(`course_modules_${createdCourseId}`);
    }
    
    // Also clear any "new" course modules data
    localStorage.removeItem("course_modules_new");
    
    // Clear any other course-related localStorage keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("course_modules_") || key.startsWith("course_form_"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

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
    trigger: () => Promise.resolve(true),

    // Custom form state
    currentScreen,
    completedScreens: [],
    isEditMode,
    courseId: currentCourseId,

    // Navigation
    nextScreen,
    prevScreen,
    goToScreen: () => {},
    canGoNext,
    canGoPrev: currentScreen > 1,

    // Validation
    isScreenCompleted: () => true,
    validateCurrentScreen: () => true,
    getScreenErrors: () => [],

    // Actions
    createCourse,
    updateCourse: updateCourseHandler,
    updateCourseMetadata: updateCourseMetadataHandler,
    deleteCourse: () => Promise.resolve(),
    saveDraft: () => {},
    loadDraft: () => {},
    clearDraft: () => {},

    // Loading states
    isCreating,
    isUpdating,
    isDeleting: false,
    isSaving,

    // Error states
    createError,
    updateError,
    deleteError: "",
    validationErrors,

    // Additional utilities
    generateSlug: (title: string) => title.toLowerCase().replace(/\s+/g, "-"),
    generateMetaTitle: (title: string, category: string) =>
      `${title} | ${category}`,
    generateMetaDescription: (description: string, shortDescription?: string) =>
      shortDescription || description.substring(0, 160),
    generateKeywords: (title: string, skills: string[], category: string) => [
      title,
      category,
      ...skills,
    ],

    // Course creation status
    isCourseCreated,
    getCreatedCourseId,
    clearCourseCreationStatus,
  };
};
