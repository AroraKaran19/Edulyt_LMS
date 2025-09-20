"use client";

import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import { useEditCourseContext } from "../../../reducers/course/providers/EditCourseReducerProvider";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import Input from "@/components/ui/inputs/Input";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useUpload } from "@/hooks/useUpload";
import ScreenNavigation from "./shared/ScreenNavigation";
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  Play,
  Edit2,
  GripVertical,
  HelpCircle,
} from "lucide-react";
import {
  CourseModule,
  CourseLesson,
  Content,
  VideoContent,
  QuizContent,
} from "@/types";
import { useScreen } from "../contexts/ScreenContext";
import { useEditCourse } from "@/hooks/useEditCourse";
import { toast } from "react-toastify";
import ContentSection from "./content/ContentSection";
import { FullScreenLoader, InlineLoader } from "@/components/ui/Loader";

const Screen11 = () => {
  const { state, actions } = useEditCourseContext();
  const { uploadWithPresignedUrl, isUploading } = useUpload();
  const { setActiveScreen } = useScreen();
  // Remove createCourseMetadata as we're editing, not creating
  const {
    addSingleCourseModule,
    updateSingleCourseModule,
    deleteSingleCourseModule,
    addSingleCourseLesson,
    updateSingleCourseLesson,
    deleteSingleCourseLesson,
    addSingleCourseContent,
    updateSingleCourseContent,
    deleteSingleCourseContent,
    isLoading: isBackendLoading,
  } = useEditCourse();
  const [savedModules, setSavedModules] = useState<Set<number>>(new Set());
  const [modifiedModules, setModifiedModules] = useState<Set<number>>(
    new Set()
  );
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set()
  );
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set()
  );
  const [expandedContent, setExpandedContent] = useState<Set<string>>(
    new Set()
  );
  const [isCourseLoaded, setIsCourseLoaded] = useState(false);

  // Sequential flow state management
  const [savedLessons, setSavedLessons] = useState<Set<string>>(new Set());
  const [savedContents, setSavedContents] = useState<Set<string>>(new Set());
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Check if course is loaded for editing
  useEffect(() => {
    const courseId = localStorage.getItem("current_course_id");
    setIsCourseLoaded(!!courseId);
  }, []);

  // Load modules from localStorage if not in state
  useEffect(() => {
    const courseId = localStorage.getItem("current_course_id");

    // If course is loaded but no modules in state, try to load from localStorage
    if (
      courseId &&
      (!state.course.modules || state.course.modules.length === 0)
    ) {
      const storedModules = localStorage.getItem("course_modules_draft");
      if (storedModules) {
        try {
          const modules = JSON.parse(storedModules);
          if (modules.length > 0) {
            console.log("Loading modules from localStorage:", modules);
            actions.setCourseModules(modules);
          }
        } catch (error) {
          console.error("Error loading modules from localStorage:", error);
        }
      }
    }
  }, [state.course.modules, actions]);

  // Validation checks
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    console.log("Running validation for modules:", state.course.modules);

    // Check if at least one module exists
    if (!state.course.modules || state.course.modules.length === 0) {
      errors.push("At least one module is required");
      console.log("No modules found, returning early");
      return errors; // Early return if no modules
    }

    // Validate each module is fully configured
    state.course.modules.forEach((courseModule, moduleIndex) => {
      console.log(`Validating module ${moduleIndex + 1}:`, courseModule);

      if (!courseModule) {
        errors.push(`Module ${moduleIndex + 1}: Module data is missing`);
        return;
      }

      // Check module basic requirements
      if (!courseModule.title || courseModule.title.trim() === "") {
        console.log(`Module ${moduleIndex + 1}: Title is missing`);
        errors.push(`Module ${moduleIndex + 1}: Title is required`);
      }

      if (!courseModule.description || courseModule.description.trim() === "") {
        console.log(`Module ${moduleIndex + 1}: Description is missing`);
        errors.push(`Module ${moduleIndex + 1}: Description is required`);
      }

      if (
        !courseModule.thumbnailUrl ||
        courseModule.thumbnailUrl.trim() === ""
      ) {
        console.log(`Module ${moduleIndex + 1}: Thumbnail is missing`);
        errors.push(`Module ${moduleIndex + 1}: Thumbnail is required`);
      }

      // Check if module has at least one lesson
      if (!courseModule.lessons || courseModule.lessons.length === 0) {
        errors.push(
          `Module ${moduleIndex + 1}: At least one lesson is required`
        );
        return; // Skip lesson validation if no lessons
      }

      // Validate each lesson in the module
      courseModule.lessons.forEach((lesson, lessonIndex) => {
        console.log(
          `Validating lesson ${lessonIndex + 1} in module ${moduleIndex + 1}:`,
          lesson
        );

        if (!lesson) {
          errors.push(
            `Module ${moduleIndex + 1}, Lesson ${
              lessonIndex + 1
            }: Lesson data is missing`
          );
          return;
        }

        // Check lesson basic requirements
        if (!lesson.title || lesson.title.trim() === "") {
          console.log(
            `Module ${moduleIndex + 1}, Lesson ${
              lessonIndex + 1
            }: Title is missing`
          );
          errors.push(
            `Module ${moduleIndex + 1}, Lesson ${
              lessonIndex + 1
            }: Title is required`
          );
        }

        // Check if lesson has at least one content
        if (!lesson.contents || lesson.contents.length === 0) {
          errors.push(
            `Module ${moduleIndex + 1}, Lesson ${
              lessonIndex + 1
            }: At least one content item is required`
          );
          return; // Skip content validation if no contents
        }

        // Validate each content in the lesson
        lesson.contents.forEach((content, contentIndex) => {
          console.log(
            `Validating content ${contentIndex + 1} in lesson ${
              lessonIndex + 1
            }, module ${moduleIndex + 1}:`,
            content
          );

          if (!content) {
            errors.push(
              `Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${
                contentIndex + 1
              }: Content data is missing`
            );
            return;
          }

          // Title is required for all content
          if (!content.title || content.title.trim() === "") {
            console.log(
              `Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${
                contentIndex + 1
              }: Title is missing`
            );
            errors.push(
              `Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}, Content ${
                contentIndex + 1
              }: Title is required`
            );
          }

          // Video-specific validation
          if (content.type === "video") {
            const videoContent = content as VideoContent;

            // Video URL is required
            if (
              !videoContent.sources ||
              !videoContent.sources[0]?.videoUrl ||
              videoContent.sources[0].videoUrl.trim() === ""
            ) {
              console.log(
                `Module ${moduleIndex + 1}, Lesson ${
                  lessonIndex + 1
                }, Content ${contentIndex + 1}: Video URL is missing`
              );
              errors.push(
                `Module ${moduleIndex + 1}, Lesson ${
                  lessonIndex + 1
                }, Content ${contentIndex + 1}: Video URL is required`
              );
            }

            // Video thumbnail is required
            if (
              !videoContent.thumbnailUrl ||
              videoContent.thumbnailUrl.trim() === ""
            ) {
              console.log(
                `Module ${moduleIndex + 1}, Lesson ${
                  lessonIndex + 1
                }, Content ${contentIndex + 1}: Video thumbnail is missing`
              );
              console.log(
                `Video thumbnail validation failed. Value: "${videoContent.thumbnailUrl}"`
              );
              errors.push(
                `Module ${moduleIndex + 1}, Lesson ${
                  lessonIndex + 1
                }, Content ${contentIndex + 1}: Video thumbnail is required`
              );
            } else {
              console.log(
                `Module ${moduleIndex + 1}, Lesson ${
                  lessonIndex + 1
                }, Content ${contentIndex + 1}: Video thumbnail is present: "${
                  videoContent.thumbnailUrl
                }"`
              );
            }
          }

          // Quiz-specific validation (if needed)
          if (content.type === "quiz") {
            const quizContent = content as QuizContent;

            // Check if quiz has at least one question
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
        });
      });
    });

    console.log("Validation completed. Total errors:", errors.length);
    console.log("Validation errors:", errors);
    return errors;
  }, [state.course]);

  // Initialize saved modules state when modules are loaded
  useEffect(() => {
    const modules = state.course.modules || [];
    const savedIndices = new Set<number>();

    console.log("Modules state changed:", modules);

    modules.forEach((module, index) => {
      // Consider a module as saved if it has a title (basic requirement)
      if (module && module.title) {
        savedIndices.add(index);
      }
    });

    setSavedModules(savedIndices);
  }, [state.course.modules]);

  // Debug effect to monitor modules changes
  useEffect(() => {
    console.log("Modules array changed:", state.course.modules);
    console.log("Modules length:", state.course.modules?.length || 0);

    // Save modules to localStorage whenever modules change
    if (state.course.modules && state.course.modules.length > 0) {
      saveModulesToLocalStorage();
    }
  }, [state.course.modules]);

  // Helper function to generate a unique ID
  const generateId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Helper function to save modules to localStorage
  const saveModulesToLocalStorage = () => {
    const modules = state.course.modules || [];
    localStorage.setItem("course_modules_draft", JSON.stringify(modules));
    console.log("Modules saved to localStorage:", modules);
  };

  // Helper function to add a new module
  const addModule = () => {
    const moduleCount = (state.course.modules || []).length + 1;
    const newModule: CourseModule = {
      _id: generateId(),
      title: "",
      description: "",
      lessons: [],
      lessonIds: [],
      thumbnailUrl: "",
      isActive: true,
      isCompleted: false,
    };

    // Add the new module to the course state
    const result = actions.addCourseModule(newModule);

    if (result.error) {
      console.error("Error adding module:", result.error);
      toast.error("Failed to add module. Please try again.");
      return;
    }

    // Get the index of the newly added module
    const newIndex = (state.course.modules || []).length;
    // Expand the new module for editing
    setExpandedModules((prev) => new Set([...prev, newIndex]));

    // Save to localStorage
    setTimeout(() => {
      saveModulesToLocalStorage();
    }, 100);
  };

  // Helper function to save module to API
  const saveModuleToAPI = async (moduleIndex: number) => {
    const courseId = localStorage.getItem("current_course_id");
    if (!courseId) {
      toast.error("Course ID not found. Please restart course editing.");
      return;
    }

    const modules = state.course.modules || [];
    const module = modules[moduleIndex];
    if (!module) return;

    setIsSavingModule(true);

    try {
      // Check if this is a new module (temp ID) or existing module
      const isNewModule = module._id?.startsWith('temp_');
      
      if (isNewModule) {
        // Create new module
        const moduleData = {
          title: module.title,
          description: module.description,
          thumbnailUrl: module.thumbnailUrl,
          isActive: module.isActive,
          isCompleted: module.isCompleted,
        };

        const response = await addSingleCourseModule(courseId, moduleData);

        if (response.success && (response as any).module) {
          // Update module with real ID from API
          const updatedModule = {
            ...module,
            _id: (response as any).module._id,
          };

          // Update course state
          actions.updateCourseModule(module._id!, updatedModule);

          // Mark as saved
          setSavedModules((prev) => new Set([...prev, moduleIndex]));

          // Collapse the module after saving
          setExpandedModules((prev) => {
            const newSet = new Set(prev);
            newSet.delete(moduleIndex);
            return newSet;
          });

          // Save to localStorage
          setTimeout(() => {
            saveModulesToLocalStorage();
          }, 100);

          toast.success("Module created successfully");
        } else {
          throw new Error(response.error || "Failed to create module");
        }
      } else {
        // Update existing module
        const updates = {
          title: module.title,
          description: module.description,
          thumbnailUrl: module.thumbnailUrl,
          isActive: module.isActive,
          isCompleted: module.isCompleted,
        };

        await updateModuleDataAPI(module._id!, updates);

        // Mark as saved
        setSavedModules((prev) => new Set([...prev, moduleIndex]));

        // Collapse the module after saving
        setExpandedModules((prev) => {
          const newSet = new Set(prev);
          newSet.delete(moduleIndex);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Failed to save module:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save module"
      );
    } finally {
      setIsSavingModule(false);
    }
  };

  // Helper function to add a new lesson to a module (local only)
  const addLesson = (moduleIndex: number) => {
    const courseModule = state.course.modules?.[moduleIndex];

    if (!courseModule) {
      toast.error("Module not found.");
      return;
    }

    // Check if module is saved to backend (not a temp ID)
    const isModuleTempId = courseModule._id?.startsWith('temp_');
    if (isModuleTempId) {
      toast.error("Please save the module to the database before adding lessons.");
      return;
    }

    const lessonCount = (courseModule.lessons || []).length + 1;
    const newLesson: CourseLesson = {
      _id: generateId(),
      title: "",
      description: "",
      contents: [],
      contentIds: [],
    };

    console.log("Creating new lesson locally:", newLesson);

    // Add to local state
    const result = actions.addCourseLesson(courseModule._id!, newLesson);

    if (result.error) {
      console.error("Error adding lesson to local state:", result.error);
      toast.error("Failed to add lesson to local state. Please try again.");
      return;
    }

    // Expand the new lesson for editing
    setExpandedLessons((prev) => new Set([...prev, newLesson._id!]));

    // Mark module as modified
    setModifiedModules((prev) => new Set([...prev, moduleIndex]));

    // Save to localStorage for draft persistence
    setTimeout(() => {
      saveModulesToLocalStorage();
    }, 100);

    console.log("Lesson added locally:", newLesson._id);
  };

  // Helper function to save lesson to API
  const saveLessonToAPI = async (lessonId: string) => {
    const courseId = localStorage.getItem("current_course_id");
    if (!courseId) {
      toast.error("Course ID not found. Please restart course editing.");
      return;
    }

    const location = findLessonLocation(lessonId);
    if (!location) {
      toast.error("Lesson location not found.");
      return;
    }

    const { moduleId } = location;
    const moduleIndex = state.course.modules?.findIndex(m => m._id === moduleId);
    const lesson = state.course.modules?.[moduleIndex!]?.lessons?.find(l => l._id === lessonId);

    if (!lesson) {
      toast.error("Lesson not found.");
      return;
    }

    // Check if module is saved to backend (not a temp ID)
    const isModuleTempId = moduleId?.startsWith('temp_');
    if (isModuleTempId) {
      toast.error("Please save the module to the database before adding lessons.");
      return;
    }

    setIsSavingLesson(true);

    try {
      // Check if this is a new lesson (temp ID) or existing lesson
      const isNewLesson = lesson._id?.startsWith('temp_');
      
      if (isNewLesson) {
        // Create new lesson
        const lessonData = {
          title: lesson.title,
          description: lesson.description,
        };

        const response = await addSingleCourseLesson(courseId, moduleId, lessonData);

        if (response.success && (response as any).lesson) {
          // Update lesson with real ID from API
          const updatedLesson = {
            ...lesson,
            _id: (response as any).lesson._id,
          };

          // Update course state
          actions.updateCourseLesson(moduleId, lessonId, updatedLesson);

          // Mark lesson as saved
          setSavedLessons((prev) => new Set([...prev, updatedLesson._id!]));

          // Mark module as modified
          if (moduleIndex !== undefined) {
            setModifiedModules((prev) => new Set([...prev, moduleIndex]));
          }

          // Save to localStorage
          setTimeout(() => {
            saveModulesToLocalStorage();
          }, 100);

          toast.success("Lesson created successfully");
        } else {
          throw new Error(response.error || "Failed to create lesson");
        }
      } else {
        // Update existing lesson
        const updates = {
          title: lesson.title,
          description: lesson.description,
        };

        const backendResult = await updateSingleCourseLesson(
          courseId,
          moduleId,
          lessonId,
          updates
        );

        if (!backendResult.success) {
          throw new Error(backendResult.error || "Failed to update lesson");
        }

        // Mark lesson as saved
        setSavedLessons((prev) => new Set([...prev, lessonId]));

        // Mark module as modified
        if (moduleIndex !== undefined) {
          setModifiedModules((prev) => new Set([...prev, moduleIndex]));
        }

        // Save to localStorage
        setTimeout(() => {
          saveModulesToLocalStorage();
        }, 100);

        toast.success("Lesson saved successfully");
      }
    } catch (error) {
      console.error("Failed to save lesson:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save lesson");
    } finally {
      setIsSavingLesson(false);
    }
  };

  // Helper function to add content to a lesson (local only)
  const addContent = (lessonId: string, type: "video" | "quiz") => {
    // Find the module and lesson to add content to
    const moduleId = findModuleIdByLessonId(lessonId);
    if (!moduleId) {
      toast.error("Module not found for lesson.");
      return;
    }

    // Check if module is saved to backend (not a temp ID)
    const isModuleTempId = moduleId?.startsWith('temp_');
    if (isModuleTempId) {
      toast.error("Please save the module to the database before adding content.");
      return;
    }

    // Check if lesson is saved to backend (not a temp ID)
    const isLessonTempId = lessonId?.startsWith('temp_');
    if (isLessonTempId) {
      toast.error("Please save the lesson to the database before adding content.");
      return;
    }

    // Generate a default title that meets the requirement
    const contentCount =
      (state.course.modules || [])
        .flatMap((m) => m.lessons || [])
        .flatMap((l) => l.contents || [])
        .filter((c) => c.type === type).length + 1;

    const defaultTitle =
      type === "video"
        ? `Video Content ${contentCount}`
        : `Quiz ${contentCount}`;

    const newContent: Content =
      type === "video"
        ? ({
            _id: generateId(),
            title: "",
            description: "",
            type: "video",
            isCompleted: false,
            sources: [
              {
                quality: "1080p" as const,
                videoUrl: "",
              },
            ],
            thumbnailUrl: "",
            duration: 0,
            readingMaterials: [],
          } as VideoContent)
        : ({
            _id: generateId(),
            title: "",
            description: "",
            type: "quiz",
            isCompleted: false,
            questions: [],
            passingScore: 70,
            maxAttempts: 3,
            readingMaterials: [],
          } as QuizContent);

    console.log("Creating new content locally:", newContent);

    // Add to local state
    const result = actions.addCourseContent(moduleId, lessonId, newContent);

    if (result.error) {
      console.error("Error adding content to local state:", result.error);
      toast.error("Failed to add content to local state. Please try again.");
      return;
    }

    // Expand the new content for editing
    setExpandedContent((prev) => new Set([...prev, newContent._id!]));

    // Mark module as modified
    const moduleIndex = state.course.modules?.findIndex(m => m._id === moduleId);
    if (moduleIndex !== undefined) {
      setModifiedModules((prev) => new Set([...prev, moduleIndex]));
    }

    // Save to localStorage for draft persistence
    setTimeout(() => {
      saveModulesToLocalStorage();
    }, 100);

    console.log("Content added locally:", newContent._id);
  };

  // Helper function to save content to API
  const saveContentToAPI = async (contentId: string) => {
    const courseId = localStorage.getItem("current_course_id");
    if (!courseId) {
      toast.error("Course ID not found. Please restart course editing.");
      return;
    }

    const location = findContentLocation(contentId);
    if (!location) {
      toast.error("Content location not found.");
      return;
    }

    const { moduleId, lessonId } = location;
    const moduleIndex = state.course.modules?.findIndex(m => m._id === moduleId);
    const lesson = state.course.modules?.[moduleIndex!]?.lessons?.find(l => l._id === lessonId);
    const content = lesson?.contents?.find(c => c._id === contentId);

    if (!content) {
      toast.error("Content not found.");
      return;
    }

    // Check if module is saved to backend (not a temp ID)
    const isModuleTempId = moduleId?.startsWith('temp_');
    if (isModuleTempId) {
      toast.error("Please save the module to the database before adding content.");
      return;
    }

    // Check if lesson is saved to backend (not a temp ID)
    const isLessonTempId = lessonId?.startsWith('temp_');
    if (isLessonTempId) {
      toast.error("Please save the lesson to the database before adding content.");
      return;
    }

    setIsSavingContent(true);

    try {
      // Check if this is a new content (temp ID) or existing content
      const isNewContent = content._id?.startsWith('temp_');
      
      if (isNewContent) {
        // Create new content
        const contentData = {
          title: content.title,
          description: content.description,
          type: content.type,
          isCompleted: content.isCompleted,
          ...(content.type === "video"
            ? {
                sources: (content as VideoContent).sources,
                thumbnailUrl: (content as VideoContent).thumbnailUrl,
                duration: (content as VideoContent).duration,
                readingMaterials: content.readingMaterials,
              }
            : {
                questions: (content as QuizContent).questions,
                passingScore: (content as QuizContent).passingScore,
                maxAttempts: (content as QuizContent).maxAttempts,
                readingMaterials: content.readingMaterials,
              }),
        };

        const response = await addSingleCourseContent(courseId, moduleId, lessonId, contentData);

        if (response.success && (response as any).content) {
          // Update content with real ID from API
          const updatedContent = {
            ...content,
            _id: (response as any).content._id,
          };

          // Update course state
          actions.updateCourseContent(moduleId, lessonId, contentId, updatedContent);

          // Mark content as saved
          setSavedContents((prev) => new Set([...prev, updatedContent._id!]));

          // Mark module as modified
          if (moduleIndex !== undefined) {
            setModifiedModules((prev) => new Set([...prev, moduleIndex]));
          }

          // Save to localStorage
          setTimeout(() => {
            saveModulesToLocalStorage();
          }, 100);

          toast.success("Content created successfully");
        } else {
          throw new Error(response.error || "Failed to create content");
        }
      } else {
        // Update existing content
        const updates = {
          title: content.title,
          description: content.description,
          isCompleted: content.isCompleted,
          ...(content.type === "video"
            ? {
                sources: (content as VideoContent).sources,
                thumbnailUrl: (content as VideoContent).thumbnailUrl,
                duration: (content as VideoContent).duration,
                readingMaterials: content.readingMaterials,
              }
            : {
                questions: (content as QuizContent).questions,
                passingScore: (content as QuizContent).passingScore,
                maxAttempts: (content as QuizContent).maxAttempts,
                readingMaterials: content.readingMaterials,
              }),
        };

        const backendResult = await updateSingleCourseContent(
          courseId,
          moduleId,
          lessonId,
          contentId,
          updates
        );

        if (!backendResult.success) {
          throw new Error(backendResult.error || "Failed to update content");
        }

        // Mark content as saved
        setSavedContents((prev) => new Set([...prev, contentId]));

        // Mark module as modified
        if (moduleIndex !== undefined) {
          setModifiedModules((prev) => new Set([...prev, moduleIndex]));
        }

        // Save to localStorage
        setTimeout(() => {
          saveModulesToLocalStorage();
        }, 100);

        toast.success("Content saved successfully");
      }
    } catch (error) {
      console.error("Failed to save content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save content");
    } finally {
      setIsSavingContent(false);
    }
  };

  // Helper function to find module ID by lesson ID
  const findModuleIdByLessonId = (lessonId: string): string | undefined => {
    for (const courseModule of state.course.modules || []) {
      if (courseModule.lessons?.some((lesson) => lesson._id === lessonId)) {
        return courseModule._id;
      }
    }
    return undefined;
  };

  // Helper function to toggle module expansion
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

  // Helper function to toggle lesson expansion
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

  // Helper function to toggle content expansion
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

  // Helper function to check if module is complete
  const isModuleComplete = (courseModule: CourseModule) => {
    return (
      courseModule.title &&
      courseModule.description &&
      courseModule.thumbnailUrl
    );
  };

  // Helper function to check if a module can be saved
  const canSaveModule = (moduleIndex: number) => {
    const module = state.course.modules?.[moduleIndex];
    if (!module) return false;

    // Check if module is complete
    const isComplete = isModuleComplete(module);

    // Check if module has been modified
    const isModified = modifiedModules.has(moduleIndex);

    return isComplete && isModified;
  };

  // Helper function to update module data
  // Local-only update function for real-time editing
  const updateModuleData = (moduleId: string, updates: Partial<CourseModule>) => {
    console.log("updateModuleData called with:", moduleId, updates);
    
    // Update in local state only
    const result = actions.updateCourseModule(moduleId, updates);

    if (result.error) {
      console.error("Error updating module in local state:", result.error);
      return;
    }

    // Mark module as modified
    const moduleIndex = state.course.modules?.findIndex(
      (m) => m._id === moduleId
    );
    if (moduleIndex !== undefined && moduleIndex >= 0) {
      setModifiedModules((prev) => new Set([...prev, moduleIndex]));
      console.log("Module marked as modified:", moduleIndex);
    }

    // Save to localStorage for draft persistence
    setTimeout(() => {
      saveModulesToLocalStorage();
    }, 100);

    console.log("Module updated locally");
  };

  // API update function for saving to backend
  const updateModuleDataAPI = async (
    moduleId: string,
    updates: Partial<CourseModule>
  ) => {
    const courseId = localStorage.getItem("current_course_id");
    if (!courseId) {
      toast.error("Course ID not found. Please restart course editing.");
      return;
    }

    console.log("updateModuleDataAPI called with:", moduleId, updates);

    try {
      // Update in backend
      const backendResult = await updateSingleCourseModule(
        courseId,
        moduleId,
        updates
      );

      if (!backendResult.success) {
        toast.error(
          backendResult.error || "Failed to update module in backend"
        );
        return;
      }

      // Update local state
      const result = actions.updateCourseModule(moduleId, updates);

      if (result.error) {
        console.error("Error updating module in local state:", result.error);
        toast.error("Failed to update module in local state. Please try again.");
        return;
      }

      // Mark module as saved
      const moduleIndex = state.course.modules?.findIndex(
        (m) => m._id === moduleId
      );
      if (moduleIndex !== undefined && moduleIndex >= 0) {
        setSavedModules((prev) => new Set([...prev, moduleIndex]));
        setModifiedModules((prev) => {
          const newSet = new Set(prev);
          newSet.delete(moduleIndex);
          return newSet;
        });
      }

      // Save to localStorage
      setTimeout(() => {
        saveModulesToLocalStorage();
      }, 100);

      console.log("Module saved to backend successfully");
      toast.success("Module saved successfully");
    } catch (error) {
      console.error("Error updating module:", error);
      toast.error("Failed to update module. Please try again.");
    }
  };

  // Helper function to update lesson data (local only)
  const updateLessonData = (lessonId: string, updates: Partial<CourseLesson>) => {
    console.log("updateLessonData called with:", lessonId, updates);
    
    const moduleId = findModuleIdByLessonId(lessonId);
    if (!moduleId) {
      console.error("Module not found for lesson:", lessonId);
      return;
    }

    // Update in local state only
    const result = actions.updateCourseLesson(moduleId, lessonId, updates);

    if (result.error) {
      console.error("Error updating lesson in local state:", result.error);
      return;
    }

    // Mark module as modified
    const moduleIndex = state.course.modules?.findIndex(
      (m) => m._id === moduleId
    );
    if (moduleIndex !== undefined && moduleIndex >= 0) {
      setModifiedModules((prev) => new Set([...prev, moduleIndex]));
    }

    // Save to localStorage for draft persistence
    setTimeout(() => {
      saveModulesToLocalStorage();
    }, 100);

    console.log("Lesson updated locally");
  };

  // Helper function to update content data (local only)
  const updateContentData = (contentId: string, updates: Partial<Content>) => {
    console.log("updateContentData called with:", contentId, updates);
    
    const location = findContentLocation(contentId);
    if (!location) {
      console.error("Content location not found:", contentId);
      return;
    }

    const { moduleId, lessonId } = location;

    // Update in local state only
    const result = actions.updateCourseContent(
      moduleId,
      lessonId,
      contentId,
      updates
    );

    if (result.error) {
      console.error("Error updating content in local state:", result.error);
      return;
    }

    // Mark module as modified
    const moduleIndex = state.course.modules?.findIndex(
      (m) => m._id === moduleId
    );
    if (moduleIndex !== undefined && moduleIndex >= 0) {
      setModifiedModules((prev) => new Set([...prev, moduleIndex]));
    }

    // Save to localStorage for draft persistence
    setTimeout(() => {
      saveModulesToLocalStorage();
    }, 100);

    console.log("Content updated locally");
  };

  // Helper function to delete content data (sequential flow)
  const deleteContentData = async (contentId: string) => {
    const courseId = localStorage.getItem("current_course_id");
    const location = findContentLocation(contentId);

    if (!courseId) {
      toast.error("Course ID not found. Please restart course editing.");
      return;
    }

    if (!location) {
      toast.error("Content location not found.");
      return;
    }

    const { moduleId, lessonId } = location;

    try {
      setIsSavingContent(true);

      // Delete from backend first
      const backendResult = await deleteSingleCourseContent(
        courseId,
        moduleId,
        lessonId,
        contentId
      );

      if (!backendResult.success) {
        const errorMessage =
          backendResult.error || "Failed to delete content from backend";
        console.error("Backend error deleting content:", errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Delete from local state
      const result = actions.deleteCourseContent(moduleId, lessonId, contentId);

      if (result.error) {
        console.error("Content deletion error:", result.error);
        toast.error(result.error.message || "Failed to delete content");
        return;
      }

      // Remove from saved contents
      setSavedContents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });

      // Save modules to localStorage after deletion
      setTimeout(() => {
        saveModulesToLocalStorage();
      }, 100);

      console.log("Content deleted successfully:", contentId);
      toast.success("Content deleted successfully!");
    } catch (error) {
      console.error("Error deleting content:", error);
      let errorMessage = "Failed to delete content. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSavingContent(false);
    }
  };

  // Helper function to delete lesson data (sequential flow)
  const deleteLessonData = async (lessonId: string) => {
    const courseId = localStorage.getItem("current_course_id");
    const moduleId = findModuleIdByLessonId(lessonId);

    if (!courseId) {
      toast.error("Course ID not found. Please restart course editing.");
      return;
    }

    if (!moduleId) {
      console.error("Module not found for lesson:", lessonId);
      toast.error("Failed to find parent module for lesson");
      return;
    }

    try {
      setIsSavingLesson(true);

      // Delete from backend first
      const backendResult = await deleteSingleCourseLesson(
        courseId,
        moduleId,
        lessonId
      );

      if (!backendResult.success) {
        const errorMessage =
          backendResult.error || "Failed to delete lesson from backend";
        console.error("Backend error deleting lesson:", errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Delete from local state
      const result = actions.deleteCourseLesson(moduleId, lessonId);

      if (result.error) {
        console.error("Lesson deletion error:", result.error);
        toast.error(result.error.message || "Failed to delete lesson");
        return;
      }

      // Remove from saved lessons
      setSavedLessons((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });

      // Save modules to localStorage after deletion
      setTimeout(() => {
        saveModulesToLocalStorage();
      }, 100);

      console.log("Lesson deleted successfully:", lessonId);
      toast.success("Lesson deleted successfully!");
    } catch (error) {
      console.error("Error deleting lesson:", error);
      let errorMessage = "Failed to delete lesson. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSavingLesson(false);
    }
  };

  // Helper function to find the location of content by content ID
  // Helper function to find lesson location
  const findLessonLocation = (lessonId: string) => {
    for (let moduleIndex = 0; moduleIndex < (state.course.modules || []).length; moduleIndex++) {
      const module = state.course.modules![moduleIndex];
      const lesson = module.lessons?.find((l) => l._id === lessonId);
      if (lesson) {
        return {
          moduleId: module._id!,
          lessonId: lesson._id!,
          moduleIndex,
          lessonIndex: module.lessons!.indexOf(lesson),
        };
      }
    }
    return null;
  };

  const findContentLocation = (
    contentId: string
  ): { moduleId: string; lessonId: string } | undefined => {
    for (const courseModule of state.course.modules || []) {
      for (const lesson of courseModule.lessons || []) {
        if (lesson.contents?.some((content) => content._id === contentId)) {
          return { moduleId: courseModule._id!, lessonId: lesson._id! };
        }
      }
    }
    return undefined;
  };

  // Helper function to handle thumbnail upload
  const handleThumbnailUpload = async (
    moduleId: string,
    file: File,
    folderName: string,
    options?: { usePresignedUrl?: boolean; presignedUrlThresholdMb?: number }
  ): Promise<string> => {
    try {
      console.log(
        "Uploading thumbnail for module:",
        moduleId,
        "File:",
        file,
        "Folder:",
        folderName
      );

      const uploadResponse = await uploadWithPresignedUrl(file, folderName);
      if (uploadResponse.success && uploadResponse.data?.url) {
        const uploadedUrl = uploadResponse.data.url;
        console.log("Upload successful, URL:", uploadedUrl);
        console.log("Upload response data:", uploadResponse.data);

        updateModuleData(moduleId, {
          thumbnailUrl: uploadedUrl,
          thumbnailSource: "upload",
        });

        console.log("Module data updated with thumbnail URL");

        // Check if the state was updated
        setTimeout(() => {
          const updatedModule = state.course.modules?.find(
            (m) => m._id === moduleId
          );
          console.log("Module after update:", updatedModule);
          console.log(
            "Module thumbnail URL after update:",
            updatedModule?.thumbnailUrl
          );
        }, 100);

        return uploadedUrl;
      } else {
        console.error("Upload failed:", uploadResponse.error);
        throw new Error(uploadResponse.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload thumbnail. Please try again.");
      throw error;
    }
  };

  // Helper function to handle thumbnail URL submission
  const handleThumbnailUrlSubmit = (moduleId: string, url: string) => {
    updateModuleData(moduleId, {
      thumbnailUrl: url,
      thumbnailSource: "url",
    });
  };

  // Helper function to handle thumbnail removal
  const handleThumbnailRemove = (moduleId: string) => {
    updateModuleData(moduleId, {
      thumbnailUrl: "",
      thumbnailSource: undefined,
    });
  };

  // Helper function to save a module (sequential flow)
  const saveModule = useCallback(
    async (index: number) => {
      const courseId = localStorage.getItem("current_course_id");
      const courseModule = state.course.modules?.[index];

      if (!courseId) {
        toast.error("Course ID not found. Please restart course editing.");
        return;
      }

      if (!courseModule) {
        toast.error("Module not found.");
        return;
      }

      // Check if module is complete
      const isComplete = isModuleComplete(courseModule);
      if (!isComplete) {
        toast.error("Please complete all required fields before saving.");
        return;
      }

      try {
        setIsSavingModule(true);

        // Check if this is a new module (not yet saved to backend)
        // A module is "new" if it doesn't have a MongoDB ID (starts with "temp_")
        const isNewModule =
          courseModule._id?.startsWith("temp_") || !savedModules.has(index);

        let backendResult;
        const moduleData = {
          title: courseModule.title,
          description: courseModule.description,
          thumbnailUrl: courseModule.thumbnailUrl,
          isActive: courseModule.isActive,
          isCompleted: courseModule.isCompleted,
        };

        if (isNewModule) {
          // Add new module to backend (let MongoDB generate the ID)
          backendResult = await addSingleCourseModule(courseId, moduleData);
        } else {
          // Update existing module in backend - use the real MongoDB ID
          backendResult = await updateSingleCourseModule(
            courseId,
            courseModule._id!,
            moduleData
          );
        }

        if (!backendResult.success) {
          const errorMessage =
            backendResult.error || "Failed to save module to backend";
          console.error("Backend error saving module:", errorMessage);
          toast.error(errorMessage);
          return;
        }

        // Update local module with backend ID if it's a new module
        if (isNewModule && backendResult.data?.module?._id) {
          // Update the module in local state with the real MongoDB ID
          const updatedModule = {
            ...courseModule,
            _id: backendResult.data.module._id,
          };

          // Replace the module in the modules array
          const updatedModules = (state.course.modules || []).map(
            (module, idx) => (idx === index ? updatedModule : module)
          );
          actions.updateCourseField("modules", updatedModules);

          // The courseReducerProvider will automatically save to localStorage
          // when the course state changes, so the MongoDB ID will be persisted
          console.log(
            "Updated module with MongoDB ID:",
            backendResult.data.module._id
          );
        }

        // Mark module as saved
        setSavedModules((prev) => new Set([...prev, index]));
        setModifiedModules((prev) => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
        setExpandedModules((prev) => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });

        // Save modules to localStorage after saving
        setTimeout(() => {
          saveModulesToLocalStorage();
        }, 100);

        console.log("Module saved successfully:", courseModule._id);
        toast.success("Module saved successfully!");
      } catch (error) {
        console.error("Error saving module:", error);
        let errorMessage = "Failed to save module. Please try again.";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
      } finally {
        setIsSavingModule(false);
      }
    },
    [savedModules, addSingleCourseModule, updateSingleCourseModule, actions]
  );

  // Helper function to remove a module
  const removeModule = async (index: number) => {
    const courseId = localStorage.getItem("current_course_id");
    const currentModules = state.course.modules || [];
    const moduleToDelete = currentModules[index];

    // Check if the module exists and has content
    if (!moduleToDelete || Object.keys(moduleToDelete).length === 0) {
      console.error("Module not found or empty at index:", index);
      console.error(
        "Available modules:",
        currentModules.map((m, i) => ({ index: i, module: m }))
      );
      toast.error("Module not found. Please refresh and try again.");
      return;
    }

    // Check if module has an ID
    if (!moduleToDelete._id) {
      console.error(
        "Module ID not found for deletion. Module:",
        moduleToDelete
      );
      console.error("Module keys:", Object.keys(moduleToDelete));

      // If no ID, we can still remove it by index from the array
      // This is a fallback for modules that might not have been properly saved
      const updatedModules = currentModules.filter((_, i) => i !== index);

      const result = actions.setCourseModules(updatedModules);

      if (result.error) {
        console.error("Error setting modules:", result.error);
        toast.error("Failed to remove module. Please try again.");
        return;
      }

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

      toast.success("Module removed successfully!");
      return;
    }

    try {
      // Delete from backend first
      if (courseId) {
        const backendResult = await deleteSingleCourseModule(
          courseId,
          moduleToDelete._id
        );

        if (!backendResult.success) {
          toast.error(
            backendResult.error || "Failed to delete module from backend"
          );
          return;
        }
      }

      // Delete from local state
      const result = actions.deleteCourseModule(moduleToDelete._id);

      if (result.error) {
        console.error("Module deletion error:", result.error);
        toast.error(result.error.message || "Failed to delete module");
        return;
      }

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

      // Save modules to localStorage after deletion
      setTimeout(() => {
        saveModulesToLocalStorage();
      }, 100);

      toast.success("Module deleted successfully!");
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("Failed to delete module. Please try again.");
    }
  };

  // Form validation
  const isFormValid = state.course.title.trim() !== "";

  // Show global loading overlay when any backend operation is in progress
  if (isBackendLoading) {
    return (
      <Container
        title="Course Modules & Content"
        description="Loading course data..."
        className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      >
        <div className="flex-1 flex items-center justify-center">
          <FullScreenLoader
            text="Loading course data..."
            variant="spinner"
            size="lg"
          />
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Course Modules & Content"
      description="Create and organize your course modules, lessons, and content"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col relative"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Global Loading Overlay */}
      {isBackendLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <InlineLoader size="md" variant="spinner" className="text-gray-600" />
        </div>
      )}
      {/* Course Editing Info */}
      {!isCourseLoaded && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Course Not Loaded
              </h3>
              <p className="text-sm text-gray-600">
                Please go back and load a course to edit its modules and
                content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Feedback */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-medium mb-2 text-blue-800">
            Please complete the following:
          </div>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            {validationErrors.map((error, index) => (
              <li key={`error-${index}`} className="text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modules Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Course Modules
              </h3>
              <p className="text-sm text-gray-600">
                Organize your course content into structured modules
              </p>
            </div>
          </div>
          <OrangeButton
            onClick={addModule}
            disabled={isBackendLoading}
            className="flex items-center gap-2 px-4 py-2"
          >
            {isBackendLoading ? (
              <InlineLoader size="sm" variant="spinner" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isBackendLoading ? "Adding..." : "Add Module"}
          </OrangeButton>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {(state.course.modules || []).map((courseModule, moduleIndex) => {
            if (!courseModule) return null;
            const isSaved = savedModules.has(moduleIndex);
            const isExpanded = expandedModules.has(moduleIndex);
            const isComplete = isModuleComplete(courseModule);

            return (
              <div
                key={courseModule._id || `module-${moduleIndex}`}
                className="bg-white rounded-lg border border-blue-200 overflow-hidden"
              >
                {/* Module Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => toggleModuleExpansion(moduleIndex)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isComplete ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      ></div>
                    </div>
                    <h4 className="font-medium text-gray-800">
                      {courseModule.title || `Module ${moduleIndex + 1}`}
                    </h4>
                    {!isSaved && !courseModule.title && (
                      <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                        New - Ready to Edit
                      </span>
                    )}
                    {isSavingModule && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                        <InlineLoader size="sm" variant="spinner" />
                        Saving...
                      </span>
                    )}
                    {isSaved && !isSavingModule && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        Saved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {(courseModule.lessons || []).length} lessons
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Module Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-blue-100">
                    <FlexBox className="flex-col gap-4">
                      {/* Module Basic Info */}
                      <div className="grid grid-cols-1 gap-4">
                        <Input
                          label="Module Title"
                          placeholder="e.g., Introduction to React"
                          value={courseModule.title}
                          onChange={(e) => {
                            updateModuleData(courseModule._id!, {
                              title: e.target.value,
                            });
                          }}
                          required
                        />
                      </div>

                      <TextArea
                        label="Module Description"
                        placeholder="Describe what students will learn in this module"
                        value={courseModule.description || ""}
                        onChange={(e) => {
                          updateModuleData(courseModule._id!, {
                            description: e.target.value,
                          });
                        }}
                        rows={3}
                        lockHeight
                        required
                      />

                      {/* Module Thumbnail Upload */}
                      <UploadMediaContainer
                        title="Module Thumbnail"
                        description="Upload a thumbnail image for this module"
                        type="image"
                        mediaUrl={courseModule.thumbnailUrl}
                        mediaSource={courseModule.thumbnailSource}
                        maxSize={10} // 10MB
                        acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
                        onFileUpload={(file, folderName) =>
                          handleThumbnailUpload(
                            courseModule._id!,
                            file,
                            folderName
                          )
                        }
                        onFileRemove={() =>
                          handleThumbnailRemove(courseModule._id!)
                        }
                        onUrlSubmit={(url) =>
                          handleThumbnailUrlSubmit(courseModule._id!, url)
                        }
                        isUploading={isUploading}
                        required={true}
                        allowUrlInput={true}
                        folderName={`courses/${
                          state.course.title || "untitled"
                        }/modules`}
                        uploadContext={`module-${moduleIndex + 1}`}
                        className="w-full"
                      />

                      {/* Module Settings */}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={courseModule.isActive}
                            onChange={(e) => {
                              updateModuleData(courseModule._id!, {
                                isActive: e.target.checked,
                              });
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">
                            Module Active
                          </span>
                        </label>
                      </div>

                      {/* Lessons Section */}
                      <div className="border-t border-blue-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800">Lessons</h5>
                          <OrangeButton
                            onClick={() => addLesson(moduleIndex)}
                            disabled={
                              !savedModules.has(moduleIndex) || isSavingLesson
                            }
                            className="flex items-center gap-2 px-3 py-1 text-sm"
                          >
                            {isSavingLesson ? (
                              <InlineLoader size="sm" variant="spinner" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                            {isSavingLesson
                              ? "Adding..."
                              : savedModules.has(moduleIndex)
                              ? "Add Lesson"
                              : "Save Module First"}
                          </OrangeButton>
                        </div>

                        {/* Lessons List */}
                        <div className="space-y-3 pl-4">
                          {(courseModule.lessons || []).map(
                            (lesson, lessonIndex) =>
                              lesson ? (
                                <LessonItem
                                  key={lesson._id!}
                                  lessonId={lesson._id!}
                                  lessonData={lesson}
                                  isExpanded={expandedLessons.has(lesson._id!)}
                                  onToggleExpansion={() =>
                                    toggleLessonExpansion(lesson._id!)
                                  }
                                  onUpdateLesson={updateLessonData}
                                  onAddContent={addContent}
                                  expandedContent={expandedContent}
                                  onToggleContentExpansion={
                                    toggleContentExpansion
                                  }
                                  onUpdateContent={updateContentData}
                                  onDeleteContent={deleteContentData}
                                  onDeleteLesson={deleteLessonData}
                                  onSaveLesson={saveLessonToAPI}
                                  onSaveContent={saveContentToAPI}
                                  courseTitle={state.course.title || "untitled"}
                                  moduleIndex={moduleIndex}
                                  lessonIndex={lessonIndex}
                                  isLessonSaved={savedLessons.has(lesson._id!)}
                                  isSavingLesson={isSavingLesson}
                                  isSavingContent={isSavingContent}
                                  modifiedModules={modifiedModules}
                                  savedContents={savedContents}
                                />
                              ) : null
                          )}

                          {(courseModule.lessons || []).length === 0 && (
                            <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                              <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No lessons added yet</p>
                              <p className="text-xs">
                                Click &quot;Add Lesson&quot; to get started
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Module Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-blue-100">
                        <button
                          onClick={() => removeModule(moduleIndex)}
                          className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Module
                        </button>

                        <div className="flex items-center gap-2">
                          <OrangeButton
                            onClick={() => saveModule(moduleIndex)}
                            disabled={
                              !canSaveModule(moduleIndex) || isSavingModule
                            }
                            className="flex items-center gap-2 px-4 py-2"
                          >
                            {isSavingModule ? (
                              <InlineLoader size="sm" variant="spinner" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {isSavingModule
                              ? "Saving..."
                              : savedModules.has(moduleIndex) &&
                                modifiedModules.has(moduleIndex)
                              ? "Update Module"
                              : savedModules.has(moduleIndex)
                              ? "Module Saved"
                              : "Save Module"}
                          </OrangeButton>
                        </div>
                      </div>
                    </FlexBox>
                  </div>
                )}

                {/* Collapsed Module View */}
                {!isExpanded && isSaved && (
                  <div className="p-4 border-t border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700 mb-1">
                          {courseModule.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {(courseModule.lessons || []).length} lessons
                          </span>
                          <span
                            className={
                              courseModule.isActive
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {courseModule.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleModuleExpansion(moduleIndex)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {(state.course.modules || []).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No modules added yet</p>
              <p className="text-sm">
                Click &quot;Add Module&quot; to get started
              </p>
            </div>
          )}
        </div>
      </div>

      <ScreenNavigation
        currentStep={11}
        previousScreen="screen10"
        nextScreen="screen12"
        nextButtonText="Review & Finalize"
        setActiveScreen={setActiveScreen}
        isNextDisabled={validationErrors.length > 0 || !isCourseLoaded}
      />
    </Container>
  );
};

// Lesson Item Component
interface LessonItemProps {
  lessonId: string;
  lessonData: CourseLesson;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onUpdateLesson: (lessonId: string, updates: Partial<CourseLesson>) => void;
  onAddContent: (lessonId: string, type: "video" | "quiz") => void;
  expandedContent: Set<string>;
  onToggleContentExpansion: (contentId: string) => void;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  onDeleteContent: (contentId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onSaveLesson: (lessonId: string) => void;
  onSaveContent: (contentId: string) => void;
  courseTitle?: string;
  moduleIndex?: number;
  lessonIndex?: number;
  // Sequential flow props
  isLessonSaved?: boolean;
  isSavingLesson?: boolean;
  isSavingContent?: boolean;
  modifiedModules?: Set<number>;
  savedContents?: Set<string>;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lessonId,
  lessonData,
  isExpanded,
  onToggleExpansion,
  onUpdateLesson,
  onAddContent,
  expandedContent,
  onToggleContentExpansion,
  onUpdateContent,
  onDeleteContent,
  onDeleteLesson,
  onSaveLesson,
  onSaveContent,
  courseTitle,
  moduleIndex,
  lessonIndex,
  isLessonSaved = false,
  isSavingLesson = false,
  isSavingContent = false,
  modifiedModules = new Set(),
  savedContents = new Set(),
}) => {
  const lesson = lessonData;
  
  // Check if this lesson is modified
  const isModified = moduleIndex !== undefined && modifiedModules.has(moduleIndex);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      {/* Lesson Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-3 h-3 text-gray-400" />
            <Play className="w-4 h-4 text-blue-500" />
          </div>
          <span className="font-medium text-gray-800">
            {lesson.title || "Untitled Lesson"}
          </span>
          {!isLessonSaved && !lesson.title && (
            <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
              New - Ready to Edit
            </span>
          )}
          {isModified && lesson.title && (
            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
              Modified
            </span>
          )}
          {isLessonSaved && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {(lesson.contents || []).length} items
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteLesson(lessonId);
            }}
            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
            title="Delete Lesson"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Lesson Content */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-200">
          <div className="space-y-3">
            <Input
              label="Lesson Title"
              placeholder="e.g., Getting Started with React"
              value={lesson.title}
              onChange={(e) => {
                onUpdateLesson(lessonId, { title: e.target.value });
              }}
              required
            />

            <TextArea
              label="Lesson Description"
              placeholder="Describe what students will learn in this lesson"
              value={lesson.description || ""}
              onChange={(e) => {
                onUpdateLesson(lessonId, { description: e.target.value });
              }}
              rows={2}
              lockHeight
            />

            {/* Content Section */}
            <ContentSection
              lessonId={lessonId}
              contents={lesson.contents || []}
              expandedContent={expandedContent}
              onToggleContentExpansion={onToggleContentExpansion}
              onUpdateContent={onUpdateContent}
              onAddContent={onAddContent}
              onDeleteContent={onDeleteContent}
              onSaveContent={onSaveContent}
              courseTitle={courseTitle}
              moduleIndex={moduleIndex}
              lessonIndex={lessonIndex}
              isLessonSaved={isLessonSaved}
              isSavingContent={isSavingContent}
              savedContents={savedContents}
            />

            {/* Lesson Action Buttons */}
            <div className="flex items-center justify-end pt-3 border-t border-gray-200">
              <OrangeButton
                onClick={() => onSaveLesson(lessonId)}
                disabled={!lesson.title || isSavingLesson}
                className="flex items-center gap-2 px-4 py-2"
              >
                {isSavingLesson ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isLessonSaved ? "Update Lesson" : "Save Lesson"}
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screen11;
