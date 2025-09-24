import { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import {
  CourseModule,
  CourseLesson,
  Content,
  VideoContent,
  QuizContent,
} from "@/types/course";
import {
  saveModule as saveModuleApi,
  updateModule,
  deleteModule as deleteModuleApi,
  saveLesson as saveLessonApi,
  updateLesson,
  deleteLesson as deleteLessonApi,
  saveContent as saveContentApi,
  updateContent,
  deleteContent as deleteContentApi,
  updateModuleIdInStorage,
  updateLessonIdInStorage,
  updateContentIdInStorage,
  updateCourseModuleIds,
  removeLessonFromStorage,
  removeContentFromStorage,
  removeModuleFromStorage,
} from "../api/moduleApi";
import { useUpload } from "@/hooks/useUpload";
import { clearCourseCreationStorage } from "@/utils/courseStorage";

export const useCourseModules = (initialCourseData?: any) => {
  const [course, setCourse] = useState({
    _id: initialCourseData?._id || "",
    title: initialCourseData?.title || "",
    description: initialCourseData?.description || "",
    modules: initialCourseData?.modules || ([] as CourseModule[]),
    moduleIds: initialCourseData?.moduleIds || ([] as string[]), // Track module IDs for course reference
  });

  // Ensure we always have the latest course data from the reducer
  useEffect(() => {
    if (initialCourseData && initialCourseData._id) {
      setCourse(prev => {
        // Only update if the course ID has changed or if we don't have modules yet
        if (prev._id !== initialCourseData._id || prev.modules.length === 0) {
          return {
            _id: initialCourseData._id,
            title: initialCourseData.title || "",
            description: initialCourseData.description || "",
            modules: initialCourseData.modules || [],
            moduleIds: initialCourseData.moduleIds || [],
          };
        }
        return prev;
      });
    }
  }, [initialCourseData?._id, initialCourseData?.modules]);

  const [savedModules, setSavedModules] = useState<Set<number>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set()
  );
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set()
  );
  const [expandedContent, setExpandedContent] = useState<Set<string>>(
    new Set()
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessonSaveError, setLessonSaveError] = useState<string | null>(null);
  const [savedLessons, setSavedLessons] = useState<Set<string>>(new Set());
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentSaveError, setContentSaveError] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState<Set<string>>(new Set());

  // Use upload hook for S3 operations
  const { uploadWithPresignedUrl, getVideoDuration } = useUpload();

  // Helper function to generate a unique ID
  const generateId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Load course data from localStorage on component mount
  const loadCourseDataFromStorage = () => {
    if (typeof window === "undefined") return;

    try {
      // Load course metadata from edit flow
      const courseId = localStorage.getItem("course_edit_course_id");
      const courseDraft = localStorage.getItem("course_edit_draft");
      const savedModules = localStorage.getItem("course_modules_edit_draft");

      let apiModules: CourseModule[] = [];
      let realtimeModules: CourseModule[] = [];

      // Load modules from API data (course_edit_draft)
      if (courseDraft) {
        const courseData = JSON.parse(courseDraft);

        setCourse((prev) => ({
          ...prev,
          _id: courseId || prev._id,
          title: courseData.title || prev.title,
          description: courseData.description || prev.description,
        }));

        // Extract modules from API data
        if (courseData.modules && Array.isArray(courseData.modules)) {
          apiModules = courseData.modules;
        }
      }

      // Load modules from real-time updates (course_modules_edit_draft)
      if (savedModules) {
        realtimeModules = JSON.parse(savedModules);
      }

      // Merge modules: API modules + real-time modules
      // Real-time modules take precedence for modules that exist in both
      const mergedModules = [...apiModules];

      realtimeModules.forEach((realtimeModule) => {
        const existingIndex = mergedModules.findIndex(
          (apiModule) => apiModule._id === realtimeModule._id
        );

        if (existingIndex >= 0) {
          // Update existing module with real-time data
          mergedModules[existingIndex] = realtimeModule;
        } else {
          // Add new module from real-time updates
          mergedModules.push(realtimeModule);
        }
      });

      // Transform modules to ensure lessons and content are in the correct format for UI
      const transformedModules = mergedModules.map((currentModule: CourseModule) => {
        let transformedModule = { ...currentModule };

        // Transform lessons: lessonIds (with full objects) → lessons array
        if (
          currentModule.lessonIds &&
          Array.isArray(currentModule.lessonIds) &&
          currentModule.lessonIds.length > 0
        ) {
          // Check if lessonIds contains full objects (not just IDs)
          const hasFullObjects = currentModule.lessonIds.some((item: any) => {
            const isObject = typeof item === "object" && item !== null;
            const hasId = isObject && item._id;
            return isObject && hasId;
          });

          if (hasFullObjects) {
            // Transform each lesson to also handle contentIds → contents
            const transformedLessons = currentModule.lessonIds.map((lesson: any) => {
              if (typeof lesson === "object" && lesson !== null) {
                let transformedLesson = { ...lesson };

                // Transform content: contentIds (with full objects) → contents array
                if (
                  lesson.contentIds &&
                  Array.isArray(lesson.contentIds) &&
                  lesson.contentIds.length > 0
                ) {
                  // Check if contentIds contains full objects
                  const hasFullContentObjects = lesson.contentIds.some(
                    (item: any) => {
                      const isObject =
                        typeof item === "object" && item !== null;
                      const hasId = isObject && item._id;
                      return isObject && hasId;
                    }
                  );

                  if (hasFullContentObjects) {
                    transformedLesson = {
                      ...transformedLesson,
                      contents: lesson.contentIds, // Move full objects to contents
                      contentIds: lesson.contentIds.map((content: any) =>
                        typeof content === "object" ? content._id : content
                      ), // Keep only IDs in contentIds
                    };
                  }
                }

                return transformedLesson;
              }
              return lesson;
            });

            transformedModule = {
              ...transformedModule,
              lessons: transformedLessons, // Move transformed lessons to lessons array
              lessonIds: currentModule.lessonIds.map((lesson: any) =>
                typeof lesson === "object" ? lesson._id : lesson
              ), // Keep only IDs in lessonIds
            };

          }
        }

        return transformedModule;
      });

      if (mergedModules.length > 0) {
        // Extract module IDs for course reference
        const moduleIds = mergedModules
          .filter((currentModule) => currentModule._id && !currentModule._id.startsWith("temp_"))
          .map((currentModule) => currentModule._id!);

        setCourse((prev) => {
          const newCourse = {
            ...prev,
            modules: transformedModules,
            moduleIds: moduleIds,
          };
          return newCourse;
        });

        // Mark modules as saved based on whether they have real IDs
        const savedModuleIndices = new Set(
          mergedModules
            .map((currentModule, index) =>
              currentModule._id && !currentModule._id.startsWith("temp_") ? index : -1
            )
            .filter((index) => index !== -1)
        );
        setSavedModules(savedModuleIndices);


      }

      // Extract lessons and content from transformed modules (single source of truth)
      let allLessons: any[] = [];
      let allContent: any[] = [];

      transformedModules.forEach((currentModule: any) => {
        // Prioritize lessons array (transformed data) over lessonIds
        const moduleLessons = currentModule.lessons || [];

        if (Array.isArray(moduleLessons)) {
          allLessons = [...allLessons, ...moduleLessons];

          // Extract content from lessons
          moduleLessons.forEach((lesson: CourseLesson) => {
            // Prioritize contents array (transformed data) over contentIds
            const lessonContent = lesson.contents || [];
            if (Array.isArray(lessonContent)) {
              allContent = [...allContent, ...lessonContent];
            }
          });
        }
      });

      // Mark lessons as saved (they have real IDs, not temp IDs)
      if (allLessons.length > 0) {
        const savedLessonIds = new Set(
          allLessons
            .filter((lesson) => lesson._id && !lesson._id.startsWith("temp_"))
            .map((lesson) => lesson._id!)
        );
        setSavedLessons(savedLessonIds);
      }

      // Mark content as saved (they have real IDs, not temp IDs)
      if (allContent.length > 0) {
        const savedContentIds = new Set(
          allContent
            .filter(
              (content) => content._id && !content._id.startsWith("temp_")
            )
            .map((content) => content._id!)
        );
        setSavedContent(savedContentIds);
      }
    } catch (error) {
      console.error("Error loading course data from localStorage:", error);
    }
  };

  // Load course data on component mount
  useEffect(() => {
    loadCourseDataFromStorage();
  }, []);

  // Update course data when initial course data changes
  useEffect(() => {
    if (initialCourseData) {
      // Transform modules to ensure lessons and content are in the correct format for UI
      const transformedModules = (initialCourseData.modules || []).map(
        (currentModule: CourseModule) => {
          let transformedModule = { ...currentModule };

          // Transform lessons: lessonIds (with full objects) → lessons array
          if (
            currentModule.lessonIds &&
            Array.isArray(currentModule.lessonIds) &&
            currentModule.lessonIds.length > 0
          ) {
            // Check if lessonIds contains full objects (not just IDs)
            const hasFullObjects = currentModule.lessonIds.some((item: any) => {
              const isObject = typeof item === "object" && item !== null;
              const hasId = isObject && item._id;
              return isObject && hasId;
            });

            if (hasFullObjects) {
            // Transform each lesson to also handle contentIds → contents
            const transformedLessons = currentModule.lessonIds.map((lesson: any) => {
                if (typeof lesson === "object" && lesson !== null) {
                  let transformedLesson = { ...lesson };

                  // Transform content: contentIds (with full objects) → contents array
                  if (
                    lesson.contentIds &&
                    Array.isArray(lesson.contentIds) &&
                    lesson.contentIds.length > 0
                  ) {
                    // Check if contentIds contains full objects
                    const hasFullContentObjects = lesson.contentIds.some(
                      (item: any) => {
                        const isObject =
                          typeof item === "object" && item !== null;
                        const hasId = isObject && item._id;
                        return isObject && hasId;
                      }
                    );

                    if (hasFullContentObjects) {
                      transformedLesson = {
                        ...transformedLesson,
                        contents: lesson.contentIds, // Move full objects to contents
                        contentIds: lesson.contentIds.map((content: any) =>
                          typeof content === "object" ? content._id : content
                        ), // Keep only IDs in contentIds
                      };
                    }
                  }

                  return transformedLesson;
                }
                return lesson;
              });

              transformedModule = {
                ...transformedModule,
              lessons: transformedLessons, // Move transformed lessons to lessons array
              lessonIds: currentModule.lessonIds.map((lesson: any) =>
                typeof lesson === "object" ? lesson._id : lesson
              ), // Keep only IDs in lessonIds
              };
            }
          }

          return transformedModule;
        }
      );

      setCourse((prev) => ({
        ...prev,
        _id: initialCourseData._id || prev._id,
        title: initialCourseData.title || prev.title,
        description: initialCourseData.description || prev.description,
        modules: transformedModules,
        moduleIds: initialCourseData.moduleIds || prev.moduleIds,
      }));

    }
  }, [initialCourseData, initialCourseData?._id, initialCourseData?.modules]);

  // Sync modules to course_edit_draft whenever modules change
  useEffect(() => {
    if (course.modules.length > 0) {
      syncModulesToCourseDraft();
    }
  }, [course.modules]);

  // No need for separate lesson and content sync - everything is in course_edit_draft

  // Update course data in localStorage
  const updateCourseInStorage = (courseData: Partial<typeof course>) => {
    if (typeof window === "undefined") return;

    try {
      const currentCourse = { ...course, ...courseData };
      localStorage.setItem("course_edit_draft", JSON.stringify(currentCourse));
    } catch (error) {
      console.error("Error updating course data in edit localStorage:", error);
    }
  };

  // Sync modules to course_edit_draft when modules are updated
  const syncModulesToCourseDraft = () => {
    if (typeof window === "undefined") return;

    try {
      const courseDraft = localStorage.getItem("course_edit_draft");
      if (courseDraft) {
        const courseData = JSON.parse(courseDraft);
        // Update the complete modules array with all nested data (lessons and content)
        courseData.modules = course.modules;
        localStorage.setItem("course_edit_draft", JSON.stringify(courseData));
      }
    } catch (error) {
      console.error("Error syncing course data to draft:", error);
    }
  };

  // No separate sync functions needed - everything is handled by syncModulesToCourseDraft

  // Helper function to update course moduleIds in backend
  const updateCourseModuleIdsInBackend = async (moduleIds: string[]) => {
    const courseId = localStorage.getItem("course_edit_course_id");
    if (!courseId) {
      console.warn("No course ID found, skipping backend update");
      return;
    }

    try {
      await updateCourseModuleIds(courseId, moduleIds);
    } catch (error) {
      console.error("Failed to update course moduleIds in backend:", error);
      // Don't throw error - this is not critical for module operations
    }
  };

  // Clear localStorage (for testing/debugging)
  const clearModulesFromStorage = () => {
    clearCourseCreationStorage();
    setSavedLessons(new Set());
    setSavedContent(new Set());
    setCourse((prev) => ({
      ...prev,
      modules: [],
      moduleIds: [],
    }));
  };

  // Validation checks - More lenient for navigation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    // Allow navigation even without modules - users can create courses without modules
    if (!course.modules || course.modules.length === 0) {
      return errors; // No blocking errors
    }

    // Only validate modules that have been started (have a title)
    course.modules.forEach(
      (courseModule: CourseModule, moduleIndex: number) => {
        if (!courseModule) {
          return; // Skip missing modules
        }

        // Only validate if module has been started
        if (courseModule.title && courseModule.title.trim() !== "") {
          // Check for critical missing data only
          if (
            !courseModule.description ||
            courseModule.description.trim() === ""
          ) {
            errors.push(`Module ${moduleIndex + 1}: Description is required`);
          }

          if (
            !courseModule.thumbnailUrl ||
            courseModule.thumbnailUrl.trim() === ""
          ) {
            errors.push(`Module ${moduleIndex + 1}: Thumbnail is required`);
          }
        }

        // Only validate lessons if they exist and have been started
        if (courseModule.lessons && courseModule.lessons.length > 0) {
          courseModule.lessons.forEach(
            (lesson: CourseLesson, lessonIndex: number) => {
              if (!lesson) {
                return; // Skip missing lessons
              }

              // Only validate if lesson has been started
              if (lesson.title && lesson.title.trim() !== "") {
                if (!lesson.description || lesson.description.trim() === "") {
                  errors.push(
                    `Module ${moduleIndex + 1}, Lesson ${
                      lessonIndex + 1
                    }: Description is required`
                  );
                }
              }

              // Only validate content if it exists and has been started
              if (lesson.contents && lesson.contents.length > 0) {
                lesson.contents.forEach(
                  (content: Content, contentIndex: number) => {
                    if (!content) {
                      return; // Skip missing content
                    }

                    // Only validate if content has been started
                    if (content.title && content.title.trim() !== "") {
                      if (
                        !content.description ||
                        content.description.trim() === ""
                      ) {
                        errors.push(
                          `Module ${moduleIndex + 1}, Lesson ${
                            lessonIndex + 1
                          }, Content ${
                            contentIndex + 1
                          }: Description is required`
                        );
                      }

                      if (content.type === "video") {
                        const videoContent = content as VideoContent;
                        if (
                          !videoContent.sources ||
                          !videoContent.sources[0]?.videoUrl ||
                          videoContent.sources[0].videoUrl.trim() === ""
                        ) {
                          errors.push(
                            `Module ${moduleIndex + 1}, Lesson ${
                              lessonIndex + 1
                            }, Content ${
                              contentIndex + 1
                            }: Video URL is required`
                          );
                        }
                        if (
                          !videoContent.thumbnailUrl ||
                          videoContent.thumbnailUrl.trim() === ""
                        ) {
                          errors.push(
                            `Module ${moduleIndex + 1}, Lesson ${
                              lessonIndex + 1
                            }, Content ${
                              contentIndex + 1
                            }: Video thumbnail is required`
                          );
                        }
                      }

                      if (content.type === "quiz") {
                        const quizContent = content as QuizContent;
                        if (
                          !quizContent.questions ||
                          quizContent.questions.length === 0
                        ) {
                          errors.push(
                            `Module ${moduleIndex + 1}, Lesson ${
                              lessonIndex + 1
                            }, Content ${
                              contentIndex + 1
                            }: At least one question is required for quiz`
                          );
                        }
                      }
                    }
                  }
                );
              }
            }
          );
        }
      }
    );

    return errors;
  }, [course]);

  // Module operations
  const addModule = () => {
    const newModule: CourseModule = {
      _id: generateId(),
      title: "",
      description: "",
      lessonIds: [],
      lessons: [],
      thumbnailUrl: "",
      thumbnailSource: undefined,
      thumbnailS3Key: undefined,
      isActive: true,
      isCompleted: false,
    };

    setCourse((prev) => ({
      ...prev,
      modules: [...prev.modules, newModule],
      // Don't add temp ID to moduleIds - only add when module is saved
    }));

    const newIndex = course.modules.length;
    setExpandedModules((prev) => new Set([...prev, newIndex]));

    toast.success("Module created successfully!");
  };

  const updateModuleData = (
    moduleId: string,
    updates: Partial<CourseModule>
  ) => {

    const updatedModules = course.modules.map((currentModule: CourseModule) => {
      if (currentModule._id === moduleId) {
        const updated = { ...currentModule, ...updates };
        return updated;
      }
      return currentModule;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));
  };

  const removeModule = async (index: number) => {
    const courseModule = course.modules[index];
    if (!courseModule) return;

    const courseId = localStorage.getItem("course_edit_course_id");
    if (!courseId) {
      setSaveError("Course ID not found. Please edit a course first.");
      return;
    }

    // Check if this is a saved module (has real ID) or just a temp module
    const isSavedModule =
      courseModule._id && !courseModule._id.startsWith("temp_");

    if (isSavedModule) {
      // If it's a saved module, delete from backend first
      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await deleteModuleApi(courseId, courseModule._id!);

        if (!response.success) {
          throw new Error(response.message || "Failed to delete module");
        }

      } catch (error) {
        console.error("Error deleting module from backend:", error);
        setSaveError(
          error instanceof Error
            ? error.message
            : "Failed to delete module from backend"
        );
        setIsSaving(false);
        return; // Don't remove from UI if backend deletion failed
      } finally {
        setIsSaving(false);
      }
    }

    // Collect all lesson and content IDs from the module being deleted
    const lessonsToRemove = new Set<string>();
    const contentToRemove = new Set<string>();

    if (courseModule.lessons && Array.isArray(courseModule.lessons)) {
      courseModule.lessons.forEach((lesson: any) => {
        if (lesson._id && !lesson._id.startsWith("temp_")) {
          lessonsToRemove.add(lesson._id);
        }

        // Collect content IDs from this lesson
        if (lesson.contents && Array.isArray(lesson.contents)) {
          lesson.contents.forEach((content: any) => {
            if (content._id && !content._id.startsWith("temp_")) {
              contentToRemove.add(content._id);
            }
          });
        }

        // Also check contentIds array for backward compatibility
        if (lesson.contentIds && Array.isArray(lesson.contentIds)) {
          lesson.contentIds.forEach((content: any) => {
            if (
              typeof content === "object" &&
              content._id &&
              !content._id.startsWith("temp_")
            ) {
              contentToRemove.add(content._id);
            } else if (
              typeof content === "string" &&
              !content.startsWith("temp_")
            ) {
              contentToRemove.add(content);
            }
          });
        }
      });
    }

    // Remove from UI state
    const updatedModules = course.modules.filter(
      (_: CourseModule, i: number) => i !== index
    );

    // Remove module ID from moduleIds array
    let updatedModuleIds = [...course.moduleIds];
    if (courseModule._id && !courseModule._id.startsWith("temp_")) {
      updatedModuleIds = updatedModuleIds.filter(
        (id) => id !== courseModule._id
      );
    }

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
      moduleIds: updatedModuleIds,
    }));

    // Update course moduleIds in backend
    await updateCourseModuleIdsInBackend(updatedModuleIds);

    // Update saved and expanded states
    setSavedModules((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });

    // Remove all lessons from savedLessons set
    setSavedLessons((prev) => {
      const newSet = new Set(prev);
      lessonsToRemove.forEach((lessonId) => newSet.delete(lessonId));
      return newSet;
    });

    // Remove all content from savedContent set
    setSavedContent((prev) => {
      const newSet = new Set(prev);
      contentToRemove.forEach((contentId) => newSet.delete(contentId));
      return newSet;
    });

    // Remove all lessons from expandedLessons set
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      lessonsToRemove.forEach((lessonId) => newSet.delete(lessonId));
      return newSet;
    });

    // Remove all content from expandedContent set
    setExpandedContent((prev) => {
      const newSet = new Set(prev);
      contentToRemove.forEach((contentId) => newSet.delete(contentId));
      return newSet;
    });

    // Remove from localStorage
    if (courseModule._id && !courseModule._id.startsWith("temp_")) {
      removeModuleFromStorage(courseModule._id);
    }

    // Remove all lessons from localStorage
    lessonsToRemove.forEach((lessonId) => {
      removeLessonFromStorage(lessonId);
    });

    // Remove all content from localStorage
    contentToRemove.forEach((contentId) => {
      removeContentFromStorage(contentId);
    });

    // Sync the updated course data to course_edit_draft
    syncModulesToCourseDraft();


    toast.success("Module deleted successfully!");
  };

  const saveModule = async (index: number) => {
    const courseModule = course.modules[index];
    if (!courseModule) return;

    const courseId = localStorage.getItem("course_edit_course_id");
    if (!courseId) {
      setSaveError("Course ID not found. Please edit a course first.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Prepare module data for API
      const moduleData = {
        title: courseModule.title,
        description: courseModule.description,
        thumbnailUrl: courseModule.thumbnailUrl,
        thumbnailSource: courseModule.thumbnailSource,
        isActive: courseModule.isActive,
        isCompleted: courseModule.isCompleted,
        lessons: courseModule.lessons || [],
      };

      // Check if this is a new module (temp ID) or updating existing
      const isNewModule = courseModule._id?.startsWith("temp_");

      let response;
      if (isNewModule) {
        // Create new module
        response = await saveModuleApi(courseId, moduleData);
      } else {
        // Update existing module using the real ID
        response = await updateModule(courseId, courseModule._id!, moduleData);
      }

      // Response is now directly the module data (mutated)
      const updatedModule = response;

      // Update the module with the backend response
      const updatedModules = course.modules.map(
        (module: CourseModule, i: number) => {
          if (i === index) {
            if (isNewModule) {
              // For new modules, replace temp ID with real ID
              return {
                ...module,
                _id: updatedModule._id,
                ...updatedModule,
              };
            } else {
              // For existing modules, just update with the latest data
              return {
                ...module,
                ...updatedModule,
              };
            }
          }
          return module;
        }
      );

      // Update moduleIds array
      const updatedModuleIds = [...course.moduleIds];
      if (isNewModule && updatedModule._id) {
        // Add new module ID if not already present
        if (!updatedModuleIds.includes(updatedModule._id)) {
          updatedModuleIds.push(updatedModule._id);
        }
      }

      setCourse((prev) => ({
        ...prev,
        modules: updatedModules,
        moduleIds: updatedModuleIds,
      }));

      // Update course moduleIds in backend
      await updateCourseModuleIdsInBackend(updatedModuleIds);

      // Update localStorage if it was a new module (ID replacement)
      if (isNewModule && courseModule._id && updatedModule._id) {
        updateModuleIdInStorage(courseModule._id, updatedModule._id);
      }

      // No need to save to separate storage - everything is in course_edit_draft

      // Mark as saved
      setSavedModules((prev) => new Set([...prev, index]));
      setExpandedModules((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });


      toast.success(
        isNewModule
          ? "Module saved successfully!"
          : "Module updated successfully!"
      );
    } catch (error) {
      console.error("Error saving module:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save module";
      setSaveError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Lesson operations
  const addLesson = (moduleIndex: number) => {
    const courseModule = course.modules[moduleIndex];
    if (!courseModule) return;

    const newLesson: CourseLesson = {
      _id: generateId(),
      title: "",
      description: "",
      contentIds: [],
      contents: [],
    };

    const updatedModules = course.modules.map(
      (currentModule: CourseModule, index: number) => {
        if (index === moduleIndex) {
          return {
            ...currentModule,
            lessons: [...(currentModule.lessons || []), newLesson],
          } as CourseModule;
        }
        return module;
      }
    );

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // Don't add temp ID to lessonIds - only add when lesson is saved
    // updateModuleFromLessonChange(newLesson._id!, "add");

    setExpandedLessons((prev) => new Set([...prev, newLesson._id!]));

    toast.success("Lesson created successfully!");
  };

  // Remove lesson
  const removeLesson = async (lessonId: string) => {
    const courseId = localStorage.getItem("course_edit_course_id");
    if (!courseId) {
      setLessonSaveError("Course ID not found. Please edit a course first.");
      return;
    }

    // Find the lesson and its module
    let targetLesson: CourseLesson | null = null;
    let moduleId: string | null = null;
    let moduleIndex: number = -1;
    let lessonIndex: number = -1;

    for (let i = 0; i < course.modules.length; i++) {
      const currentModule = course.modules[i];
      if (currentModule.lessons && Array.isArray(currentModule.lessons)) {
        for (let j = 0; j < currentModule.lessons.length; j++) {
          const lesson = currentModule.lessons[j];
          if (lesson._id === lessonId) {
            targetLesson = lesson;
            moduleId = currentModule._id!;
            moduleIndex = i;
            lessonIndex = j;
            break;
          }
        }
        if (targetLesson) break;
      }
    }

    if (!targetLesson || !moduleId || moduleIndex === -1) {
      setLessonSaveError("Lesson not found.");
      return;
    }


    // Check if this is a saved lesson (has real ID) or just a temp lesson
    const isSavedLesson =
      targetLesson._id && !targetLesson._id.startsWith("temp_");

    if (isSavedLesson) {
      // If it's a saved lesson, delete from backend first
      setIsSavingLesson(true);
      setLessonSaveError(null);

      try {
        await deleteLessonApi(
          courseId,
          moduleId,
          targetLesson._id!
        );

      } catch (error) {
        console.error("Error deleting lesson from backend:", error);
        setLessonSaveError(
          error instanceof Error
            ? error.message
            : "Failed to delete lesson from backend"
        );
        setIsSavingLesson(false);
        return; // Don't remove from UI if backend deletion failed
      } finally {
        setIsSavingLesson(false);
      }
    }

    // Remove from UI state
    const updatedModules = course.modules.map(
      (currentModule: CourseModule, i: number) => {
        if (i === moduleIndex) {
          // Remove lesson from lessons array
          const updatedLessons =
            currentModule.lessons?.filter(
              (_: CourseLesson, idx: number) => idx !== lessonIndex
            ) || [];

          // Remove lesson ID from lessonIds array
          const updatedLessonIds =
            currentModule.lessonIds?.filter(
              (lessonId: string | undefined) => lessonId !== targetLesson._id
            ) || [];


          return {
            ...currentModule,
            lessons: updatedLessons,
            lessonIds: updatedLessonIds,
          } as CourseModule;
        }
        return currentModule;
      }
    );


    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // Remove from saved lessons
    setSavedLessons((prev) => {
      const newSet = new Set(prev);
      newSet.delete(lessonId);
      return newSet;
    });

    // Remove from expanded lessons
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      newSet.delete(lessonId);
      return newSet;
    });

    // Remove from localStorage
    if (targetLesson._id && !targetLesson._id.startsWith("temp_")) {
      removeLessonFromStorage(targetLesson._id);
    }

    // Sync the updated course data to course_edit_draft
    syncModulesToCourseDraft();


    toast.success("Lesson deleted successfully!");
  };

  // Save lesson to backend
  const saveLesson = async (lessonId: string) => {
    const courseId = localStorage.getItem("course_edit_course_id");
    if (!courseId) {
      setLessonSaveError("Course ID not found. Please edit a course first.");
      return;
    }

    // Find the lesson and its module
    let targetLesson: CourseLesson | null = null;
    let moduleId: string | null = null;
    let moduleIndex: number = -1;

    for (let i = 0; i < course.modules.length; i++) {
      const currentModule = course.modules[i];
      const lesson = currentModule.lessons?.find(
        (l: CourseLesson) => l._id === lessonId
      );
      if (lesson) {
        targetLesson = lesson;
        moduleId = currentModule._id!;
        moduleIndex = i;
        break;
      }
    }

    if (!targetLesson || !moduleId) {
      setLessonSaveError("Lesson not found.");
      return;
    }

    setIsSavingLesson(true);
    setLessonSaveError(null);

    try {
      const lessonData = {
        title: targetLesson.title,
        description: targetLesson.description,
        contentIds: (targetLesson.contentIds || []).filter(
          (id): id is string => id !== undefined
        ),
      };

      const isNewLesson = targetLesson._id?.startsWith("temp_");


      let response;
      if (isNewLesson) {
        response = await saveLessonApi(courseId, moduleId, lessonData);

        // Add a small delay to ensure the backend has processed the creation
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        response = await updateLesson(
          courseId,
          moduleId,
          targetLesson._id!,
          lessonData
        );
      }

      // Update the lesson with the backend response
      const updatedLesson = response;

      // For new lessons, we need to update the lesson ID in the module
      const updatedModules = course.modules.map(
        (currentModule: CourseModule, i: number) => {
          if (i === moduleIndex) {
            const updatedLessons =
              currentModule.lessons?.map((lesson: CourseLesson) => {
                if (lesson._id === lessonId) {
                  if (isNewLesson) {
                    // For new lessons, replace the temp ID with the real ID
                    const newLesson = {
                      ...lesson,
                      _id: updatedLesson._id,
                      ...updatedLesson,
                    };
                    return newLesson;
                  } else {
                    // For existing lessons, just update the data
                    return {
                      ...lesson,
                      ...updatedLesson,
                    };
                  }
                }
                return lesson;
              }) || [];

            return {
              ...currentModule,
              lessons: updatedLessons,
            } as CourseModule;
          }
          return currentModule;
        }
      );

      setCourse((prev) => ({
        ...prev,
        modules: updatedModules,
      }));

      // Update localStorage if it was a new lesson (ID replacement)
      if (isNewLesson && targetLesson._id && updatedLesson._id) {
        updateLessonIdInStorage(targetLesson._id, updatedLesson._id);
      }

      // No need to save to separate lesson storage - everything is in course_edit_draft

      // Update module's lessonIds array for data consistency
      const realLessonId = updatedLesson._id || lessonId;
      updateModuleFromLessonChangeByIndex(
        moduleIndex,
        realLessonId,
        isNewLesson ? "add" : "update"
      );

      // Mark as saved - use the real ID from the response
      setSavedLessons((prev) => new Set([...prev, realLessonId]));


      toast.success(
        isNewLesson
          ? "Lesson saved successfully!"
          : "Lesson updated successfully!"
      );
    } catch (error) {
      console.error("Error saving lesson:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save lesson";
      setLessonSaveError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSavingLesson(false);
    }
  };

  const updateLessonData = (
    lessonId: string,
    updates: Partial<CourseLesson>
  ) => {
    const moduleId = findModuleIdByLessonId(lessonId);
    if (!moduleId) return;

    const updatedModules = course.modules.map((currentModule: CourseModule) => {
      if (currentModule._id === moduleId) {
        return {
          ...currentModule,
          lessons:
            currentModule.lessons?.map((lesson: CourseLesson) => {
              if (lesson._id === lessonId) {
                return { ...lesson, ...updates } as CourseLesson;
              }
              return lesson;
            }) || [],
        } as CourseModule;
      }
      return currentModule;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));
  };

  const findModuleIdByLessonId = (lessonId: string): string | undefined => {
    for (const courseModule of course.modules) {
      if (
        courseModule.lessons?.some(
          (lesson: CourseLesson) => lesson._id === lessonId
        )
      ) {
        return courseModule._id;
      }
    }
    return undefined;
  };

  // Content operations
  const addContent = (lessonId: string, type: "video" | "quiz") => {
    const contentCount =
      course.modules
        .flatMap((m: CourseModule) => m.lessons || [])
        .flatMap((l: CourseLesson) => l.contents || [])
        .filter((c: Content) => c.type === type).length + 1;

    const defaultTitle =
      type === "video"
        ? `Video Content ${contentCount}`
        : `Quiz ${contentCount}`;

    const newContent: Content =
      type === "video"
        ? {
            _id: generateId(),
            title: defaultTitle,
            description: "",
            type: "video",
            sources: [{ quality: "1080p" as const, videoUrl: "" }],
            thumbnailUrl: "",
            duration: 0,
            readingMaterials: [],
            isCompleted: false,
          }
        : {
            _id: generateId(),
            title: defaultTitle,
            description: "",
            type: "quiz",
            questions: [],
            passingScore: 70,
            maxAttempts: 3,
            readingMaterials: [],
            isCompleted: false,
          };

    const moduleId = findModuleIdByLessonId(lessonId);
    if (!moduleId) return;

    const updatedModules = course.modules.map((currentModule: CourseModule) => {
      if (currentModule._id === moduleId) {
        return {
          ...currentModule,
          lessons:
            currentModule.lessons?.map((lesson: CourseLesson) => {
              if (lesson._id === lessonId) {
                return {
                  ...lesson,
                  contents: [...(lesson.contents || []), newContent],
                } as CourseLesson;
              }
              return lesson;
            }) || [],
        } as CourseModule;
      }
      return currentModule;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // Update lesson's contentIds array for data consistency
    updateLessonFromContentChange(newContent._id!, "add");

    setExpandedContent((prev) => new Set([...prev, newContent._id!]));

    toast.success(
      `${type === "video" ? "Video" : "Quiz"} content created successfully!`
    );
  };

  // Save content to backend
  const saveContent = async (contentId: string) => {
    const courseId = localStorage.getItem("course_edit_course_id");
    if (!courseId) {
      setContentSaveError("Course ID not found. Please edit a course first.");
      return;
    }

    // Find the content and its lesson/module
    let targetContent: Content | null = null;
    let moduleId: string | null = null;
    let lessonId: string | null = null;
    let moduleIndex: number = -1;
    let lessonIndex: number = -1;
    let contentIndex: number = -1;

    for (let i = 0; i < course.modules.length; i++) {
      const currentModule = course.modules[i];
      for (let j = 0; j < (currentModule.lessons || []).length; j++) {
        const lesson = currentModule.lessons![j];
        const content = lesson.contents?.find((c: Content, idx: number) => {
          if (c._id === contentId) {
            contentIndex = idx;
            return true;
          }
          return false;
        });
        if (content) {
          targetContent = content;
          moduleId = currentModule._id!;
          lessonId = lesson._id!;
          moduleIndex = i;
          lessonIndex = j;
          break;
        }
      }
      if (targetContent) break;
    }

    if (!targetContent || !moduleId || !lessonId || moduleIndex === -1) {
      setContentSaveError("Content not found.");
      return;
    }

    setIsSavingContent(true);
    setContentSaveError(null);

    try {
      const contentData = {
        title: targetContent.title,
        description: targetContent.description,
        type: targetContent.type,
        ...(targetContent.type === "video" && {
          sources: targetContent.sources || [],
          thumbnailUrl: targetContent.thumbnailUrl,
          duration: targetContent.duration,
        }),
        ...(targetContent.type === "quiz" && {
          questions: targetContent.questions || [],
          passingScore: targetContent.passingScore,
          maxAttempts: targetContent.maxAttempts,
        }),
        readingMaterials: targetContent.readingMaterials || [],
      };

      const isNewContent = targetContent._id?.startsWith("temp_");


      let response;
      if (isNewContent) {
        response = await saveContentApi(
          courseId,
          moduleId,
          lessonId,
          contentData
        );

        // Add a small delay to ensure the backend has processed the creation
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        response = await updateContent(
          courseId,
          moduleId,
          lessonId,
          targetContent._id!,
          contentData
        );
      }

      // Update the content with the backend response
      const updatedContent = response;

      // For new content, we need to update the content ID in the lesson
      const updatedModules = course.modules.map(
        (currentModule: CourseModule, i: number) => {
          if (i === moduleIndex) {
            return {
              ...currentModule,
              lessons:
                currentModule.lessons?.map((lesson: CourseLesson, j: number) => {
                  if (j === lessonIndex) {
                    return {
                      ...lesson,
                      contents:
                        lesson.contents?.map((content: Content, k: number) => {
                          if (k === contentIndex) {
                            if (isNewContent) {
                              // For new content, replace the temp ID with the real ID
                              const newContent = {
                                ...content,
                                _id: updatedContent._id,
                                ...updatedContent,
                              };
                              return newContent;
                            } else {
                              // For existing content, just update the data
                              return {
                                ...content,
                                ...updatedContent,
                              };
                            }
                          }
                          return content;
                        }) || [],
                    } as CourseLesson;
                  }
                  return lesson;
                }) || [],
            } as CourseModule;
          }
          return currentModule;
        }
      );

      setCourse((prev) => ({
        ...prev,
        modules: updatedModules,
      }));

      // Update localStorage if it was a new content (ID replacement)
      if (isNewContent && targetContent._id && updatedContent._id) {
        updateContentIdInStorage(targetContent._id, updatedContent._id);
      }

      // No need to save to separate content storage - everything is in course_edit_draft

      // Update lesson's contentIds array for data consistency
      const realContentId = updatedContent._id || contentId;
      updateLessonFromContentChange(
        realContentId,
        isNewContent ? "add" : "update"
      );

      // Mark as saved - use the real ID from the response
      setSavedContent((prev) => new Set([...prev, realContentId]));


      toast.success(
        isNewContent
          ? "Content saved successfully!"
          : "Content updated successfully!"
      );
    } catch (error) {
      console.error("Error saving content:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save content";
      setContentSaveError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSavingContent(false);
    }
  };

  const updateContentData = (contentId: string, updates: Partial<Content>) => {
    const location = findContentLocation(contentId);
    if (!location) return;

    const { moduleId, lessonId } = location;
    const updatedModules = course.modules.map((currentModule: CourseModule) => {
      if (currentModule._id === moduleId) {
        return {
          ...currentModule,
          lessons:
            currentModule.lessons?.map((lesson: CourseLesson) => {
              if (lesson._id === lessonId) {
                return {
                  ...lesson,
                  contents:
                    lesson.contents?.map((content: Content) => {
                      if (content._id === contentId) {
                        return { ...content, ...updates } as Content;
                      }
                      return content;
                    }) || [],
                } as CourseLesson;
              }
              return lesson;
            }) || [],
        } as CourseModule;
      }
      return currentModule;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));
  };

  // Remove content
  const removeContent = async (contentId: string) => {
    const courseId = localStorage.getItem("course_edit_course_id");
    if (!courseId) {
      setContentSaveError("Course ID not found. Please edit a course first.");
      return;
    }

    // Find the content and its lesson/module
    let targetContent: Content | null = null;
    let moduleId: string | null = null;
    let lessonId: string | null = null;
    let moduleIndex: number = -1;
    let lessonIndex: number = -1;
    let contentIndex: number = -1;

    for (let i = 0; i < course.modules.length; i++) {
      const currentModule = course.modules[i];
      for (let j = 0; j < (currentModule.lessons || []).length; j++) {
        const lesson = currentModule.lessons![j];
        const content = lesson.contents?.find((c: Content, idx: number) => {
          if (c._id === contentId) {
            contentIndex = idx;
            return true;
          }
          return false;
        });
        if (content) {
          targetContent = content;
          moduleId = currentModule._id!;
          lessonId = lesson._id!;
          moduleIndex = i;
          lessonIndex = j;
          break;
        }
      }
      if (targetContent) break;
    }

    if (!targetContent || !moduleId || !lessonId || moduleIndex === -1) {
      setContentSaveError("Content not found.");
      return;
    }

    // Check if this is a saved content (has real ID) or just a temp content
    const isSavedContent =
      targetContent._id && !targetContent._id.startsWith("temp_");

    if (isSavedContent) {
      // If it's a saved content, delete from backend first
      setIsSavingContent(true);
      setContentSaveError(null);

      try {
        await deleteContentApi(
          courseId,
          moduleId,
          lessonId,
          targetContent._id!
        );

      } catch (error) {
        console.error("Error deleting content from backend:", error);
        setContentSaveError(
          error instanceof Error
            ? error.message
            : "Failed to delete content from backend"
        );
        setIsSavingContent(false);
        return; // Don't remove from UI if backend deletion failed
      } finally {
        setIsSavingContent(false);
      }
    }

    // Remove from UI state
    const updatedModules = course.modules.map(
      (currentModule: CourseModule, i: number) => {
        if (i === moduleIndex) {
          return {
            ...currentModule,
            lessons:
              currentModule.lessons?.map((lesson: CourseLesson, j: number) => {
                if (j === lessonIndex) {
                  // Remove content from contents array
                  const updatedContents =
                    lesson.contents?.filter(
                      (_: Content, idx: number) => idx !== contentIndex
                    ) || [];

                  // Remove content ID from contentIds array
                  const updatedContentIds =
                    lesson.contentIds?.filter(
                      (contentId: string | undefined) =>
                        contentId !== targetContent._id
                    ) || [];


                  return {
                    ...lesson,
                    contents: updatedContents,
                    contentIds: updatedContentIds,
                  } as CourseLesson;
                }
                return lesson;
              }) || [],
          } as CourseModule;
        }
        return currentModule;
      }
    );

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // Remove from saved content
    setSavedContent((prev) => {
      const newSet = new Set(prev);
      newSet.delete(contentId);
      return newSet;
    });

    // Remove from expanded content
    setExpandedContent((prev) => {
      const newSet = new Set(prev);
      newSet.delete(contentId);
      return newSet;
    });

    // Remove from localStorage
    if (targetContent._id && !targetContent._id.startsWith("temp_")) {
      removeContentFromStorage(targetContent._id);
    }

    // Sync the updated course data to course_edit_draft
    syncModulesToCourseDraft();


    toast.success("Content deleted successfully!");
  };

  const deleteContentData = (contentId: string) => {
    const location = findContentLocation(contentId);
    if (!location) return;

    const { moduleId, lessonId } = location;
    const updatedModules = course.modules.map((currentModule: CourseModule) => {
      if (currentModule._id === moduleId) {
        return {
          ...currentModule,
          lessons:
            currentModule.lessons?.map((lesson: CourseLesson) => {
              if (lesson._id === lessonId) {
                return {
                  ...lesson,
                  contents:
                    lesson.contents?.filter(
                      (content: Content) => content._id !== contentId
                    ) || [],
                } as CourseLesson;
              }
              return lesson;
            }) || [],
        } as CourseModule;
      }
      return currentModule;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));
  };

  const findContentLocation = (
    contentId: string
  ): { moduleId: string; lessonId: string } | undefined => {
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons || []) {
        if (
          lesson.contents?.some((content: Content) => content._id === contentId)
        ) {
          return { moduleId: courseModule._id!, lessonId: lesson._id! };
        }
      }
    }
    return undefined;
  };

  // Upload operations
  const handleThumbnailUpload = async (
    moduleId: string,
    file: File,
    folderName: string
  ): Promise<string> => {
    try {
      setIsUploading(true);
      setSaveError(null);


      // Use presigned URL upload for better performance and reliability
      const uploadResult = await uploadWithPresignedUrl(file, folderName);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload failed");
      }

      const { url, s3Key } = uploadResult.data!;

      updateModuleData(moduleId, {
        thumbnailUrl: url,
        thumbnailSource: "upload",
        thumbnailS3Key: s3Key, // Store S3 key for future operations
      });

      setIsUploading(false);
      return url;
    } catch (error) {
      console.error("Thumbnail upload failed:", error);
      setSaveError(error instanceof Error ? error.message : "Upload failed");
      setIsUploading(false);
      throw error;
    }
  };

  const handleThumbnailUrlSubmit = (moduleId: string, url: string) => {
    updateModuleData(moduleId, {
      thumbnailUrl: url,
      thumbnailSource: "url",
    });
  };

  const handleThumbnailRemove = async (moduleId: string) => {
    const currentModule = course.modules.find((m: CourseModule) => m._id === moduleId);

    // If it's an uploaded file, delete from S3
    if (currentModule?.thumbnailS3Key && currentModule.thumbnailSource === "upload") {
      try {
        // Note: The deleteFile function from useUpload would be used here
        // For now, we'll just log it since we don't have the deleteFile function available
        // await deleteFile(currentModule.thumbnailS3Key);
      } catch (error) {
        console.error("Failed to delete thumbnail from S3:", error);
        // Continue with local removal even if S3 deletion fails
      }
    }

    updateModuleData(moduleId, {
      thumbnailUrl: "",
      thumbnailSource: undefined,
      thumbnailS3Key: undefined,
    });
  };

  // Content upload handlers
  const handleVideoUpload = async (
    contentId: string,
    file: File,
    folderName: string
  ): Promise<string> => {
    try {
      setIsUploading(true);
      setSaveError(null);

      // Extract video duration first
      const duration = await getVideoDuration(file);

      // Use presigned URL upload for better performance and reliability
      const uploadResult = await uploadWithPresignedUrl(file, folderName);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload failed");
      }

      const { url, s3Key } = uploadResult.data!;

      // Find the content and update it
      const contentLocation = findContentLocation(contentId);
      if (!contentLocation) {
        throw new Error("Content not found");
      }

      // Content location found, proceed with update

      // Update the content with the new video URL and duration
      updateContentData(contentId, {
        sources: [
          {
            quality: "1080p",
            videoUrl: url,
          },
        ],
        videoS3Key: s3Key, // Store S3 key for future operations
        videoSource: "upload",
        duration: duration, // Set the extracted duration
      });

      setIsUploading(false);
      return url;
    } catch (error) {
      console.error("Video upload failed:", error);
      setSaveError(error instanceof Error ? error.message : "Upload failed");
      setIsUploading(false);
      throw error;
    }
  };

  const handleVideoUrlSubmit = (contentId: string, url: string) => {
    updateContentData(contentId, {
      sources: [
        {
          quality: "1080p",
          videoUrl: url,
        },
      ],
      videoSource: "url",
    });
  };

  const handleVideoRemove = async (contentId: string) => {
    const contentLocation = findContentLocation(contentId);
    if (!contentLocation) return;

    // Find the content to get S3 key
    let contentS3Key: string | undefined;
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons || []) {
        const content = lesson.contents?.find(
          (c: Content) => c._id === contentId
        );
        if (content && (content as any).videoS3Key) {
          contentS3Key = (content as any).videoS3Key;
          break;
        }
      }
    }

    // If it's an uploaded file, delete from S3
    if (contentS3Key) {
      try {
        // Note: The deleteFile function from useUpload would be used here
        // await deleteFile(contentS3Key);
      } catch (error) {
        console.error("Failed to delete video from S3:", error);
      }
    }

    updateContentData(contentId, {
      sources: [],
      videoS3Key: undefined,
      videoSource: undefined,
    });
  };

  const handleContentThumbnailUpload = async (
    contentId: string,
    file: File,
    folderName: string
  ): Promise<string> => {
    try {
      setIsUploading(true);
      setSaveError(null);


      // Use presigned URL upload for better performance and reliability
      const uploadResult = await uploadWithPresignedUrl(file, folderName);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload failed");
      }

      const { url, s3Key } = uploadResult.data!;

      // Update the content with the new thumbnail URL
      updateContentData(contentId, {
        thumbnailUrl: url,
        thumbnailS3Key: s3Key, // Store S3 key for future operations
        thumbnailSource: "upload",
      });

      setIsUploading(false);
      return url;
    } catch (error) {
      console.error("Content thumbnail upload failed:", error);
      setSaveError(error instanceof Error ? error.message : "Upload failed");
      setIsUploading(false);
      throw error;
    }
  };

  const handleContentThumbnailUrlSubmit = (contentId: string, url: string) => {
    updateContentData(contentId, {
      thumbnailUrl: url,
      thumbnailSource: "url",
    });
  };

  const handleContentThumbnailRemove = async (contentId: string) => {
    // Find the content to get S3 key
    let contentS3Key: string | undefined;
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons || []) {
        const content = lesson.contents?.find(
          (c: Content) => c._id === contentId
        );
        if (content && (content as any).thumbnailS3Key) {
          contentS3Key = (content as any).thumbnailS3Key;
          break;
        }
      }
    }

    // If it's an uploaded file, delete from S3
    if (contentS3Key) {
      try {
        // await deleteFile(contentS3Key);
      } catch (error) {
        console.error("Failed to delete content thumbnail from S3:", error);
      }
    }

    updateContentData(contentId, {
      thumbnailUrl: "",
      thumbnailS3Key: undefined,
      thumbnailSource: undefined,
    });
  };

  // Data consistency helper functions
  const updateModuleFromLessonChange = (
    lessonId: string,
    operation: "add" | "remove" | "update"
  ) => {
    // Find which module contains this lesson
    let targetModuleIndex = -1;
    let targetModule: CourseModule | null = null;

    for (let i = 0; i < course.modules.length; i++) {
      const currentModule = course.modules[i];
      if (
        currentModule.lessons?.some((lesson: CourseLesson) => lesson._id === lessonId)
      ) {
        targetModuleIndex = i;
        targetModule = currentModule;
        break;
      }
    }

    if (targetModuleIndex === -1 || !targetModule) {
      console.warn(`Module not found for lesson ${lessonId}`);
      return;
    }

    // Update lessonIds array based on operation
    let updatedLessonIds = [...(targetModule.lessonIds || [])];

    if (operation === "add") {
      // Add lesson ID if not already present
      if (!updatedLessonIds.includes(lessonId)) {
        updatedLessonIds.push(lessonId);
      }
    } else if (operation === "remove") {
      // Remove lesson ID
      updatedLessonIds = updatedLessonIds.filter((id) => id !== lessonId);
    }
    // For 'update', we don't need to change the lessonIds array

    // Update the module with new lessonIds
    const updatedModules = course.modules.map(
      (currentModule: CourseModule, i: number) => {
        if (i === targetModuleIndex) {
          return {
            ...currentModule,
            lessonIds: updatedLessonIds,
            updatedAt: new Date(),
          };
        }
        return currentModule;
      }
    );

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // No need to update separate storage - everything is in course_edit_draft
  };

  // Data consistency helper function using module index
  const updateModuleFromLessonChangeByIndex = (
    moduleIndex: number,
    lessonId: string,
    operation: "add" | "remove" | "update"
  ) => {
    const targetModule = course.modules[moduleIndex];
    if (!targetModule) {
      console.warn(`Module at index ${moduleIndex} not found`);
      return;
    }

    // Update lessonIds array based on operation
    let updatedLessonIds = [...(targetModule.lessonIds || [])];

    if (operation === "add") {
      // Add lesson ID if not already present
      if (!updatedLessonIds.includes(lessonId)) {
        updatedLessonIds.push(lessonId);
      }
    } else if (operation === "remove") {
      // Remove lesson ID
      updatedLessonIds = updatedLessonIds.filter((id) => id !== lessonId);
    }
    // For 'update', we don't need to change the lessonIds array

    // Update the module with new lessonIds
    const updatedModules = course.modules.map(
      (currentModule: CourseModule, i: number) => {
        if (i === moduleIndex) {
          return {
            ...currentModule,
            lessonIds: updatedLessonIds,
            updatedAt: new Date(),
          };
        }
        return currentModule;
      }
    );

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // No need to update separate storage - everything is in course_edit_draft
  };

  const updateLessonFromContentChange = (
    contentId: string,
    operation: "add" | "remove" | "update"
  ) => {
    // Find which lesson contains this content
    let targetModuleIndex = -1;
    let targetLessonIndex = -1;
    let targetLesson: CourseLesson | null = null;

    for (let i = 0; i < course.modules.length; i++) {
      const currentModule = course.modules[i];
      for (let j = 0; j < (currentModule.lessons || []).length; j++) {
        const lesson = currentModule.lessons![j];
        if (
          lesson.contents?.some((content: Content) => content._id === contentId)
        ) {
          targetModuleIndex = i;
          targetLessonIndex = j;
          targetLesson = lesson;
          break;
        }
      }
      if (targetLesson) break;
    }

    if (targetModuleIndex === -1 || targetLessonIndex === -1 || !targetLesson) {
      console.warn(`Lesson not found for content ${contentId}`);
      return;
    }

    // Update contentIds array based on operation
    let updatedContentIds = [...(targetLesson.contentIds || [])];

    if (operation === "add") {
      // Add content ID if not already present
      if (!updatedContentIds.includes(contentId)) {
        updatedContentIds.push(contentId);
      }
    } else if (operation === "remove") {
      // Remove content ID
      updatedContentIds = updatedContentIds.filter((id) => id !== contentId);
    }
    // For 'update', we don't need to change the contentIds array

    // Update the lesson with new contentIds
    const updatedModules = course.modules.map(
      (currentModule: CourseModule, i: number) => {
        if (i === targetModuleIndex) {
          return {
            ...module,
            lessons:
              currentModule.lessons?.map((lesson: CourseLesson, j: number) => {
                if (j === targetLessonIndex) {
                  return {
                    ...lesson,
                    contentIds: updatedContentIds,
                    updatedAt: new Date(),
                  };
                }
                return lesson;
              }) || [],
          };
        }
        return currentModule;
      }
    );

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // No need to update separate storage - everything is in course_edit_draft
  };

  // Toggle functions
  const toggleModuleExpansion = (index: number) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleLessonExpansion = (lessonId: string) => {
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const toggleContentExpansion = (contentId: string) => {
    setExpandedContent((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contentId)) {
        newSet.delete(contentId);
      } else {
        newSet.add(contentId);
      }
      return newSet;
    });
  };

  // Helper functions
  const isModuleComplete = (courseModule: CourseModule): boolean => {
    return !!(
      courseModule.title &&
      courseModule.description &&
      courseModule.thumbnailUrl
    );
  };

  const isLessonComplete = (lesson: CourseLesson): boolean => {
    return !!lesson.title && !!lesson.description;
  };

  const isLessonSaved = (lessonId: string): boolean => {
    // A lesson is saved if:
    // 1. It has a real ID (not starting with "temp_")
    // 2. It exists in the savedLessons set
    const hasRealId = Boolean(lessonId && !lessonId.startsWith("temp_"));
    const isInSavedSet = savedLessons.has(lessonId);

    return hasRealId && isInSavedSet;
  };

  const isContentComplete = (content: Content): boolean => {
    if (content.type === "video") {
      return (
        !!content.title &&
        !!content.description &&
        (content.sources?.length || 0) > 0 &&
        content.sources?.every((source) => !!source.videoUrl)
      );
    } else if (content.type === "quiz") {
      return (
        !!content.title &&
        !!content.description &&
        (content.questions?.length || 0) > 0
      );
    }
    return false;
  };

  const isContentSaved = (contentId: string): boolean => {
    // Content is saved if:
    // 1. It has a real ID (not starting with "temp_")
    // 2. It exists in the savedContent set
    const hasRealId = Boolean(contentId && !contentId.startsWith("temp_"));
    const isInSavedSet = savedContent.has(contentId);

    return hasRealId && isInSavedSet;
  };

  return {
    // State
    course,
    savedModules,
    savedLessons,
    savedContent,
    expandedModules,
    expandedLessons,
    expandedContent,
    isUploading,
    isSaving,
    saveError,
    isSavingLesson,
    lessonSaveError,
    isSavingContent,
    contentSaveError,
    validationErrors,

    // Actions
    addModule,
    updateModuleData,
    removeModule,
    saveModule,
    addLesson,
    updateLessonData,
    saveLesson,
    removeLesson,
    addContent,
    updateContentData,
    saveContent,
    removeContent,
    deleteContentData,
    handleThumbnailUpload,
    handleThumbnailUrlSubmit,
    handleThumbnailRemove,
    handleVideoUpload,
    handleVideoUrlSubmit,
    handleVideoRemove,
    handleContentThumbnailUpload,
    handleContentThumbnailUrlSubmit,
    handleContentThumbnailRemove,
    toggleModuleExpansion,
    toggleLessonExpansion,
    toggleContentExpansion,
    isModuleComplete,
    isLessonComplete,
    isLessonSaved,
    isContentComplete,
    isContentSaved,

    // Data consistency helpers
    updateModuleFromLessonChange,
    updateModuleFromLessonChangeByIndex,
    updateLessonFromContentChange,

    // Debug utilities
    clearModulesFromStorage,
    updateCourseInStorage,

    // Module IDs for course finalization
    getModuleIds: () =>
      course.moduleIds.filter((id: string) => id && !id.startsWith("temp_")),
  };
};
