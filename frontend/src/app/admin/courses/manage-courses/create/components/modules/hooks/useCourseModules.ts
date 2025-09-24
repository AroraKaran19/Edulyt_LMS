import { useState, useMemo, useEffect } from "react";
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
  getCourseId,
  updateModuleIdInStorage,
  saveModuleToStorage,
  saveLessonToStorage,
  getLessonsFromStorage,
  updateLessonIdInStorage,
  saveContentToStorage,
  getContentFromStorage,
  updateContentIdInStorage,
  updateCourseModuleIds,
} from "../api/moduleApi";
import { useUpload } from "@/hooks/useUpload";
import { clearCourseCreationStorage } from "@/utils/courseStorage";

export const useCourseModules = () => {
  const [course, setCourse] = useState({
    _id: "",
    title: "",
    description: "",
    modules: [] as CourseModule[],
    moduleIds: [] as string[], // Track module IDs for course reference
  });

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
  const { uploadWithPresignedUrl } = useUpload();

  // Helper function to generate a unique ID
  const generateId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Load course data from localStorage on component mount
  const loadCourseDataFromStorage = () => {
    if (typeof window === "undefined") return;

    try {
      // Load course metadata
      const courseId = localStorage.getItem("current_course_id");
      const courseDraft = localStorage.getItem("course_creation_draft");
      
      if (courseDraft) {
        const courseData = JSON.parse(courseDraft);
        console.log("Loading course data from localStorage:", courseData);
        
        setCourse(prev => ({
          ...prev,
          _id: courseId || prev._id,
          title: courseData.title || prev.title,
          description: courseData.description || prev.description,
        }));
      }

      // Load modules
      const savedModules = localStorage.getItem("course_modules");
      if (savedModules) {
        const modules: CourseModule[] = JSON.parse(savedModules);
        console.log("Loading modules from localStorage:", modules);
        
        if (modules.length > 0) {
          // Extract module IDs for course reference
          const moduleIds = modules
            .filter(module => module._id && !module._id.startsWith("temp_"))
            .map(currentModule => currentModule._id!);
          
          setCourse(prev => ({
            ...prev,
            modules: modules,
            moduleIds: moduleIds
          }));

          // Mark all loaded modules as saved (they have real IDs, not temp IDs)
          const savedModuleIndices = new Set(
            modules
              .map((module, index) => module._id && !module._id.startsWith("temp_") ? index : -1)
              .filter(index => index !== -1)
          );
          setSavedModules(savedModuleIndices);
          
          console.log("Loaded saved module indices:", Array.from(savedModuleIndices));
          console.log("Loaded moduleIds:", moduleIds);
        }
      }

      // Load lessons
      const savedLessons = getLessonsFromStorage();
      if (savedLessons.length > 0) {
        console.log("Loading lessons from localStorage:", savedLessons);
        
        // Mark all loaded lessons as saved (they have real IDs, not temp IDs)
        const savedLessonIds = new Set(
          savedLessons
            .filter(lesson => lesson._id && !lesson._id.startsWith("temp_"))
            .map(lesson => lesson._id!)
        );
        setSavedLessons(savedLessonIds);
        
        console.log("Loaded saved lesson IDs:", Array.from(savedLessonIds));
      }

      // Load content
      const savedContent = getContentFromStorage();
      if (savedContent.length > 0) {
        console.log("Loading content from localStorage:", savedContent);
        
        // Mark all loaded content as saved (they have real IDs, not temp IDs)
        const savedContentIds = new Set(
          savedContent
            .filter(content => content._id && !content._id.startsWith("temp_"))
            .map(content => content._id!)
        );
        setSavedContent(savedContentIds);
        
        console.log("Loaded saved content IDs:", Array.from(savedContentIds));
      }
    } catch (error) {
      console.error("Error loading course data from localStorage:", error);
    }
  };

  // Load course data on component mount
  useEffect(() => {
    loadCourseDataFromStorage();
  }, []);

  // Update course data in localStorage
  const updateCourseInStorage = (courseData: Partial<typeof course>) => {
    if (typeof window === "undefined") return;

    try {
      const currentCourse = { ...course, ...courseData };
      localStorage.setItem("course_creation_draft", JSON.stringify(currentCourse));
      console.log("Updated course data in localStorage:", currentCourse);
    } catch (error) {
      console.error("Error updating course data in localStorage:", error);
    }
  };

  // Helper function to update course moduleIds in backend
  const updateCourseModuleIdsInBackend = async (moduleIds: string[]) => {
    const courseId = getCourseId();
    if (!courseId) {
      console.warn("No course ID found, skipping backend update");
      return;
    }

    try {
      console.log("Updating course moduleIds in backend:", moduleIds);
      await updateCourseModuleIds(courseId, moduleIds);
      console.log("Successfully updated course moduleIds in backend");
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
    setCourse(prev => ({
      ...prev,
      modules: [],
      moduleIds: []
    }));
    console.log("Cleared savedLessons, savedContent sets, and moduleIds");
  };

  // Validation checks - More lenient for navigation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    // Allow navigation even without modules - users can create courses without modules
    if (!course.modules || course.modules.length === 0) {
      return errors; // No blocking errors
    }

    // Only validate modules that have been started (have a title)
    course.modules.forEach((courseModule, moduleIndex) => {
      if (!courseModule) {
        return; // Skip missing modules
      }

      // Only validate if module has been started
      if (courseModule.title && courseModule.title.trim() !== "") {
        // Check for critical missing data only
        if (!courseModule.description || courseModule.description.trim() === "") {
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
        courseModule.lessons.forEach((lesson, lessonIndex) => {
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
            lesson.contents.forEach((content, contentIndex) => {
              if (!content) {
                return; // Skip missing content
              }

              // Only validate if content has been started
              if (content.title && content.title.trim() !== "") {
                if (!content.description || content.description.trim() === "") {
                  errors.push(
                    `Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${
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
                      }, Content ${contentIndex + 1}: Video URL is required`
                    );
                  }
                  if (
                    !videoContent.thumbnailUrl ||
                    videoContent.thumbnailUrl.trim() === ""
                  ) {
                    errors.push(
                      `Module ${moduleIndex + 1}, Lesson ${
                        lessonIndex + 1
                      }, Content ${contentIndex + 1}: Video thumbnail is required`
                    );
                  }
                }

                if (content.type === "quiz") {
                  const quizContent = content as QuizContent;
                  if (!quizContent.questions || quizContent.questions.length === 0) {
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
            });
          }
        });
      }
    });

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
  };

  const updateModuleData = (
    moduleId: string,
    updates: Partial<CourseModule>
  ) => {
    console.log("updateModuleData called:", { moduleId, updates });

    const updatedModules = course.modules.map((module) => {
      if (module._id === moduleId) {
        const updated = { ...module, ...updates };
        console.log("Module updated:", updated);
        return updated;
      }
      return module;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));
  };

  const removeModule = async (index: number) => {
    const courseModule = course.modules[index];
    if (!courseModule) return;

    const courseId = getCourseId();
    if (!courseId) {
      setSaveError("Course ID not found. Please create a course first.");
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

        console.log(
          "Module deleted successfully from backend:",
          courseModule._id
        );
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

    // Remove from UI state
    const updatedModules = course.modules.filter((_, i) => i !== index);
    
    // Remove module ID from moduleIds array
    let updatedModuleIds = [...course.moduleIds];
    if (courseModule._id && !courseModule._id.startsWith("temp_")) {
      updatedModuleIds = updatedModuleIds.filter(id => id !== courseModule._id);
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

    console.log("Module removed from UI:", courseModule.title);
  };

  const saveModule = async (index: number) => {
    const courseModule = course.modules[index];
    if (!courseModule) return;

    const courseId = getCourseId();
    if (!courseId) {
      setSaveError("Course ID not found. Please create a course first.");
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
      const updatedModules = course.modules.map((module, i) => {
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
      });

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

      // Save the complete module data to localStorage
      saveModuleToStorage(updatedModule);

      // Mark as saved
      setSavedModules((prev) => new Set([...prev, index]));
      setExpandedModules((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });

      console.log(
        isNewModule
          ? `Module created successfully: ${updatedModule._id}`
          : `Module updated successfully: ${updatedModule._id}`
      );
    } catch (error) {
      console.error("Error saving module:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save module"
      );
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

    const updatedModules = course.modules.map((module, index) => {
      if (index === moduleIndex) {
        return {
          ...module,
          lessons: [...(module.lessons || []), newLesson],
        } as CourseModule;
      }
      return module;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // Update module's lessonIds array for data consistency
    updateModuleFromLessonChange(newLesson._id!, 'add');

    setExpandedLessons((prev) => new Set([...prev, newLesson._id!]));
  };

  // Remove lesson
  const removeLesson = async (lessonId: string) => {
    const courseId = getCourseId();
    if (!courseId) {
      setLessonSaveError("Course ID not found. Please create a course first.");
      return;
    }

    // Find the lesson and its module
    let targetLesson: CourseLesson | null = null;
    let moduleId: string | null = null;
    let moduleIndex: number = -1;
    let lessonIndex: number = -1;

    for (let i = 0; i < course.modules.length; i++) {
      const currentModule = course.modules[i];
      const lesson = currentModule.lessons?.find((l, idx) => {
        if (l._id === lessonId) {
          lessonIndex = idx;
          return true;
        }
        return false;
      });
      if (lesson) {
        targetLesson = lesson;
        moduleId = currentModule._id!;
        moduleIndex = i;
        break;
      }
    }

    if (!targetLesson || !moduleId || moduleIndex === -1) {
      setLessonSaveError("Lesson not found.");
      return;
    }

    // Check if this is a saved lesson (has real ID) or just a temp lesson
    const isSavedLesson = targetLesson._id && !targetLesson._id.startsWith("temp_");

    if (isSavedLesson) {
      // If it's a saved lesson, delete from backend first
      setIsSavingLesson(true);
      setLessonSaveError(null);

      try {
        await deleteLessonApi(courseId, moduleId, targetLesson._id!);

        console.log("Lesson deleted successfully from backend:", targetLesson._id);
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
    const updatedModules = course.modules.map((module, i) => {
      if (i === moduleIndex) {
        // Remove lesson from lessons array
        const updatedLessons = module.lessons?.filter((_, idx) => idx !== lessonIndex) || [];
        
        return {
          ...module,
          lessons: updatedLessons,
        } as CourseModule;
      }
      return module;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // Update module's lessonIds array for data consistency
    if (targetLesson._id && !targetLesson._id.startsWith("temp_")) {
      updateModuleFromLessonChange(targetLesson._id, 'remove');
    }

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

    console.log("Lesson removed successfully:", lessonId);
  };

  // Save lesson to backend
  const saveLesson = async (lessonId: string) => {
    const courseId = getCourseId();
    if (!courseId) {
      setLessonSaveError("Course ID not found. Please create a course first.");
      return;
    }

    // Find the lesson and its module
    let targetLesson: CourseLesson | null = null;
    let moduleId: string | null = null;
    let moduleIndex: number = -1;

    for (let i = 0; i < course.modules.length; i++) {
      const currentModule = course.modules[i];
      const lesson = currentModule.lessons?.find(l => l._id === lessonId);
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
        contentIds: (targetLesson.contentIds || []).filter((id): id is string => id !== undefined),
      };

      const isNewLesson = targetLesson._id?.startsWith("temp_");

      console.log("Lesson save/update details:", {
        lessonId: targetLesson._id,
        isNewLesson,
        courseId,
        moduleId,
        lessonData
      });

      let response;
      if (isNewLesson) {
        console.log("Creating new lesson...");
        response = await saveLessonApi(courseId, moduleId, lessonData);
        console.log("Lesson created successfully:", response);
        
        // Add a small delay to ensure the backend has processed the creation
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log("Updating existing lesson...");
        console.log("Update request details:", {
          courseId,
          moduleId,
          lessonId: targetLesson._id,
          lessonData
        });
        
        response = await updateLesson(courseId, moduleId, targetLesson._id!, lessonData);
        console.log("Lesson updated successfully:", response);
      }

      // Update the lesson with the backend response
      const updatedLesson = response;

      // For new lessons, we need to update the lesson ID in the module
      const updatedModules = course.modules.map((module, i) => {
        if (i === moduleIndex) {
          const updatedLessons = module.lessons?.map(lesson => {
            if (lesson._id === lessonId) {
              if (isNewLesson) {
                // For new lessons, replace the temp ID with the real ID
                const newLesson = {
                  ...lesson,
                  _id: updatedLesson._id,
                  ...updatedLesson,
                };
                console.log("Updated lesson with new ID:", newLesson);
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
            ...module,
            lessons: updatedLessons,
          } as CourseModule;
        }
        return module;
      });

      setCourse((prev) => ({
        ...prev,
        modules: updatedModules,
      }));

      // Update localStorage if it was a new lesson (ID replacement)
      if (isNewLesson && targetLesson._id && updatedLesson._id) {
        updateLessonIdInStorage(targetLesson._id, updatedLesson._id);
      }

      // Save the complete lesson data to localStorage
      saveLessonToStorage(updatedLesson);

      // Update module's lessonIds array for data consistency
      const realLessonId = updatedLesson._id || lessonId;
      updateModuleFromLessonChange(realLessonId, isNewLesson ? 'add' : 'update');

      // Mark as saved - use the real ID from the response
      setSavedLessons((prev) => new Set([...prev, realLessonId]));

      console.log(
        isNewLesson 
          ? `Lesson created successfully: ${realLessonId}`
          : `Lesson updated successfully: ${realLessonId}`
      );
    } catch (error) {
      console.error("Error saving lesson:", error);
      setLessonSaveError(error instanceof Error ? error.message : "Failed to save lesson");
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

    const updatedModules = course.modules.map((module) => {
      if (module._id === moduleId) {
        return {
          ...module,
          lessons:
            module.lessons?.map((lesson) => {
              if (lesson._id === lessonId) {
                return { ...lesson, ...updates } as CourseLesson;
              }
              return lesson;
            }) || [],
        } as CourseModule;
      }
      return module;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));
  };

  const findModuleIdByLessonId = (lessonId: string): string | undefined => {
    for (const courseModule of course.modules) {
      if (courseModule.lessons?.some((lesson) => lesson._id === lessonId)) {
        return courseModule._id;
      }
    }
    return undefined;
  };

  // Content operations
  const addContent = (lessonId: string, type: "video" | "quiz") => {
    const contentCount =
      course.modules
        .flatMap((m) => m.lessons || [])
        .flatMap((l) => l.contents || [])
        .filter((c) => c.type === type).length + 1;

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

    const updatedModules = course.modules.map((module) => {
      if (module._id === moduleId) {
        return {
          ...module,
          lessons:
            module.lessons?.map((lesson) => {
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
      return module;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // Update lesson's contentIds array for data consistency
    updateLessonFromContentChange(newContent._id!, 'add');

    setExpandedContent((prev) => new Set([...prev, newContent._id!]));
  };

  // Save content to backend
  const saveContent = async (contentId: string) => {
    const courseId = getCourseId();
    if (!courseId) {
      setContentSaveError("Course ID not found. Please create a course first.");
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
        const content = lesson.contents?.find((c, idx) => {
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

      console.log("Content save/update details:", {
        contentId: targetContent._id,
        isNewContent,
        courseId,
        moduleId,
        lessonId,
        contentData
      });

      let response;
      if (isNewContent) {
        console.log("Creating new content...");
        response = await saveContentApi(courseId, moduleId, lessonId, contentData);
        console.log("Content created successfully:", response);
        
        // Add a small delay to ensure the backend has processed the creation
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log("Updating existing content...");
        console.log("Update request details:", {
          courseId,
          moduleId,
          lessonId,
          contentId: targetContent._id,
          contentData
        });
        
        response = await updateContent(courseId, moduleId, lessonId, targetContent._id!, contentData);
        console.log("Content updated successfully:", response);
      }

      // Update the content with the backend response
      const updatedContent = response;

      // For new content, we need to update the content ID in the lesson
      const updatedModules = course.modules.map((module, i) => {
        if (i === moduleIndex) {
          return {
            ...module,
            lessons: module.lessons?.map((lesson, j) => {
              if (j === lessonIndex) {
                return {
                  ...lesson,
                  contents: lesson.contents?.map((content, k) => {
                    if (k === contentIndex) {
                      if (isNewContent) {
                        // For new content, replace the temp ID with the real ID
                        const newContent = {
                          ...content,
                          _id: updatedContent._id,
                          ...updatedContent,
                        };
                        console.log("Updated content with new ID:", newContent);
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
        return module;
      });

      setCourse((prev) => ({
        ...prev,
        modules: updatedModules,
      }));

      // Update localStorage if it was a new content (ID replacement)
      if (isNewContent && targetContent._id && updatedContent._id) {
        updateContentIdInStorage(targetContent._id, updatedContent._id);
      }

      // Save the complete content data to localStorage
      saveContentToStorage(updatedContent);

      // Update lesson's contentIds array for data consistency
      const realContentId = updatedContent._id || contentId;
      updateLessonFromContentChange(realContentId, isNewContent ? 'add' : 'update');

      // Mark as saved - use the real ID from the response
      setSavedContent((prev) => new Set([...prev, realContentId]));

      console.log(
        isNewContent 
          ? `Content created successfully: ${realContentId}`
          : `Content updated successfully: ${realContentId}`
      );
    } catch (error) {
      console.error("Error saving content:", error);
      setContentSaveError(error instanceof Error ? error.message : "Failed to save content");
    } finally {
      setIsSavingContent(false);
    }
  };

  const updateContentData = (contentId: string, updates: Partial<Content>) => {
    const location = findContentLocation(contentId);
    if (!location) return;

    const { moduleId, lessonId } = location;
    const updatedModules = course.modules.map((module) => {
      if (module._id === moduleId) {
        return {
          ...module,
          lessons:
            module.lessons?.map((lesson) => {
              if (lesson._id === lessonId) {
                return {
                  ...lesson,
                  contents:
                    lesson.contents?.map((content) => {
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
      return module;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));
  };

  // Remove content
  const removeContent = async (contentId: string) => {
    const courseId = getCourseId();
    if (!courseId) {
      setContentSaveError("Course ID not found. Please create a course first.");
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
        const content = lesson.contents?.find((c, idx) => {
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
    const isSavedContent = targetContent._id && !targetContent._id.startsWith("temp_");

    if (isSavedContent) {
      // If it's a saved content, delete from backend first
      setIsSavingContent(true);
      setContentSaveError(null);

      try {
        await deleteContentApi(courseId, moduleId, lessonId, targetContent._id!);

        console.log("Content deleted successfully from backend:", targetContent._id);
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
    const updatedModules = course.modules.map((module, i) => {
      if (i === moduleIndex) {
        return {
          ...module,
          lessons: module.lessons?.map((lesson, j) => {
            if (j === lessonIndex) {
              // Remove content from contents array
              const updatedContents = lesson.contents?.filter((_, idx) => idx !== contentIndex) || [];
              
              return {
                ...lesson,
                contents: updatedContents,
              } as CourseLesson;
            }
            return lesson;
          }) || [],
        } as CourseModule;
      }
      return module;
    });

    setCourse((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    // Update lesson's contentIds array for data consistency
    if (targetContent._id && !targetContent._id.startsWith("temp_")) {
      updateLessonFromContentChange(targetContent._id, 'remove');
    }

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

    console.log("Content removed successfully:", contentId);
  };

  const deleteContentData = (contentId: string) => {
    const location = findContentLocation(contentId);
    if (!location) return;

    const { moduleId, lessonId } = location;
    const updatedModules = course.modules.map((module) => {
      if (module._id === moduleId) {
        return {
          ...module,
          lessons:
            module.lessons?.map((lesson) => {
              if (lesson._id === lessonId) {
                return {
                  ...lesson,
                  contents:
                    lesson.contents?.filter(
                      (content) => content._id !== contentId
                    ) || [],
                } as CourseLesson;
              }
              return lesson;
            }) || [],
        } as CourseModule;
      }
      return module;
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
        if (lesson.contents?.some((content) => content._id === contentId)) {
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

      console.log("Starting thumbnail upload:", {
        moduleId,
        fileName: file.name,
        fileSize: file.size,
        folderName,
      });

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
    const currentModule = course.modules.find((m) => m._id === moduleId);

    // If it's an uploaded file, delete from S3
    if (currentModule?.thumbnailS3Key && currentModule.thumbnailSource === "upload") {
      try {
        console.log("Deleting thumbnail from S3:", currentModule.thumbnailS3Key);
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

      console.log("Starting video upload:", {
        contentId,
        fileName: file.name,
        fileSize: file.size,
        folderName,
      });

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
      
      // Update the content with the new video URL
      updateContentData(contentId, {
        sources: [{
          quality: "1080p",
          videoUrl: url
        }],
        videoS3Key: s3Key, // Store S3 key for future operations
        videoSource: "upload"
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
      sources: [{
        quality: "1080p",
        videoUrl: url
      }],
      videoSource: "url"
    });
  };

  const handleVideoRemove = async (contentId: string) => {
    const contentLocation = findContentLocation(contentId);
    if (!contentLocation) return;

    // Find the content to get S3 key
    let contentS3Key: string | undefined;
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons || []) {
        const content = lesson.contents?.find((c) => c._id === contentId);
        if (content && (content as any).videoS3Key) {
          contentS3Key = (content as any).videoS3Key;
          break;
        }
      }
    }

    // If it's an uploaded file, delete from S3
    if (contentS3Key) {
      try {
        console.log("Deleting video from S3:", contentS3Key);
        // Note: The deleteFile function from useUpload would be used here
        // await deleteFile(contentS3Key);
      } catch (error) {
        console.error("Failed to delete video from S3:", error);
      }
    }

    updateContentData(contentId, {
      sources: [],
      videoS3Key: undefined,
      videoSource: undefined
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

      console.log("Starting content thumbnail upload:", {
        contentId,
        fileName: file.name,
        fileSize: file.size,
        folderName,
      });

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
        thumbnailSource: "upload"
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
      thumbnailSource: "url"
    });
  };

  const handleContentThumbnailRemove = async (contentId: string) => {
    // Find the content to get S3 key
    let contentS3Key: string | undefined;
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons || []) {
        const content = lesson.contents?.find((c) => c._id === contentId);
        if (content && (content as any).thumbnailS3Key) {
          contentS3Key = (content as any).thumbnailS3Key;
          break;
        }
      }
    }

    // If it's an uploaded file, delete from S3
    if (contentS3Key) {
      try {
        console.log("Deleting content thumbnail from S3:", contentS3Key);
        // await deleteFile(contentS3Key);
      } catch (error) {
        console.error("Failed to delete content thumbnail from S3:", error);
      }
    }

    updateContentData(contentId, {
      thumbnailUrl: "",
      thumbnailS3Key: undefined,
      thumbnailSource: undefined
    });
  };

  // Data consistency helper functions
  const updateModuleFromLessonChange = (lessonId: string, operation: 'add' | 'remove' | 'update') => {
    // Find which module contains this lesson
    let targetModuleIndex = -1;
    let targetModule: CourseModule | null = null;

    for (let i = 0; i < course.modules.length; i++) {
      const currentModule = course.modules[i];
      if (currentModule.lessons?.some(lesson => lesson._id === lessonId)) {
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
    
    if (operation === 'add') {
      // Add lesson ID if not already present
      if (!updatedLessonIds.includes(lessonId)) {
        updatedLessonIds.push(lessonId);
      }
    } else if (operation === 'remove') {
      // Remove lesson ID
      updatedLessonIds = updatedLessonIds.filter(id => id !== lessonId);
    }
    // For 'update', we don't need to change the lessonIds array

    // Update the module with new lessonIds
    const updatedModules = course.modules.map((module, i) => {
      if (i === targetModuleIndex) {
        return {
          ...module,
          lessonIds: updatedLessonIds,
          updatedAt: new Date()
        };
      }
      return module;
    });

    setCourse(prev => ({
      ...prev,
      modules: updatedModules
    }));

    // Update localStorage
    if (targetModule._id) {
      const updatedModule = updatedModules[targetModuleIndex];
      saveModuleToStorage(updatedModule);
      console.log(`Updated module ${targetModule._id} lessonIds:`, updatedLessonIds);
    }
  };

  const updateLessonFromContentChange = (contentId: string, operation: 'add' | 'remove' | 'update') => {
    // Find which lesson contains this content
    let targetModuleIndex = -1;
    let targetLessonIndex = -1;
    let targetLesson: CourseLesson | null = null;

    for (let i = 0; i < course.modules.length; i++) {
      const currentModule = course.modules[i];
      for (let j = 0; j < (currentModule.lessons || []).length; j++) {
        const lesson = currentModule.lessons![j];
        if (lesson.contents?.some(content => content._id === contentId)) {
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
    
    if (operation === 'add') {
      // Add content ID if not already present
      if (!updatedContentIds.includes(contentId)) {
        updatedContentIds.push(contentId);
      }
    } else if (operation === 'remove') {
      // Remove content ID
      updatedContentIds = updatedContentIds.filter(id => id !== contentId);
    }
    // For 'update', we don't need to change the contentIds array

    // Update the lesson with new contentIds
    const updatedModules = course.modules.map((module, i) => {
      if (i === targetModuleIndex) {
        return {
          ...module,
          lessons: module.lessons?.map((lesson, j) => {
            if (j === targetLessonIndex) {
              return {
                ...lesson,
                contentIds: updatedContentIds,
                updatedAt: new Date()
              };
            }
            return lesson;
          }) || []
        };
      }
      return module;
    });

    setCourse(prev => ({
      ...prev,
      modules: updatedModules
    }));

    // Update localStorage
    if (targetLesson._id) {
      const updatedLesson = updatedModules[targetModuleIndex].lessons![targetLessonIndex];
      saveLessonToStorage(updatedLesson);
      console.log(`Updated lesson ${targetLesson._id} contentIds:`, updatedContentIds);
    }
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
      return !!content.title && !!content.description && 
             (content.sources?.length || 0) > 0 && 
             content.sources?.every(source => !!source.videoUrl);
    } else if (content.type === "quiz") {
      return !!content.title && !!content.description && 
             (content.questions?.length || 0) > 0;
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
    updateLessonFromContentChange,
    
    // Debug utilities
    clearModulesFromStorage,
    updateCourseInStorage,
    
    // Module IDs for course finalization
    getModuleIds: () => course.moduleIds.filter(id => id && !id.startsWith("temp_")),
  };
};
