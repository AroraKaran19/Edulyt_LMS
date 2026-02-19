"use client";
import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Play,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileVideo,
  HelpCircle,
  FileText,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import { useUpload } from "@/hooks/useUpload";
import { getVideoDuration, formatDuration } from "@/lib/utils/videoUtils";
import {
  CourseModule,
  CourseLesson,
  Content,
  VideoContent,
  QuizContent,
  DocumentContent,
} from "@/types/course";
import { useCourseFormContext } from "@/contexts/CourseFormContext";
import { useFormContext } from "react-hook-form";
import { CourseFormData } from "@/types/courseForm";
import { useCourse } from "@/hooks/useCourse";
import {
  getModulesStorageKey,
  saveModulesToStorage,
  loadModulesFromStorage,
} from "@/lib/courseFormUtils";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";

const Screen11 = () => {
  const { isEditMode, courseId, getCreatedCourseId } = useCourseFormContext();
  const { watch } = useFormContext<CourseFormData>();

  // State to track the effective course ID
  const [effectiveCourseId, setEffectiveCourseId] = useState<string | null>(
    null
  );

  // Update effective course ID when mode or courseId changes
  useEffect(() => {
    if (isEditMode) {
      setEffectiveCourseId(courseId || null);
    } else {
      // Use the getCreatedCourseId function from context
      const createdCourseId = getCreatedCourseId();
      setEffectiveCourseId(createdCourseId);
    }
  }, [isEditMode, courseId, getCreatedCourseId]);

  // Also check localStorage on component mount and when storage changes
  useEffect(() => {
    if (!isEditMode) {
      const checkLocalStorage = () => {
        const createdCourseId = getCreatedCourseId();
        if (createdCourseId && createdCourseId !== effectiveCourseId) {
          setEffectiveCourseId(createdCourseId);
        }
      };

      // Listen for storage changes (when localStorage is updated from other tabs/components)
      window.addEventListener("storage", checkLocalStorage);

      return () => {
        window.removeEventListener("storage", checkLocalStorage);
      };
    }
  }, [isEditMode, effectiveCourseId, getCreatedCourseId]);

  // Get modules storage key using the utility function
  const modulesStorageKey = getModulesStorageKey(
    isEditMode ? "edit" : "create",
    courseId,
    effectiveCourseId || undefined
  );

  const titleValue = watch("title");

  const [modulesFolderName, setModulesFolderName] = useState(
    "courses/new_course/modules"
  );
  const [contentFolderName, setContentFolderName] = useState(
    "courses/new_course/content"
  );

  useEffect(() => {
    if (titleValue) {
      const baseFolder = titleValue.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      setModulesFolderName(`courses/${baseFolder}/modules`);
      setContentFolderName(`courses/${baseFolder}/content`);
    }
  }, [titleValue]);

  const { uploadFile } = useUpload();
  const {
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
    createContent,
    updateContent,
    deleteContent,
    getAdminCourseById,
    reorderModules,
    reorderLessons,
    reorderContent,
    isLoading: isApiLoading,
  } = useCourse();

  // LocalStorage helper functions - now using centralized utilities
  const saveModulesToLocalStorage = (modules: CourseModule[]) => {
    saveModulesToStorage(
      modules,
      isEditMode ? "edit" : "create",
      courseId,
      effectiveCourseId || undefined
    );
  };

  const loadModulesFromLocalStorage = (): CourseModule[] => {
    return loadModulesFromStorage(
      isEditMode ? "edit" : "create",
      courseId,
      effectiveCourseId || undefined
    );
  };

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);

  // Load modules from course data or localStorage
  useEffect(() => {
    const loadModules = async () => {
      setIsLoadingModules(true);

      try {
        if (isEditMode && effectiveCourseId) {
          // In edit mode, always fetch from API to ensure we have the latest data
          try {
            const courseData = await getAdminCourseById(effectiveCourseId);
            
            if (courseData?.modules && Array.isArray(courseData.modules) && courseData.modules.length > 0) {
              initializeModulesFromCourseData(courseData);
            } else {
              // If API returns no modules, try localStorage as fallback
              const storedModules = loadModulesFromLocalStorage();
              if (storedModules.length > 0) {
                setModules(storedModules);
              } else {
                setModules([]);
              }
            }
          } catch (apiError) {
            console.error("Screen11: Error fetching course data:", apiError);
            // Try localStorage as fallback
            const storedModules = loadModulesFromLocalStorage();
            if (storedModules.length > 0) {
              setModules(storedModules);
            } else {
              setModules([]);
            }
          }
        } else {
          // In create mode, load from localStorage
          const storedModules = loadModulesFromLocalStorage();
          setModules(storedModules);
        }
      } catch (error) {
        console.error("Screen11: Error loading modules:", error);
        setModules([]);
      } finally {
        setIsLoadingModules(false);
      }
    };

    loadModules();
  }, [isEditMode, effectiveCourseId, modulesStorageKey, getAdminCourseById]);

  // Save modules to localStorage whenever modules change
  useEffect(() => {
    if (typeof window !== "undefined" && modules.length > 0) {
      saveModulesToLocalStorage(modules);
    }
  }, [modules, modulesStorageKey]);

  // Helper function to transform content with active status
  const transformContentWithActiveStatus = (
    content: any,
    deactivatedContents: string[]
  ) => {
    const isContentActive = !deactivatedContents.includes(content._id);
    return {
      ...content,
      isActive: isContentActive,
    };
  };

  // Helper function to transform lesson with active status
  const transformLessonWithActiveStatus = (
    lesson: any,
    deactivatedLessons: string[],
    deactivatedContents: string[]
  ) => {
    const isLessonActive = !deactivatedLessons.includes(lesson._id);
    const transformedContents = (lesson.contents || []).map((content: any) =>
      transformContentWithActiveStatus(content, deactivatedContents)
    );

    return {
      ...lesson,
      isActive: isLessonActive,
      contents: transformedContents,
    };
  };

  // Helper function to transform module with active status
  const transformModuleWithActiveStatus = (
    selectedModule: any,
    deactivatedModules: string[],
    deactivatedLessons: string[],
    deactivatedContents: string[]
  ) => {
    const isModuleActive = !deactivatedModules.includes(selectedModule._id);
    const transformedLessons = (selectedModule.lessons || []).map((lesson: any) =>
      transformLessonWithActiveStatus(lesson, deactivatedLessons, deactivatedContents)
    );

    return {
      _id: selectedModule._id,
      title: selectedModule.title,
      description: selectedModule.description,
      thumbnailUrl: selectedModule.thumbnailUrl,
      thumbnailSource: selectedModule.thumbnailSource || "url",
      thumbnailS3Key: selectedModule.thumbnailS3Key || "",
      lessonIds: selectedModule.lessonIds || [],
      isCompleted: selectedModule.isCompleted || false,
      isActive: isModuleActive,
      isLocked: selectedModule.isLocked || false,
      lessons: transformedLessons,
    };
  };

  // Function to initialize modules from course data
  const initializeModulesFromCourseData = (courseData: any) => {
    if (courseData?.modules && Array.isArray(courseData.modules)) {
      const deactivatedModules = courseData.deactivatedModules || [];
      const deactivatedLessons = courseData.deactivatedLessons || [];
      const deactivatedContents = courseData.deactivatedContents || [];

      const transformedModules: CourseModule[] = courseData.modules.map(
        (selectedModule: any) =>
          transformModuleWithActiveStatus(
            selectedModule,
            deactivatedModules,
            deactivatedLessons,
            deactivatedContents
          )
      );

      setModules(transformedModules);
      saveModulesToLocalStorage(transformedModules);
    }
  };

  // Listen for course data changes from parent component
  useEffect(() => {
    // This will be called when course data is available
    // The parent component should pass course data through context or props
  }, []);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set()
  );
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  
  // Support multiple lesson forms - each form has unique id and moduleId so user can open several at once
  const [openLessonForms, setOpenLessonForms] = useState<Array<{ id: string; moduleId: string }>>([]);
  const [editingLessonIds, setEditingLessonIds] = useState<Set<string>>(new Set());
  
  // Support multiple content forms per lesson - each form has unique id, lessonId, and type
  const [openContentForms, setOpenContentForms] = useState<Array<{ id: string; lessonId: string; type: "video" | "quiz" | "document" }>>([]);
  const [editingContentIds, setEditingContentIds] = useState<Set<string>>(new Set());
  
  // Track uploads per form/content to enable parallel uploads
  const [uploadingVideoForms, setUploadingVideoForms] = useState<Set<string>>(new Set());
  const [uploadingVideoThumbnailForms, setUploadingVideoThumbnailForms] = useState<Set<string>>(new Set());
  const [uploadingDocumentForms, setUploadingDocumentForms] = useState<Set<string>>(new Set());
  const [extractingDurationForms, setExtractingDurationForms] = useState<Set<string>>(new Set());
  const [isUploadingModuleThumbnail, setIsUploadingModuleThumbnail] =
    useState(false);
  
  // Drag and drop state
  const [draggedModuleIndex, setDraggedModuleIndex] = useState<number | null>(null);
  const [dragOverModuleIndex, setDragOverModuleIndex] = useState<number | null>(null);
  const [draggedLessonIndex, setDraggedLessonIndex] = useState<number | null>(null);
  const [dragOverLessonIndex, setDragOverLessonIndex] = useState<number | null>(null);
  const [draggedContentIndex, setDraggedContentIndex] = useState<number | null>(null);
  const [dragOverContentIndex, setDragOverContentIndex] = useState<number | null>(null);
  
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    thumbnailSource: "url" as "upload" | "url",
    thumbnailS3Key: "",
    isActive: true,
  });
  // Store lesson form data per form ID (allows multiple forms per module)
  const [newLessonData, setNewLessonData] = useState<Map<string, {
    title: string;
    description: string;
    isActive: boolean;
  }>>(new Map());
  
  // Store editing lesson data per lesson ID
  const [editingLessonData, setEditingLessonData] = useState<Map<string, {
    _id: string;
    title: string;
    description: string;
    isActive: boolean;
  }>>(new Map());
  // Store content form data per lesson ID
  const [newContentData, setNewContentData] = useState<Map<string, {
    title: string;
    description: string;
    type: "video" | "quiz" | "document";
    videoUrl: string;
    videoSource: "upload" | "url";
    videoS3Key: string;
    videoThumbnailUrl: string;
    videoThumbnailSource: "upload" | "url";
    videoThumbnailS3Key: string;
    videoDuration: string;
    documentUrl: string;
    documentSource: "upload" | "url";
    documentS3Key: string;
    isActive: boolean;
  }>>(new Map());
  const [editingModule, setEditingModule] = useState({
    _id: "",
    title: "",
    description: "",
    thumbnailUrl: "",
    thumbnailSource: "url" as "upload" | "url",
    thumbnailS3Key: "",
    isActive: true,
  });
  // Store editing content data per content ID
  const [editingContentData, setEditingContentData] = useState<Map<string, {
    _id: string;
    title: string;
    description: string;
    type: "video" | "quiz" | "document";
    videoUrl: string;
    videoSource: "upload" | "url";
    videoS3Key: string;
    videoThumbnailUrl: string;
    videoThumbnailSource: "upload" | "url";
    videoThumbnailS3Key: string;
    videoDuration: string;
    documentUrl: string;
    documentSource: "upload" | "url";
    documentS3Key: string;
    isActive: boolean;
  }>>(new Map());

  // Helper: update content form data by form id (allows multiple forms per lesson)
  const updateNewContentData = (formId: string, updates: Partial<typeof newContentData extends Map<string, infer T> ? T : never>) => {
    const currentData = newContentData.get(formId);
    if (currentData) {
      const newData = new Map(newContentData);
      newData.set(formId, { ...currentData, ...updates });
      setNewContentData(newData);
    }
  };

  const updateEditingContentData = (contentId: string, updates: Partial<typeof editingContentData extends Map<string, infer T> ? T : never>) => {
    const currentData = editingContentData.get(contentId);
    if (currentData) {
      const newData = new Map(editingContentData);
      newData.set(contentId, { ...currentData, ...updates });
      setEditingContentData(newData);
    }
  };

  const toggleModuleExpansion = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleLessonExpansion = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  // Toggle module active status for this course
  const toggleModuleActive = async (moduleId: string) => {
    if (!effectiveCourseId) {
      toast.error("Course ID is required");
      return;
    }

    try {
      const module = modules.find((m) => m._id === moduleId);
      if (!module) return;

      const newActiveStatus = !module.isActive;

      // Call the new API endpoint to toggle per-course status
      await apiClient.put(
        `/courses/${effectiveCourseId}/toggle-content-status`,
        {
          contentType: "module",
          contentId: moduleId,
        }
      );

      // Update local state
      const updatedModules = modules.map((m) =>
        m._id === moduleId ? { ...m, isActive: newActiveStatus } : m
      );
      setModules(updatedModules);
      toast.success(
        `Module ${newActiveStatus ? "activated" : "deactivated"} for this course!`
      );
    } catch (error) {
      console.error("Error toggling module active status:", error);
      toast.error("Failed to update module status");
    }
  };

  // Toggle lesson active status for this course
  const toggleLessonActive = async (
    moduleId: string,
    lessonId: string
  ) => {
    if (!effectiveCourseId) {
      toast.error("Course ID is required");
      return;
    }

    try {
      const module = modules.find((m) => m._id === moduleId);
      if (!module) return;

      const lesson = (module.lessons as CourseLesson[])?.find(
        (l) => l._id === lessonId
      );
      if (!lesson) return;

      const newActiveStatus = !lesson.isActive;

      // Call the new API endpoint to toggle per-course status
      await apiClient.put(
        `/courses/${effectiveCourseId}/toggle-content-status`,
        {
          contentType: "lesson",
          contentId: lessonId,
        }
      );

      // Update local state
      const updatedModules = modules.map((m) =>
        m._id === moduleId
          ? {
              ...m,
              lessons: (m.lessons as CourseLesson[])?.map((l) =>
                l._id === lessonId ? { ...l, isActive: newActiveStatus } : l
              ),
            }
          : m
      );
      setModules(updatedModules);
      toast.success(
        `Lesson ${newActiveStatus ? "activated" : "deactivated"} for this course!`
      );
    } catch (error) {
      console.error("Error toggling lesson active status:", error);
      toast.error("Failed to update lesson status");
    }
  };

  // Helper to update content active status in module structure
  const updateContentActiveStatus = (
    modules: CourseModule[],
    moduleId: string,
    lessonId: string,
    contentId: string,
    newActiveStatus: boolean
  ) => {
    return modules.map((m) => {
      if (m._id !== moduleId) return m;

      const updatedLessons = (m.lessons as CourseLesson[])?.map((l) => {
        if (l._id !== lessonId) return l;

        const updatedContents = (l.contents as Content[])?.map((c) =>
          c._id === contentId ? { ...c, isActive: newActiveStatus } : c
        );

        return { ...l, contents: updatedContents };
      });

      return { ...m, lessons: updatedLessons };
    });
  };

  // Toggle content active status for this course
  const toggleContentActive = async (
    moduleId: string,
    lessonId: string,
    contentId: string
  ) => {
    if (!effectiveCourseId) {
      toast.error("Course ID is required");
      return;
    }

    try {
      const module = modules.find((m) => m._id === moduleId);
      if (!module) return;

      const lesson = (module.lessons as CourseLesson[])?.find(
        (l) => l._id === lessonId
      );
      if (!lesson) return;

      const content = (lesson.contents as Content[])?.find(
        (c) => c._id === contentId
      );
      if (!content) return;

      const newActiveStatus = !content.isActive;

      // Call the new API endpoint to toggle per-course status
      await apiClient.put(
        `/courses/${effectiveCourseId}/toggle-content-status`,
        {
          contentType: "content",
          contentId: contentId,
        }
      );

      // Update local state
      const updatedModules = updateContentActiveStatus(
        modules,
        moduleId,
        lessonId,
        contentId,
        newActiveStatus
      );
      setModules(updatedModules);
      toast.success(
        `Content ${newActiveStatus ? "activated" : "deactivated"} for this course!`
      );
    } catch (error) {
      console.error("Error toggling content active status:", error);
      toast.error("Failed to update content status");
    }
  };

  const addModule = async () => {
    if (!newModule.title.trim()) {
      toast.error("Module title is required");
      return;
    }

    if (!newModule.thumbnailUrl.trim()) {
      toast.error("Module thumbnail is required");
      return;
    }

    if (!effectiveCourseId) {
      console.error("addModule - courseId is missing:", effectiveCourseId);
      toast.error("Course ID is required to add a module");
      return;
    }

    try {
      // Prepare module data for API
      const moduleData = {
        courseId: effectiveCourseId,
        title: newModule.title,
        description: newModule.description,
        thumbnailUrl: newModule.thumbnailUrl,
        isActive: newModule.isActive,
      };

      // Make API call to create module
      const result = await createModule(moduleData);

      if (result) {
        const selectedModule: CourseModule = {
          _id: result._id,
          courseId: effectiveCourseId,
          title: result.title,
          description: result.description,
          thumbnailUrl: result.thumbnailUrl,
          lessons: result.lessons || [],
          isActive: result.isActive !== undefined ? result.isActive : true,
          order: modules.length, // Set order to the end
        };

        // Add module to local state
        const updatedModules = [...modules, selectedModule];
        setModules(updatedModules);

        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);

        // Reset form
        setNewModule({
          title: "",
          description: "",
          thumbnailUrl: "",
          thumbnailSource: "url",
          thumbnailS3Key: "",
          isActive: true,
        });
        setIsAddingModule(false);

        toast.success("Module created successfully!");
      } else {
        toast.error("Failed to create module");
      }
    } catch (error) {
      console.error("Error creating module:", error);
      toast.error("Error creating module");
    }
  };

  const editModule = async () => {
    if (!editingModule.title.trim()) {
      return;
    }

    if (!effectiveCourseId || !editingModule._id) {
      console.error("Course ID and Module ID are required to edit a module");
      return;
    }

    try {
      // Prepare module data for API
      const moduleData = {
        title: editingModule.title,
        description: editingModule.description,
        thumbnailUrl: editingModule.thumbnailUrl,
        isActive: editingModule.isActive,
      };

      // Make API call to update module
      const result = await updateModule(editingModule._id, {
        ...moduleData,
        courseId: effectiveCourseId,
      });

      if (result) {
        // Update module in local state
        const updatedModules = modules.map((selectedModule) =>
          selectedModule._id === editingModule._id
            ? {
                ...selectedModule,
                title: result.title,
                description: result.description,
                thumbnailUrl: result.thumbnailUrl,
                isActive:
                  result.isActive !== undefined ? result.isActive : true,
              }
            : selectedModule
        );
        setModules(updatedModules);

        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);

        // Reset form and close edit mode
        setEditingModule({
          _id: "",
          title: "",
          description: "",
          thumbnailUrl: "",
          thumbnailSource: "url",
          thumbnailS3Key: "",
          isActive: true,
        });
        setIsEditingModule(false);

        toast.success("Module updated successfully!");
      } else {
        toast.error("Failed to update module");
      }
    } catch (error) {
      console.error("Error updating module:", error);
      toast.error("Error updating module");
    }
  };

  const deleteModuleHandler = async (moduleId: string) => {
    if (!effectiveCourseId) {
      toast.error("Course ID is required to delete a module");
      return;
    }

    if (!moduleId) {
      toast.error("Module ID is required to delete a module");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this module? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Make API call to delete module
      const result = await deleteModule(effectiveCourseId!, moduleId);

      if (result) {
        // Remove module from local state
        const updatedModules = modules.filter(
          (selectedModule) => selectedModule._id !== moduleId
        );
        setModules(updatedModules);

        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);

        toast.success("Module deleted successfully");
      } else {
        toast.error("Failed to delete module");
      }
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("Error deleting module");
    }
  };

  const startEditingModule = (selectedModule: CourseModule) => {
    setEditingModule({
      _id: selectedModule._id || "",
      title: selectedModule.title || "",
      description: selectedModule.description || "",
      thumbnailUrl: selectedModule.thumbnailUrl || "",
      thumbnailSource: "url",
      thumbnailS3Key: "",
      isActive:
        selectedModule.isActive !== undefined ? selectedModule.isActive : true,
    });
    setIsEditingModule(true);
  };

  const addLesson = async (formId: string) => {
    const form = openLessonForms.find((f) => f.id === formId);
    if (!form) return;
    const moduleId = form.moduleId;
    const lessonData = newLessonData.get(formId);
    if (!lessonData || !lessonData.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    if (!effectiveCourseId) {
      toast.error("Course ID is required to create a lesson");
      return;
    }

    try {
      const lessonDataForApi = {
        moduleId,
        title: lessonData.title,
        description: lessonData.description,
        isActive: lessonData.isActive,
      };

      const result = await createLesson(effectiveCourseId!, lessonDataForApi);

      if (result) {
        const lesson: CourseLesson = {
          _id: result._id,
          title: result.title,
          description: result.description,
          moduleId,
          contents: [],
          order: ((modules.find(m => m._id === moduleId)?.lessons as CourseLesson[])?.length || 0),
          isActive: result.isActive !== undefined ? result.isActive : true,
        };

        const updatedModules = modules.map((m) =>
          m._id === moduleId
            ? { ...m, lessons: [...((m.lessons as CourseLesson[]) || []), lesson] }
            : m
        );
        setModules(updatedModules);
        saveModulesToLocalStorage(updatedModules);

        setOpenLessonForms((prev) => prev.filter((f) => f.id !== formId));
        setNewLessonData((prev) => {
          const next = new Map(prev);
          next.delete(formId);
          return next;
        });

        toast.success("Lesson created successfully!");
      } else {
        toast.error("Failed to create lesson");
      }
    } catch (error: any) {
      console.error("Error creating lesson:", error);
      toast.error(error?.response?.data?.message || "Error creating lesson");
    }
  };

  const editLesson = async (moduleId: string, lessonId: string) => {
    const lessonData = editingLessonData.get(lessonId);
    if (!lessonData || !lessonData.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    if (!lessonId) {
      toast.error("Lesson ID is required to edit a lesson");
      return;
    }

    try {
      const lessonDataForApi = {
        title: lessonData.title,
        description: lessonData.description,
      };

      // Make API call to update lesson
      const result = await updateLesson(
        effectiveCourseId!,
        moduleId,
        lessonId,
        lessonDataForApi
      );

      if (result) {
        // Update lesson in local state
        const updatedModules = modules.map((selectedModule) =>
          selectedModule._id === moduleId
            ? {
                ...selectedModule,
                lessons: (selectedModule.lessons as CourseLesson[])?.map(
                  (lesson) =>
                    lesson._id === lessonId
                      ? {
                          ...lesson,
                          title: result.title,
                          description: result.description,
                        }
                      : lesson
                ),
              }
            : selectedModule
        );
        setModules(updatedModules);

        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);

        // Clear this specific lesson edit form
        const newData = new Map(editingLessonData);
        newData.delete(lessonId);
        setEditingLessonData(newData);
        
        const newEditingSet = new Set(editingLessonIds);
        newEditingSet.delete(lessonId);
        setEditingLessonIds(newEditingSet);

        toast.success("Lesson updated successfully!");
      } else {
        toast.error("Failed to update lesson");
      }
    } catch (error) {
      console.error("Error updating lesson:", error);
      toast.error("Error updating lesson");
    }
  };

  const startEditingLesson = (lesson: CourseLesson) => {
    const lessonId = lesson._id || "";
    
    // Add to editing set
    const newEditingSet = new Set(editingLessonIds);
    newEditingSet.add(lessonId);
    setEditingLessonIds(newEditingSet);
    
    // Set lesson data
    const newData = new Map(editingLessonData);
    newData.set(lessonId, {
      _id: lessonId,
      title: lesson.title || "",
      description: lesson.description || "",
      isActive: true,
    });
    setEditingLessonData(newData);
  };

  const startAddingContent = (lessonId: string, type: "video" | "quiz" | "document") => {
    const formId = `content-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setOpenContentForms((prev) => [...prev, { id: formId, lessonId, type }]);
    setNewContentData((prev) =>
      new Map(prev).set(formId, {
        title: "",
        description: "",
        type,
        videoUrl: "",
        videoSource: "url",
        videoS3Key: "",
        videoThumbnailUrl: "",
        videoThumbnailSource: "url",
        videoThumbnailS3Key: "",
        videoDuration: "",
        documentUrl: "",
        documentSource: "url",
        documentS3Key: "",
        isActive: true,
      })
    );
  };

  const addContent = async (formId: string, moduleId: string) => {
    const form = openContentForms.find((f) => f.id === formId);
    if (!form) return;
    const lessonId = form.lessonId;
    const contentData = newContentData.get(formId);
    if (!contentData || !contentData.title.trim()) {
      toast.error("Content title is required");
      return;
    }

    let contentDataForApi: any;

    if (contentData.type === "video") {
      if (!contentData.videoUrl.trim()) {
        toast.error("Video is required for video content");
        return;
      }
      if (!contentData.videoDuration.trim()) {
        toast.error("Video duration is required for video content");
        return;
      }
      if (
        !contentData.videoDuration ||
        isNaN(Number(contentData.videoDuration)) ||
        Number(contentData.videoDuration) <= 0
      ) {
        toast.error(
          "Please enter a valid duration in seconds (e.g., 150 for 2 minutes 30 seconds)"
        );
        return;
      }
      contentDataForApi = {
        lessonId: lessonId,
        title: contentData.title,
        description: contentData.description,
        type: "video",
        sources: [
          {
            quality: "720p",
            videoUrl: contentData.videoUrl,
          },
        ],
        thumbnailUrl: contentData.videoThumbnailUrl,
        duration: Number(contentData.videoDuration),
        isActive: contentData.isActive,
      };
    } else if (contentData.type === "document") {
      if (!contentData.documentUrl.trim()) {
        toast.error("Document is required for document content");
        return;
      }
      contentDataForApi = {
        lessonId: lessonId,
        title: contentData.title,
        description: contentData.description,
        type: "document",
        documentUrl: contentData.documentUrl,
        isActive: contentData.isActive,
      };
    } else {
      // Quiz content
      contentDataForApi = {
        lessonId: lessonId,
        title: contentData.title,
        description: contentData.description,
        type: "quiz",
        questions: [],
        isActive: contentData.isActive,
      };
    }

    try {
      // Make API call to create content
      const result = await createContent(
        effectiveCourseId!,
        moduleId,
        contentDataForApi
      );

      if (result) {
        let content: Content;

        const currentLesson = modules
          .find(m => m._id === moduleId)?.lessons
          ?.find(l => (l as CourseLesson)._id === lessonId) as CourseLesson;
        const contentOrder = (currentLesson?.contents as Content[])?.length || 0;

        if (result.type === "video") {
          content = {
            _id: result._id,
            title: result.title,
            description: result.description,
            type: "video",
            sources: result.sources || [],
            thumbnailUrl: result.thumbnailUrl,
            duration: result.duration || 0,
            lessonId,
            order: contentOrder,
            isActive: result.isActive !== undefined ? result.isActive : true,
          } as VideoContent;
        } else if (result.type === "document") {
          content = {
            _id: result._id,
            title: result.title,
            description: result.description,
            type: "document",
            documentUrl: result.documentUrl,
            lessonId,
            order: contentOrder,
            isActive: result.isActive !== undefined ? result.isActive : true,
          } as DocumentContent;
        } else {
          content = {
            _id: result._id,
            title: result.title,
            description: result.description,
            type: "quiz",
            questions: result.questions || [],
            lessonId,
            order: contentOrder,
            isActive: result.isActive !== undefined ? result.isActive : true,
          } as QuizContent;
        }

        // Add content to local state
        const updatedModules = modules.map((selectedModule) =>
          selectedModule._id === moduleId
            ? {
                ...selectedModule,
                lessons: (selectedModule.lessons as CourseLesson[])?.map(
                  (lesson) =>
                    lesson._id === lessonId
                      ? {
                          ...lesson,
                          contents: [
                            ...((lesson.contents as Content[]) || []),
                            content,
                          ],
                        }
                      : lesson
                ),
              }
            : selectedModule
        );
        setModules(updatedModules);

        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);

        setOpenContentForms((prev) => prev.filter((f) => f.id !== formId));
        setNewContentData((prev) => {
          const next = new Map(prev);
          next.delete(formId);
          return next;
        });

        toast.success("Content created successfully!");
      } else {
        toast.error("Failed to create content");
      }
    } catch (error) {
      console.error("Error creating content:", error);
      toast.error("Error creating content");
    }
  };

  const deleteLessonHandler = async (moduleId: string, lessonId: string) => {
    if (!lessonId) {
      toast.error("Lesson ID is required to delete a lesson");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this lesson? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Make API call to delete lesson
      const result = await deleteLesson(effectiveCourseId!, moduleId, lessonId);

      if (result) {
        // Remove lesson from local state
        const updatedModules = modules.map((selectedModule) =>
          selectedModule._id === moduleId
            ? {
                ...selectedModule,
                lessons: (selectedModule.lessons as CourseLesson[])?.filter(
                  (lesson) => lesson._id !== lessonId
                ),
              }
            : selectedModule
        );
        setModules(updatedModules);

        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);

        toast.success("Lesson deleted successfully");
      } else {
        toast.error("Failed to delete lesson");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Error deleting lesson");
    }
  };

  const editContent = async (lessonId: string, moduleId: string, contentId: string) => {
    const contentData = editingContentData.get(contentId);
    if (!contentData || !contentData.title.trim()) {
      toast.error("Content title is required");
      return;
    }

    if (!contentId) {
      toast.error("Content ID is required to edit content");
      return;
    }

    let contentDataForApi: any;

    if (contentData.type === "video") {
      if (!contentData.videoUrl.trim()) {
        toast.error("Video is required for video content");
        return;
      }
      if (!contentData.videoDuration.trim()) {
        toast.error("Video duration is required for video content");
        return;
      }
      if (
        !contentData.videoDuration ||
        isNaN(Number(contentData.videoDuration)) ||
        Number(contentData.videoDuration) <= 0
      ) {
        toast.error(
          "Please enter a valid duration in seconds (e.g., 150 for 2 minutes 30 seconds)"
        );
        return;
      }
      contentDataForApi = {
        title: contentData.title,
        description: contentData.description,
        type: "video",
        sources: [
          {
            quality: "720p",
            videoUrl: contentData.videoUrl,
          },
        ],
        thumbnailUrl: contentData.videoThumbnailUrl,
        duration: Number(contentData.videoDuration),
      };
    } else if (contentData.type === "document") {
      if (!contentData.documentUrl.trim()) {
        toast.error("Document is required for document content");
        return;
      }
      contentDataForApi = {
        title: contentData.title,
        description: contentData.description,
        type: "document",
        documentUrl: contentData.documentUrl,
      };
    } else {
      // Quiz content
      contentDataForApi = {
        title: contentData.title,
        description: contentData.description,
        type: "quiz",
        questions: [],
      };
    }

    try {
      // Make API call to update content
      const result = await updateContent(
        effectiveCourseId!,
        moduleId,
        lessonId,
        contentId,
        contentDataForApi
      );

      if (result) {
        // Helper to update content in nested structure
        const updateContentInModules = (
          modules: CourseModule[],
          moduleId: string,
          lessonId: string,
          contentId: string,
          updatedData: any
        ) => {
          return modules.map((selectedModule) => {
            if (selectedModule._id !== moduleId) return selectedModule;

            const updatedLessons = (selectedModule.lessons as CourseLesson[])?.map(
              (lesson) => {
                if (lesson._id !== lessonId) return lesson;

                const updatedContents = (lesson.contents as Content[])?.map(
                  (content) => {
                    if (content._id !== contentId) return content;

                    return {
                      ...content,
                      title: updatedData.title,
                      description: updatedData.description,
                      ...(updatedData.type === "video" && {
                        sources: updatedData.sources || [],
                        thumbnailUrl: updatedData.thumbnailUrl,
                      }),
                      ...(updatedData.type === "document" && {
                        documentUrl: updatedData.documentUrl,
                      }),
                      ...(updatedData.type === "quiz" && {
                        questions: updatedData.questions || [],
                      }),
                    };
                  }
                );

                return { ...lesson, contents: updatedContents };
              }
            );

            return { ...selectedModule, lessons: updatedLessons };
          });
        };

        // Update content in local state
        const updatedModules = updateContentInModules(
          modules,
          moduleId,
          lessonId,
          contentId,
          result
        );
        setModules(updatedModules);

        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);

        // Clear this specific content edit form
        const newData = new Map(editingContentData);
        newData.delete(contentId);
        setEditingContentData(newData);
        
        const newEditingSet = new Set(editingContentIds);
        newEditingSet.delete(contentId);
        setEditingContentIds(newEditingSet);

        toast.success("Content updated successfully!");
      } else {
        toast.error("Failed to update content");
      }
    } catch (error) {
      console.error("Error updating content:", error);
      toast.error("Error updating content");
    }
  };

  const startEditingContent = (content: Content) => {
    const contentId = content._id || "";
    
    // Add to editing set
    const newEditingSet = new Set(editingContentIds);
    newEditingSet.add(contentId);
    setEditingContentIds(newEditingSet);
    
    // Set content data
    const newData = new Map(editingContentData);
    newData.set(contentId, {
      _id: contentId,
      title: content.title || "",
      description: content.description || "",
      type: content.type || "video",
      videoUrl: (content as VideoContent).sources?.[0]?.videoUrl || "",
      videoSource: "url",
      videoS3Key: "",
      videoThumbnailUrl: (content as VideoContent).thumbnailUrl || "",
      videoThumbnailSource: "url",
      videoThumbnailS3Key: "",
      videoDuration: (content as VideoContent).duration
        ? (content as VideoContent).duration!.toString()
        : "",
      documentUrl: (content as DocumentContent).documentUrl || "",
      documentSource: "url",
      documentS3Key: "",
      isActive: true,
    });
    setEditingContentData(newData);
  };

  const deleteContentHandler = async (
    moduleId: string,
    lessonId: string,
    contentId: string
  ) => {
    if (
      !confirm(
        "Are you sure you want to delete this content? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Make API call to delete content
      const result = await deleteContent(
        effectiveCourseId!,
        moduleId,
        lessonId,
        contentId
      );

      if (result) {
        // Helper to remove content from nested structure
        const removeContentFromModules = (
          modules: CourseModule[],
          moduleId: string,
          lessonId: string,
          contentId: string
        ) => {
          return modules.map((selectedModule) => {
            if (selectedModule._id !== moduleId) return selectedModule;

            const updatedLessons = (selectedModule.lessons as CourseLesson[])?.map(
              (lesson) => {
                if (lesson._id !== lessonId) return lesson;

                const filteredContents = (lesson.contents as Content[])?.filter(
                  (content) => content._id !== contentId
                );

                return { ...lesson, contents: filteredContents };
              }
            );

            return { ...selectedModule, lessons: updatedLessons };
          });
        };

        // Remove content from local state
        const updatedModules = removeContentFromModules(
          modules,
          moduleId,
          lessonId,
          contentId
        );
        setModules(updatedModules);

        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);

        toast.success("Content deleted successfully");
      } else {
        toast.error("Failed to delete content");
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Error deleting content");
    }
  };

  // Upload handlers
  const handleModuleThumbnailUpload = async (
    file: File,
    folderName: string
  ) => {
    setIsUploadingModuleThumbnail(true);
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setNewModule((prev) => ({
          ...prev,
          thumbnailUrl: result.data!.url,
          thumbnailSource: "upload",
          thumbnailS3Key: result.data!.s3Key,
        }));
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Error uploading module thumbnail:", error);
      throw error;
    } finally {
      setIsUploadingModuleThumbnail(false);
    }
  };

  const handleModuleThumbnailRemove = () => {
    setNewModule((prev) => ({
      ...prev,
      thumbnailUrl: "",
      thumbnailSource: "url",
      thumbnailS3Key: "",
    }));
  };

  const handleModuleThumbnailUrlSubmit = (url: string) => {
    setNewModule((prev) => ({
      ...prev,
      thumbnailUrl: url,
      thumbnailSource: "url",
      thumbnailS3Key: "",
    }));
  };

  type UploadContext = { lessonId?: string; contentId?: string; contentFormId?: string };
  const [currentUploadContext, setCurrentUploadContext] = useState<UploadContext | null>(null);

  const handleContentVideoUpload = async (file: File, folderName: string, context?: UploadContext) => {
    const ctx = context || currentUploadContext;
    const formKey = ctx?.contentFormId || ctx?.contentId || 'default';
    
    setUploadingVideoForms((prev) => new Set(prev).add(formKey));
    setExtractingDurationForms((prev) => new Set(prev).add(formKey));
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        try {
          const duration = await getVideoDuration(file);
          const updates = {
            videoUrl: result.data!.url,
            videoSource: "upload" as const,
            videoS3Key: result.data!.s3Key,
            videoDuration: duration.toString(),
          };
          if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, updates);
          else if (ctx?.contentId) updateEditingContentData(ctx.contentId, updates);
        } catch (durationError) {
          console.error("Error extracting video duration:", durationError);
          const updates = {
            videoUrl: result.data!.url,
            videoSource: "upload" as const,
            videoS3Key: result.data!.s3Key,
          };
          if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, updates);
          else if (ctx?.contentId) updateEditingContentData(ctx.contentId, updates);
          toast.warning("Video uploaded but duration could not be extracted. Please enter duration manually.");
        }
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Error uploading content video:", error);
      throw error;
    } finally {
      setUploadingVideoForms((prev) => {
        const next = new Set(prev);
        next.delete(formKey);
        return next;
      });
      setExtractingDurationForms((prev) => {
        const next = new Set(prev);
        next.delete(formKey);
        return next;
      });
    }
  };

  const handleContentVideoRemove = (context?: UploadContext) => {
    const ctx = context || currentUploadContext;
    const clear = { videoUrl: "", videoSource: "url" as const, videoS3Key: "", videoDuration: "" };
    if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, clear);
    else if (ctx?.contentId) updateEditingContentData(ctx.contentId, clear);
  };

  const handleContentVideoUrlSubmit = async (url: string, context?: UploadContext) => {
    const ctx = context || currentUploadContext;
    const formKey = ctx?.contentFormId || ctx?.contentId || 'default';
    
    if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, { videoUrl: url, videoSource: "url", videoS3Key: "" });
    else if (ctx?.contentId) updateEditingContentData(ctx.contentId, { videoUrl: url, videoSource: "url", videoS3Key: "" });
    
    setExtractingDurationForms((prev) => new Set(prev).add(formKey));
    try {
      const duration = await getVideoDuration(url);
      if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, { videoDuration: duration.toString() });
      else if (ctx?.contentId) updateEditingContentData(ctx.contentId, { videoDuration: duration.toString() });
    } catch (error) {
      console.error("Error extracting video duration from URL:", error);
    } finally {
      setExtractingDurationForms((prev) => {
        const next = new Set(prev);
        next.delete(formKey);
        return next;
      });
    }
  };

  const handleContentDocumentUpload = async (
    file: File,
    folderName: string,
    context?: UploadContext
  ) => {
    const ctx = context || currentUploadContext;
    const formKey = ctx?.contentFormId || ctx?.contentId || 'default';
    
    setUploadingDocumentForms((prev) => new Set(prev).add(formKey));
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        const updates = { documentUrl: result.data!.url, documentSource: "upload" as const, documentS3Key: result.data!.s3Key };
        if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, updates);
        else if (ctx?.contentId) updateEditingContentData(ctx.contentId, updates);
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    } finally {
      setUploadingDocumentForms((prev) => {
        const next = new Set(prev);
        next.delete(formKey);
        return next;
      });
    }
  };

  const handleContentDocumentRemove = (context?: UploadContext) => {
    const ctx = context || currentUploadContext;
    const clear = { documentUrl: "", documentSource: "url" as const, documentS3Key: "" };
    if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, clear);
    else if (ctx?.contentId) updateEditingContentData(ctx.contentId, clear);
  };

  const handleContentDocumentUrlSubmit = (url: string, context?: UploadContext) => {
    const ctx = context || currentUploadContext;
    const updates = { documentUrl: url, documentSource: "url" as const, documentS3Key: "" };
    if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, updates);
    else if (ctx?.contentId) updateEditingContentData(ctx.contentId, updates);
  };

  const handleContentVideoThumbnailUpload = async (
    file: File,
    folderName: string,
    context?: UploadContext
  ) => {
    const ctx = context || currentUploadContext;
    const formKey = ctx?.contentFormId || ctx?.contentId || 'default';
    
    setUploadingVideoThumbnailForms((prev) => new Set(prev).add(formKey));
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        const updates = { videoThumbnailUrl: result.data!.url, videoThumbnailSource: "upload" as const, videoThumbnailS3Key: result.data!.s3Key };
        if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, updates);
        else if (ctx?.contentId) updateEditingContentData(ctx.contentId, updates);
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Error uploading video thumbnail:", error);
      throw error;
    } finally {
      setUploadingVideoThumbnailForms((prev) => {
        const next = new Set(prev);
        next.delete(formKey);
        return next;
      });
    }
  };

  const handleContentVideoThumbnailRemove = (context?: UploadContext) => {
    const ctx = context || currentUploadContext;
    const clear = { videoThumbnailUrl: "", videoThumbnailSource: "url" as const, videoThumbnailS3Key: "" };
    if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, clear);
    else if (ctx?.contentId) updateEditingContentData(ctx.contentId, clear);
  };

  const handleContentVideoThumbnailUrlSubmit = (url: string, context?: UploadContext) => {
    const ctx = context || currentUploadContext;
    const updates = { videoThumbnailUrl: url, videoThumbnailSource: "url" as const, videoThumbnailS3Key: "" };
    if (ctx?.contentFormId) updateNewContentData(ctx.contentFormId, updates);
    else if (ctx?.contentId) updateEditingContentData(ctx.contentId, updates);
  };

  // Drag and drop handlers for modules
  const handleModuleDragStart = (index: number) => {
    setDraggedModuleIndex(index);
  };

  const handleModuleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedModuleIndex !== null && draggedModuleIndex !== index) {
      setDragOverModuleIndex(index);
    }
  };

  const handleModuleDragLeave = () => {
    setDragOverModuleIndex(null);
  };

  const handleModuleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverModuleIndex(null);

    if (draggedModuleIndex === null || draggedModuleIndex === dropIndex) {
      setDraggedModuleIndex(null);
      return;
    }

    const newModules = [...modules];
    const draggedModule = newModules[draggedModuleIndex];

    // Remove dragged module from its original position
    newModules.splice(draggedModuleIndex, 1);

    // Insert at new position
    newModules.splice(dropIndex, 0, draggedModule);

    // Update order values
    newModules.forEach((module, idx) => {
      module.order = idx;
    });

    setModules(newModules);
    setDraggedModuleIndex(null);

    // Save to localStorage
    saveModulesToLocalStorage(newModules);

    // Call API to save new order
    try {
      const moduleIds = newModules.map(m => m._id!);
      await reorderModules(effectiveCourseId!, moduleIds);
      console.log("Module order updated successfully");
    } catch (error) {
      console.error("Failed to update module order:", error);
      // Revert the local state on error
      setModules(modules);
      saveModulesToLocalStorage(modules);
    }
  };

  const handleModuleDragEnd = () => {
    setDraggedModuleIndex(null);
    setDragOverModuleIndex(null);
  };

  // Drag and drop handlers for lessons
  const handleLessonDragStart = (index: number) => {
    setDraggedLessonIndex(index);
  };

  const handleLessonDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedLessonIndex !== null && draggedLessonIndex !== index) {
      setDragOverLessonIndex(index);
    }
  };

  const handleLessonDragLeave = () => {
    setDragOverLessonIndex(null);
  };

  const handleLessonDrop = async (e: React.DragEvent, dropIndex: number, moduleId: string) => {
    e.preventDefault();
    setDragOverLessonIndex(null);

    if (draggedLessonIndex === null || draggedLessonIndex === dropIndex) {
      setDraggedLessonIndex(null);
      return;
    }

    const newModules = modules.map((module) => {
      if (module._id === moduleId) {
        const newLessons = [...(module.lessons as CourseLesson[])];
        const draggedLesson = newLessons[draggedLessonIndex];

        // Remove dragged lesson from its original position
        newLessons.splice(draggedLessonIndex, 1);

        // Insert at new position
        newLessons.splice(dropIndex, 0, draggedLesson);

        // Update order values
        newLessons.forEach((lesson, idx) => {
          lesson.order = idx;
        });

        return { ...module, lessons: newLessons };
      }
      return module;
    });

    setModules(newModules);
    setDraggedLessonIndex(null);

    // Save to localStorage
    saveModulesToLocalStorage(newModules);

    // Call API to save new order
    try {
      const lessonIds = (newModules.find(m => m._id === moduleId)?.lessons as CourseLesson[])
        .map(l => l._id!);
      await reorderLessons(moduleId, lessonIds);
      console.log("Lesson order updated successfully for module:", moduleId);
    } catch (error) {
      console.error("Failed to update lesson order:", error);
      // Revert the local state on error
      setModules(modules);
      saveModulesToLocalStorage(modules);
    }
  };

  const handleLessonDragEnd = () => {
    setDraggedLessonIndex(null);
    setDragOverLessonIndex(null);
  };

  // Drag and drop handlers for content
  const handleContentDragStart = (index: number) => {
    setDraggedContentIndex(index);
  };

  const handleContentDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedContentIndex !== null && draggedContentIndex !== index) {
      setDragOverContentIndex(index);
    }
  };

  const handleContentDragLeave = () => {
    setDragOverContentIndex(null);
  };

  const handleContentDrop = async (e: React.DragEvent, dropIndex: number, moduleId: string, lessonId: string) => {
    e.preventDefault();
    setDragOverContentIndex(null);

    if (draggedContentIndex === null || draggedContentIndex === dropIndex) {
      setDraggedContentIndex(null);
      return;
    }

    const newModules = modules.map((module) => {
      if (module._id === moduleId) {
        const newLessons = (module.lessons as CourseLesson[]).map((lesson) => {
          if (lesson._id === lessonId) {
            const newContents = [...(lesson.contents as Content[])];
            const draggedContent = newContents[draggedContentIndex];

            // Remove dragged content from its original position
            newContents.splice(draggedContentIndex, 1);

            // Insert at new position
            newContents.splice(dropIndex, 0, draggedContent);

            // Update order values
            newContents.forEach((content, idx) => {
              content.order = idx;
            });

            return { ...lesson, contents: newContents };
          }
          return lesson;
        });

        return { ...module, lessons: newLessons };
      }
      return module;
    });

    setModules(newModules);
    setDraggedContentIndex(null);

    // Save to localStorage
    saveModulesToLocalStorage(newModules);

    // Call API to save new order
    try {
      const lesson = newModules
        .find(m => m._id === moduleId)?.lessons
        ?.find(l => (l as CourseLesson)._id === lessonId) as CourseLesson;
      const contentIds = (lesson?.contents as Content[]).map(c => c._id!);
      await reorderContent(lessonId, contentIds);
      console.log("Content order updated successfully for lesson:", lessonId);
    } catch (error) {
      console.error("Failed to update content order:", error);
      // Revert the local state on error
      setModules(modules);
      saveModulesToLocalStorage(modules);
    }
  };

  const handleContentDragEnd = () => {
    setDraggedContentIndex(null);
    setDragOverContentIndex(null);
  };

  // Show loading state while modules are being loaded
  if (isLoadingModules) {
    return (
      <Container
        title="Course Modules & Content (Screen 11)"
        description="Loading course modules and content..."
        className="h-full w-full max-h-full overflow-y-auto flex flex-col relative"
        classNameBody="flex flex-col gap-6"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Loading modules...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Course Modules & Content (Screen 11)"
      description="Create and manage your course modules, lessons, and content"
      className="h-full w-full max-h-full overflow-y-auto flex flex-col relative"
      classNameBody="flex flex-col gap-6"
      style={{ scrollbarWidth: "thin" }}
    >
      <div className="absolute right-5 top-5 z-50">
        <OrangeButton
          onClick={() => setIsAddingModule(true)}
          disabled={isApiLoading}
          className="flex items-center gap-2"
          glow={false}
        >
          <Plus className="w-4 h-4" />
          Add Module
        </OrangeButton>
      </div>
      <div className="flex flex-col gap-6">
        {/* Add Module Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Course Modules
          </h2>
        </div>

        {/* Add Module Form */}
        {isAddingModule && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Add New Module
            </h3>
            <div className="flex flex-col gap-4">
              <Input
                label="Module Title"
                placeholder="Enter module title"
                value={newModule.title}
                onChange={(e) =>
                  setNewModule({ ...newModule, title: e.target.value })
                }
                required
              />
              <TextArea
                label="Description"
                placeholder="Enter module description (optional)"
                value={newModule.description}
                onChange={(e) =>
                  setNewModule({ ...newModule, description: e.target.value })
                }
              />
              <UploadMediaContainer
                title="Module Thumbnail"
                description="Upload a thumbnail image for this module"
                type="image"
                mediaUrl={newModule.thumbnailUrl}
                mediaSource={newModule.thumbnailSource}
                s3Key={newModule.thumbnailS3Key}
                folderName={modulesFolderName}
                uploadContext={newModule.title || "module"}
                onFileUpload={handleModuleThumbnailUpload}
                onFileRemove={handleModuleThumbnailRemove}
                onUrlSubmit={handleModuleThumbnailUrlSubmit}
                allowUrlInput={true}
                maxSize={10}
                className="w-full"
                required
                isUploading={isUploadingModuleThumbnail}
              />
              <CheckBoxContainer
                label="Active Module"
                description="Enable this module for students to access"
                checked={newModule.isActive}
                onChange={(checked) =>
                  setNewModule({ ...newModule, isActive: checked })
                }
              />
            </div>
            <div className="flex gap-2 mt-4">
              <OrangeButton
                onClick={addModule}
                disabled={
                  isApiLoading ||
                  !newModule.title.trim() ||
                  isUploadingModuleThumbnail
                }
                glow={false}
                className="flex items-center gap-2"
              >
                {isApiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Module...
                  </>
                ) : isUploadingModuleThumbnail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading Thumbnail...
                  </>
                ) : (
                  "Save Module"
                )}
              </OrangeButton>
              <WhiteButton
                onClick={() => setIsAddingModule(false)}
                disabled={isApiLoading || isUploadingModuleThumbnail}
              >
                Cancel
              </WhiteButton>
            </div>
          </div>
        )}

        {/* Edit Module Form */}
        {isEditingModule && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Edit Module
            </h3>
            <div className="flex flex-col gap-4">
              <Input
                label="Module Title"
                placeholder="Enter module title"
                value={editingModule.title}
                onChange={(e) =>
                  setEditingModule({ ...editingModule, title: e.target.value })
                }
                required
              />
              <TextArea
                label="Description"
                placeholder="Enter module description (optional)"
                value={editingModule.description}
                onChange={(e) =>
                  setEditingModule({
                    ...editingModule,
                    description: e.target.value,
                  })
                }
              />
              <UploadMediaContainer
                title="Module Thumbnail"
                description="Upload a thumbnail image for this module"
                type="image"
                mediaUrl={editingModule.thumbnailUrl}
                mediaSource={editingModule.thumbnailSource}
                s3Key={editingModule.thumbnailS3Key}
                folderName={modulesFolderName}
                uploadContext={editingModule.title || "module"}
                onFileUpload={async (file, folderName) => {
                  // Handle thumbnail upload for editing module
                  try {
                    const url = await handleModuleThumbnailUpload(
                      file,
                      folderName
                    );
                    if (url) {
                      setEditingModule((prev) => ({
                        ...prev,
                        thumbnailUrl: url,
                        thumbnailSource: "upload",
                      }));
                    }
                    return url;
                  } catch (error) {
                    console.error("Error uploading thumbnail:", error);
                    throw error;
                  }
                }}
                onFileRemove={() => {
                  setEditingModule((prev) => ({
                    ...prev,
                    thumbnailUrl: "",
                    thumbnailSource: "url",
                    thumbnailS3Key: "",
                  }));
                }}
                onUrlSubmit={(url) => {
                  setEditingModule((prev) => ({
                    ...prev,
                    thumbnailUrl: url,
                    thumbnailSource: "url",
                    thumbnailS3Key: "",
                  }));
                }}
                allowUrlInput={true}
                maxSize={10}
                className="w-full"
                required
              />
              <CheckBoxContainer
                label="Active Module"
                description="Enable this module for students to access"
                checked={editingModule.isActive}
                onChange={(checked) =>
                  setEditingModule({ ...editingModule, isActive: checked })
                }
              />
            </div>
            <div className="flex gap-2 mt-4">
              <OrangeButton
                onClick={editModule}
                disabled={isApiLoading || !editingModule.title.trim()}
                glow={false}
                className="flex items-center gap-2"
              >
                {isApiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating Module...
                  </>
                ) : (
                  "Update Module"
                )}
              </OrangeButton>
              <WhiteButton
                onClick={() => {
                  setIsEditingModule(false);
                  setEditingModule({
                    _id: "",
                    title: "",
                    description: "",
                    thumbnailUrl: "",
                    thumbnailSource: "url",
                    thumbnailS3Key: "",
                    isActive: true,
                  });
                }}
                disabled={isApiLoading}
              >
                Cancel
              </WhiteButton>
            </div>
          </div>
        )}

        {/* Empty State - Only show when no modules exist */}
        {!isAddingModule && !isEditingModule && modules.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-linear-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-lg">
                <BookOpen className="w-10 h-10 text-orange-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No modules created yet
            </h3>
            <p className="text-gray-600 text-base mb-8 max-w-lg leading-relaxed">
              Start building your course by creating modules, lessons, and
              content. Organize your course material in a structured way that
              helps students learn effectively.
            </p>
            <OrangeButton
              onClick={() => setIsAddingModule(true)}
              disabled={isApiLoading}
              className="flex items-center gap-3 px-8 py-4 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create First Module
            </OrangeButton>
          </div>
        ) : (
          /* Modules List - Only show when modules exist */
          <div className="space-y-4">
            {!isAddingModule &&
              !isEditingModule &&
              modules
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((selectedModule, moduleIndex) => (
                <div
                  key={selectedModule._id}
                  draggable
                  onDragStart={() => handleModuleDragStart(moduleIndex)}
                  onDragOver={(e) => handleModuleDragOver(e, moduleIndex)}
                  onDragLeave={handleModuleDragLeave}
                  onDrop={(e) => handleModuleDrop(e, moduleIndex)}
                  onDragEnd={handleModuleDragEnd}
                  className={`bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 ${
                    draggedModuleIndex === moduleIndex ? "opacity-50 scale-95" : ""
                  } ${
                    dragOverModuleIndex === moduleIndex
                      ? "border-orange-400 shadow-lg transform scale-105"
                      : ""
                  }`}
                >
                  {/* Module Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <button
                            onClick={() =>
                              toggleModuleExpansion(selectedModule._id!)
                            }
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {expandedModules.has(selectedModule._id!) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {selectedModule.thumbnailUrl ? (
                            <img
                              src={selectedModule.thumbnailUrl}
                              alt={selectedModule.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {selectedModule.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedModule.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {selectedModule.lessons?.length || 0} lessons
                        </span>
                        <button
                          onClick={() => toggleModuleActive(selectedModule._id!)}
                          disabled={isApiLoading}
                          className={`p-1 rounded disabled:opacity-50 ${
                            selectedModule.isActive
                              ? "hover:bg-green-100 text-green-600"
                              : "hover:bg-gray-100 text-gray-400"
                          }`}
                          title={selectedModule.isActive ? "Deactivate module" : "Activate module"}
                        >
                          {selectedModule.isActive ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => startEditingModule(selectedModule)}
                          disabled={isApiLoading}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                        >
                          <Edit3 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() =>
                            deleteModuleHandler(selectedModule._id!)
                          }
                          disabled={isApiLoading}
                          className="p-1 hover:bg-red-100 rounded disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Module Content */}
                  {expandedModules.has(selectedModule._id!) && (
                    <div className="p-4">
                      {/* Add Lesson Button - always visible so user can open another form */}
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-700">
                          Lessons
                        </h4>
                        <WhiteButton
                          onClick={() => {
                            const moduleId = selectedModule._id!;
                            const formId = `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                            setOpenLessonForms((prev) => [...prev, { id: formId, moduleId }]);
                            setNewLessonData((prev) =>
                              new Map(prev).set(formId, {
                                title: "",
                                description: "",
                                isActive: true,
                              })
                            );
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Lesson
                        </WhiteButton>
                      </div>

                      {/* Add Lesson Forms - one per open form for this module */}
                      {openLessonForms
                        .filter((f) => f.moduleId === selectedModule._id!)
                        .map((form) => {
                          const data = newLessonData.get(form.id) ?? {
                            title: "",
                            description: "",
                            isActive: true,
                          };
                          return (
                            <div
                              key={form.id}
                              className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200"
                            >
                              <h4 className="text-lg font-medium text-gray-800 mb-4">
                                Add New Lesson
                              </h4>
                              <div className="flex flex-col gap-4">
                                <Input
                                  label="Lesson Title"
                                  placeholder="Enter lesson title"
                                  value={data.title}
                                  onChange={(e) => {
                                    setNewLessonData((prev) =>
                                      new Map(prev).set(form.id, {
                                        ...(prev.get(form.id) ?? data),
                                        title: e.target.value,
                                      })
                                    );
                                  }}
                                  required
                                />
                                <TextArea
                                  label="Description"
                                  placeholder="Enter lesson description (optional)"
                                  value={data.description}
                                  onChange={(e) => {
                                    setNewLessonData((prev) =>
                                      new Map(prev).set(form.id, {
                                        ...(prev.get(form.id) ?? data),
                                        description: e.target.value,
                                      })
                                    );
                                  }}
                                />
                                <CheckBoxContainer
                                  label="Active Lesson"
                                  description="Enable this lesson for students to access"
                                  checked={data.isActive}
                                  onChange={(checked) => {
                                    setNewLessonData((prev) =>
                                      new Map(prev).set(form.id, {
                                        ...(prev.get(form.id) ?? data),
                                        isActive: checked,
                                      })
                                    );
                                  }}
                                />
                              </div>
                              <div className="flex gap-2 mt-4">
                                <OrangeButton
                                  onClick={() => addLesson(form.id)}
                                  disabled={
                                    isApiLoading || !data.title.trim()
                                  }
                                  glow={false}
                                  className="flex items-center gap-2"
                                >
                                  {isApiLoading ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      Creating Lesson...
                                    </>
                                  ) : (
                                    "Save Lesson"
                                  )}
                                </OrangeButton>
                                <WhiteButton
                                  onClick={() => {
                                    setOpenLessonForms((prev) =>
                                      prev.filter((f) => f.id !== form.id)
                                    );
                                    setNewLessonData((prev) => {
                                      const next = new Map(prev);
                                      next.delete(form.id);
                                      return next;
                                    });
                                  }}
                                  disabled={isApiLoading}
                                >
                                  Cancel
                                </WhiteButton>
                              </div>
                            </div>
                          );
                        })}

                      {/* Lessons List */}
                      {(
                        <div className="space-y-3">
                          {(selectedModule.lessons as CourseLesson[])
                            ?.sort((a, b) => (a.order || 0) - (b.order || 0))
                            ?.map((lesson, lessonIndex) => (
                              <div
                                key={lesson._id}
                                draggable
                                onDragStart={() => handleLessonDragStart(lessonIndex)}
                                onDragOver={(e) => handleLessonDragOver(e, lessonIndex)}
                                onDragLeave={handleLessonDragLeave}
                                onDrop={(e) => handleLessonDrop(e, lessonIndex, selectedModule._id!)}
                                onDragEnd={handleLessonDragEnd}
                                className={`bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200 ${
                                  draggedLessonIndex === lessonIndex ? "opacity-50 scale-95" : ""
                                } ${
                                  dragOverLessonIndex === lessonIndex
                                    ? "border-blue-400 shadow-lg transform scale-105"
                                    : ""
                                }`}
                              >
                                {/* Lesson Header */}
                                <div className="p-3 border-b border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        <div className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                          <GripVertical className="w-3 h-3" />
                                        </div>
                                        <button
                                          onClick={() =>
                                            toggleLessonExpansion(lesson._id!)
                                          }
                                          className="p-1 hover:bg-gray-200 rounded"
                                        >
                                          {expandedLessons.has(lesson._id!) ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )}
                                        </button>
                                      </div>
                                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Play className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <h5 className="font-medium text-gray-800">
                                          {lesson.title}
                                        </h5>
                                        <p className="text-sm text-gray-600">
                                          {lesson.description}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-500">
                                        {lesson.contents?.length || 0} content
                                      </span>
                                      <button
                                        onClick={() =>
                                          toggleLessonActive(
                                            selectedModule._id!,
                                            lesson._id!
                                          )
                                        }
                                        disabled={isApiLoading}
                                        className={`p-1 rounded disabled:opacity-50 ${
                                          lesson.isActive
                                            ? "hover:bg-green-100 text-green-600"
                                            : "hover:bg-gray-200 text-gray-400"
                                        }`}
                                        title={lesson.isActive ? "Deactivate lesson" : "Activate lesson"}
                                      >
                                        {lesson.isActive ? (
                                          <Eye className="w-4 h-4" />
                                        ) : (
                                          <EyeOff className="w-4 h-4" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() =>
                                          startEditingLesson(lesson)
                                        }
                                        disabled={isApiLoading}
                                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                                      >
                                        <Edit3 className="w-4 h-4 text-gray-600" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          deleteLessonHandler(
                                            selectedModule._id!,
                                            lesson._id!
                                          )
                                        }
                                        disabled={isApiLoading}
                                        className="p-1 hover:bg-red-100 rounded disabled:opacity-50"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Edit Lesson Form (inline) */}
                                {editingLessonIds.has(lesson._id!) && (
                                  <div className="p-3 bg-white border-b border-gray-200">
                                    <h6 className="text-sm font-medium text-gray-800 mb-3">
                                      Edit Lesson
                                    </h6>
                                    <div className="flex flex-col gap-3">
                                      <Input
                                        label="Lesson Title"
                                        placeholder="Enter lesson title"
                                        value={editingLessonData.get(lesson._id!)?.title || ""}
                                        onChange={(e) => {
                                          const lessonId = lesson._id!;
                                          const currentData = editingLessonData.get(lessonId);
                                          if (currentData) {
                                            const newData = new Map(editingLessonData);
                                            newData.set(lessonId, {
                                              ...currentData,
                                              title: e.target.value,
                                            });
                                            setEditingLessonData(newData);
                                          }
                                        }}
                                        required
                                      />
                                      <TextArea
                                        label="Description"
                                        placeholder="Enter lesson description (optional)"
                                        value={editingLessonData.get(lesson._id!)?.description || ""}
                                        onChange={(e) => {
                                          const lessonId = lesson._id!;
                                          const currentData = editingLessonData.get(lessonId);
                                          if (currentData) {
                                            const newData = new Map(editingLessonData);
                                            newData.set(lessonId, {
                                              ...currentData,
                                              description: e.target.value,
                                            });
                                            setEditingLessonData(newData);
                                          }
                                        }}
                                      />
                                      <CheckBoxContainer
                                        label="Active Lesson"
                                        description="Enable this lesson for students to access"
                                        checked={editingLessonData.get(lesson._id!)?.isActive ?? true}
                                        onChange={(checked) => {
                                          const lessonId = lesson._id!;
                                          const currentData = editingLessonData.get(lessonId);
                                          if (currentData) {
                                            const newData = new Map(editingLessonData);
                                            newData.set(lessonId, {
                                              ...currentData,
                                              isActive: checked,
                                            });
                                            setEditingLessonData(newData);
                                          }
                                        }}
                                      />
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                      <OrangeButton
                                        onClick={() => editLesson(selectedModule._id!, lesson._id!)}
                                        disabled={
                                          isApiLoading ||
                                          !editingLessonData.get(lesson._id!)?.title.trim()
                                        }
                                        glow={false}
                                        className="flex items-center gap-2 text-sm"
                                      >
                                        {isApiLoading ? (
                                          <>
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Updating...
                                          </>
                                        ) : (
                                          "Update Lesson"
                                        )}
                                      </OrangeButton>
                                      <WhiteButton
                                        onClick={() => {
                                          const lessonId = lesson._id!;
                                          const newEditingSet = new Set(editingLessonIds);
                                          newEditingSet.delete(lessonId);
                                          setEditingLessonIds(newEditingSet);
                                          
                                          const newData = new Map(editingLessonData);
                                          newData.delete(lessonId);
                                          setEditingLessonData(newData);
                                        }}
                                        disabled={isApiLoading}
                                        className="text-sm"
                                      >
                                        Cancel
                                      </WhiteButton>
                                    </div>
                                  </div>
                                )}

                                {/* Lesson Content */}
                                {expandedLessons.has(lesson._id!) && (
                                  <div className="p-3">
                                    {/* Add Content Buttons */}
                                    <div className="flex justify-between items-center mb-3">
                                      <h6 className="text-md font-medium text-gray-700">
                                        Content
                                      </h6>
                                      <div className="flex gap-2">
                                        <WhiteButton
                                          onClick={() =>
                                            startAddingContent(lesson._id!, "video")
                                          }
                                          className="flex items-center gap-2 text-sm"
                                        >
                                          <FileVideo className="w-3 h-3" />
                                          Add Video
                                        </WhiteButton>
                                        <WhiteButton
                                          onClick={() =>
                                            startAddingContent(lesson._id!, "document")
                                          }
                                          className="flex items-center gap-2 text-sm"
                                        >
                                          <FileText className="w-3 h-3" />
                                          Add Document
                                        </WhiteButton>
                                        <WhiteButton
                                          onClick={() =>
                                            startAddingContent(lesson._id!, "quiz")
                                          }
                                          className="flex items-center gap-2 text-sm"
                                        >
                                          <HelpCircle className="w-3 h-3" />
                                          Add Quiz
                                        </WhiteButton>
                                      </div>
                                    </div>

                                    {/* Edit Content Form - TODO: Implement with Map state for multiple simultaneous edits */}

                                    {/* Add Content Forms - multiple per lesson (video, document, quiz) */}
                                    {openContentForms
                                      .filter((f) => f.lessonId === lesson._id!)
                                      .map((form) => {
                                        const contentData = newContentData.get(form.id);
                                        if (!contentData) return null;
                                        const contentType = form.type;
                                        const ctx = { contentFormId: form.id };
                                        return (
                                          <div
                                            key={form.id}
                                            className="bg-white rounded-lg p-3 mb-3 border border-gray-200"
                                          >
                                            <div className="flex items-center justify-between mb-3">
                                              <h6 className="text-sm font-medium text-gray-800">
                                                Add New{" "}
                                                {contentType.charAt(0).toUpperCase() + contentType.slice(1)} Content
                                              </h6>
                                              <div
                                                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                                  contentType === "video" ? "bg-green-100" : contentType === "document" ? "bg-blue-100" : "bg-purple-100"
                                                }`}
                                              >
                                                {contentType === "video" ? (
                                                  <FileVideo className="w-3 h-3 text-green-600" />
                                                ) : contentType === "document" ? (
                                                  <FileText className="w-3 h-3 text-blue-600" />
                                                ) : (
                                                  <HelpCircle className="w-3 h-3 text-purple-600" />
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                              <Input
                                                label="Content Title"
                                                placeholder="Enter content title"
                                                value={contentData.title}
                                                onChange={(e) => updateNewContentData(form.id, { title: e.target.value })}
                                                required
                                              />
                                              <TextArea
                                                label="Description"
                                                placeholder="Enter content description (optional)"
                                                value={contentData.description}
                                                onChange={(e) => updateNewContentData(form.id, { description: e.target.value })}
                                              />
                                              <CheckBoxContainer
                                                label="Active Content"
                                                description="Enable this content for students to access"
                                                checked={contentData.isActive}
                                                onChange={(checked) => updateNewContentData(form.id, { isActive: checked })}
                                              />

                                              {contentType === "video" && (
                                                <>
                                                  <UploadMediaContainer
                                                    title="Video Content"
                                                    description="Upload video file or add video URL"
                                                    type="video"
                                                    mediaUrl={contentData.videoUrl}
                                                    mediaSource={contentData.videoSource}
                                                    s3Key={contentData.videoS3Key}
                                                    folderName={contentFolderName}
                                                    uploadContext={`${contentData.title || "content"}-${lesson.title || "lesson"}`}
                                                    onFileUpload={(file, folder) => handleContentVideoUpload(file, folder, ctx)}
                                                    onFileRemove={() => handleContentVideoRemove(ctx)}
                                                  onUrlSubmit={(url) => handleContentVideoUrlSubmit(url, ctx)}
                                                  allowUrlInput={true}
                                                  maxSize={10000}
                                                  className="w-full"
                                                  required
                                                  isUploading={uploadingVideoForms.has(form.id)}
                                                />
                                                <UploadMediaContainer
                                                  title="Video Thumbnail (Optional)"
                                                  description="Upload a thumbnail image for this video"
                                                  type="image"
                                                  mediaUrl={contentData.videoThumbnailUrl}
                                                  mediaSource={contentData.videoThumbnailSource}
                                                  s3Key={contentData.videoThumbnailS3Key}
                                                  folderName={contentFolderName}
                                                  uploadContext={`${contentData.title || "content"}-thumbnail-${lesson.title || "lesson"}`}
                                                  onFileUpload={(file, folder) => handleContentVideoThumbnailUpload(file, folder, ctx)}
                                                  onFileRemove={() => handleContentVideoThumbnailRemove(ctx)}
                                                  onUrlSubmit={(url) => handleContentVideoThumbnailUrlSubmit(url, ctx)}
                                                  allowUrlInput={true}
                                                  maxSize={10}
                                                  className="w-full"
                                                  isUploading={uploadingVideoThumbnailForms.has(form.id)}
                                                />
                                                  <Input
                                                    label="Video Duration (in seconds)"
                                                    placeholder="Enter duration in seconds (e.g., 150 for 2 minutes 30 seconds)"
                                                    value={contentData.videoDuration}
                                                    onChange={(e) => updateNewContentData(form.id, { videoDuration: e.target.value })}
                                                    required
                                                    className="w-full"
                                                  />
                                                </>
                                              )}

                                              {contentType === "document" && (
                                                <UploadMediaContainer
                                                  title="Document Content"
                                                  description="Upload document file or add document URL"
                                                  type="document"
                                                  mediaUrl={contentData.documentUrl}
                                                  mediaSource={contentData.documentSource}
                                                  s3Key={contentData.documentS3Key}
                                                  folderName={contentFolderName}
                                                  uploadContext={`${contentData.title || "content"}-${lesson.title || "lesson"}`}
                                                  onFileUpload={(file, folder) => handleContentDocumentUpload(file, folder, ctx)}
                                                  onFileRemove={() => handleContentDocumentRemove(ctx)}
                                                  onUrlSubmit={(url) => handleContentDocumentUrlSubmit(url, ctx)}
                                                  allowUrlInput={true}
                                                  maxSize={50}
                                                  className="w-full"
                                                  required
                                                  isUploading={uploadingDocumentForms.has(form.id)}
                                                />
                                              )}

                                              {contentType === "quiz" && (
                                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <HelpCircle className="w-4 h-4 text-purple-600" />
                                                    <span className="text-sm font-medium text-purple-800">Quiz Content</span>
                                                  </div>
                                                  <p className="text-sm text-purple-700">
                                                    Quiz questions and options will be configured in the next step.
                                                  </p>
                                                </div>
                                              )}
                                            </div>

                                            <div className="flex items-end gap-2 mt-4">
                                              <OrangeButton
                                                onClick={() => addContent(form.id, selectedModule._id!)}
                                                disabled={
                                                  !contentData.title.trim() ||
                                                  uploadingVideoForms.has(form.id) ||
                                                  uploadingVideoThumbnailForms.has(form.id) ||
                                                  uploadingDocumentForms.has(form.id) ||
                                                  extractingDurationForms.has(form.id)
                                                }
                                                glow={false}
                                                className="flex items-center gap-2 text-sm"
                                              >
                                                {(uploadingVideoForms.has(form.id) || uploadingVideoThumbnailForms.has(form.id) || uploadingDocumentForms.has(form.id) || extractingDurationForms.has(form.id)) ? (
                                                  <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    {extractingDurationForms.has(form.id) ? "Extracting duration..." : "Uploading..."}
                                                  </>
                                                ) : (
                                                  `Add ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`
                                                )}
                                              </OrangeButton>
                                              <WhiteButton
                                                onClick={() => {
                                                  setOpenContentForms((prev) => prev.filter((f) => f.id !== form.id));
                                                  setNewContentData((prev) => {
                                                    const next = new Map(prev);
                                                    next.delete(form.id);
                                                    return next;
                                                  });
                                                }}
                                                disabled={
                                                  uploadingVideoForms.has(form.id) ||
                                                  uploadingVideoThumbnailForms.has(form.id) ||
                                                  uploadingDocumentForms.has(form.id) ||
                                                  extractingDurationForms.has(form.id)
                                                }
                                                className="text-sm"
                                              >
                                                Cancel
                                              </WhiteButton>
                                            </div>
                                          </div>
                                        );
                                      })}

                                    {/* Content List */}
                                    {(
                                      <div className="space-y-2">
                                        {(lesson.contents as Content[])
                                          ?.sort((a, b) => (a.order || 0) - (b.order || 0))
                                          ?.map((content, contentIndex) => (
                                            <div
                                              key={content._id}
                                              draggable
                                              onDragStart={() => handleContentDragStart(contentIndex)}
                                              onDragOver={(e) => handleContentDragOver(e, contentIndex)}
                                              onDragLeave={handleContentDragLeave}
                                              onDrop={(e) => handleContentDrop(e, contentIndex, selectedModule._id!, lesson._id!)}
                                              onDragEnd={handleContentDragEnd}
                                              className={`bg-white rounded-lg p-3 border border-gray-200 transition-all duration-200 ${
                                                draggedContentIndex === contentIndex ? "opacity-50 scale-95" : ""
                                              } ${
                                                dragOverContentIndex === contentIndex
                                                  ? "border-green-400 shadow-lg transform scale-105"
                                                  : ""
                                              }`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                  <div className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                                    <GripVertical className="w-3 h-3" />
                                                  </div>
                                                  <div
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                                      content.type === "video"
                                                        ? "bg-green-100"
                                                        : content.type ===
                                                          "document"
                                                        ? "bg-blue-100"
                                                        : "bg-purple-100"
                                                    }`}
                                                  >
                                                    {content.type ===
                                                    "video" ? (
                                                      <FileVideo className="w-3 h-3 text-green-600" />
                                                    ) : content.type ===
                                                      "document" ? (
                                                      <FileText className="w-3 h-3 text-blue-600" />
                                                    ) : (
                                                      <HelpCircle className="w-3 h-3 text-purple-600" />
                                                    )}
                                                  </div>
                                                  <div>
                                                    <div className="font-medium text-gray-800 text-sm">
                                                      {content.title}
                                                    </div>
                                                    <p className="text-xs text-gray-600">
                                                      {content.description}
                                                    </p>
                                                    {content.type === "video" &&
                                                      (content as VideoContent)
                                                        .duration && (
                                                        <p className="text-xs text-blue-600 font-medium">
                                                          Duration:{" "}
                                                          {formatDuration(
                                                            (
                                                              content as VideoContent
                                                            ).duration!
                                                          )}
                                                        </p>
                                                      )}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-gray-500 capitalize">
                                                    {content.type}
                                                  </span>
                                                  <button
                                                    onClick={() =>
                                                      toggleContentActive(
                                                        selectedModule._id!,
                                                        lesson._id!,
                                                        content._id!
                                                      )
                                                    }
                                                    disabled={isApiLoading}
                                                    className={`p-1 rounded disabled:opacity-50 ${
                                                      content.isActive
                                                        ? "hover:bg-green-100 text-green-600"
                                                        : "hover:bg-gray-200 text-gray-400"
                                                    }`}
                                                    title={content.isActive ? "Deactivate content" : "Activate content"}
                                                  >
                                                    {content.isActive ? (
                                                      <Eye className="w-3 h-3" />
                                                    ) : (
                                                      <EyeOff className="w-3 h-3" />
                                                    )}
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      startEditingContent(
                                                        content
                                                      )
                                                    }
                                                    disabled={isApiLoading}
                                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                                                  >
                                                    <Edit3 className="w-3 h-3 text-gray-600" />
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      deleteContentHandler(
                                                        selectedModule._id!,
                                                        lesson._id!,
                                                        content._id!
                                                      )
                                                    }
                                                    className="p-1 hover:bg-red-100 rounded"
                                                  >
                                                    <Trash2 className="w-3 h-3 text-red-600" />
                                                  </button>
                                                </div>
                                              </div>

                                              {/* Video Preview for Video Content */}
                                              {content.type === "video" &&
                                                (content as VideoContent)
                                                  .sources?.[0]?.videoUrl && (
                                                  <div className="mt-3">
                                                    <div className="relative">
                                                      <video
                                                        src={
                                                          (
                                                            content as VideoContent
                                                          ).sources[0].videoUrl
                                                        }
                                                        className="w-full max-w-xs h-32 object-cover rounded border"
                                                        controls
                                                        poster={
                                                          (
                                                            content as VideoContent
                                                          ).thumbnailUrl
                                                        }
                                                      />
                                                      {(content as VideoContent)
                                                        .thumbnailUrl && (
                                                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                          Thumbnail
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                              {/* Document Preview for Document Content */}
                                              {content.type === "document" &&
                                                (content as DocumentContent)
                                                  .documentUrl && (
                                                  <div className="mt-3">
                                                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                      <FileText className="w-4 h-4 text-blue-600" />
                                                      <a
                                                        href={
                                                          (
                                                            content as DocumentContent
                                                          ).documentUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                                                      >
                                                        View Document
                                                      </a>
                                                    </div>
                                                  </div>
                                                )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default Screen11;
