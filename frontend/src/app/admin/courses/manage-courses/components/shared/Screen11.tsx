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
    getCourseById,
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
          // In edit mode, try to load from localStorage first, then from API if needed
          const storedModules = loadModulesFromLocalStorage();
          if (storedModules.length > 0) {
            setModules(storedModules);
          } else {
            // If no localStorage data, fetch from API
            try {
              const courseData = await getCourseById(effectiveCourseId);
              if (courseData?.modules) {
                initializeModulesFromCourseData(courseData);
              } else {
                setModules([]);
              }
            } catch (apiError) {
              console.error("Screen11: Error fetching course data:", apiError);
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
  }, [isEditMode, effectiveCourseId, modulesStorageKey, getCourseById]);

  // Save modules to localStorage whenever modules change
  useEffect(() => {
    if (typeof window !== "undefined" && modules.length > 0) {
      saveModulesToLocalStorage(modules);
    }
  }, [modules, modulesStorageKey]);

  // Function to initialize modules from course data
  const initializeModulesFromCourseData = (courseData: any) => {
    if (courseData?.modules && Array.isArray(courseData.modules)) {
      const transformedModules: CourseModule[] = courseData.modules.map(
        (selectedModule: any) => ({
          _id: selectedModule._id,
          title: selectedModule.title,
          description: selectedModule.description,
          thumbnailUrl: selectedModule.thumbnailUrl,
          thumbnailSource: selectedModule.thumbnailSource || "url",
          thumbnailS3Key: selectedModule.thumbnailS3Key || "",
          lessonIds: selectedModule.lessonIds || [],
          isCompleted: selectedModule.isCompleted || false,
          isActive:
            selectedModule.isActive !== undefined
              ? selectedModule.isActive
              : true,
          isLocked: selectedModule.isLocked || false,
          lessons: selectedModule.lessons || [],
        })
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
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentTypeToAdd, setContentTypeToAdd] = useState<
    "video" | "quiz" | "document" | null
  >(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingVideoThumbnail, setIsUploadingVideoThumbnail] =
    useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isUploadingModuleThumbnail, setIsUploadingModuleThumbnail] =
    useState(false);
  const [isExtractingDuration, setIsExtractingDuration] = useState(false);
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    thumbnailSource: "url" as "upload" | "url",
    thumbnailS3Key: "",
    isActive: true,
  });
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    isActive: true,
  });
  const [editingLesson, setEditingLesson] = useState({
    _id: "",
    title: "",
    description: "",
    isActive: true,
  });
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    type: "video" as "video" | "quiz" | "document",
    videoUrl: "",
    videoSource: "url" as "upload" | "url",
    videoS3Key: "",
    videoThumbnailUrl: "",
    videoThumbnailSource: "url" as "upload" | "url",
    videoThumbnailS3Key: "",
    videoDuration: "",
    documentUrl: "",
    documentSource: "url" as "upload" | "url",
    documentS3Key: "",
    isActive: true,
  });
  const [editingModule, setEditingModule] = useState({
    _id: "",
    title: "",
    description: "",
    thumbnailUrl: "",
    thumbnailSource: "url" as "upload" | "url",
    thumbnailS3Key: "",
    isActive: true,
  });
  const [editingContent, setEditingContent] = useState({
    _id: "",
    title: "",
    description: "",
    type: "video" as "video" | "quiz" | "document",
    videoUrl: "",
    videoSource: "url" as "upload" | "url",
    videoS3Key: "",
    videoThumbnailUrl: "",
    videoThumbnailSource: "url" as "upload" | "url",
    videoThumbnailS3Key: "",
    videoDuration: "",
    documentUrl: "",
    documentSource: "url" as "upload" | "url",
    documentS3Key: "",
    isActive: true,
  });

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

  const addModule = async () => {
    if (!newModule.title.trim()) {
      toast.error("Module title is required");
      return;
    }

    if (!newModule.description.trim()) {
      toast.error("Module description is required");
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

  const addLesson = async (moduleId: string) => {
    if (!newLesson.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    if (!newLesson.description.trim()) {
      toast.error("Lesson description is required");
      return;
    }

    try {
      // Prepare lesson data for API
      const lessonData = {
        moduleId: moduleId,
        title: newLesson.title,
        description: newLesson.description,
      };

      const result = await createLesson(effectiveCourseId!, lessonData);

      if (result) {
        const lesson: CourseLesson = {
          _id: result._id,
          title: result.title,
          description: result.description,
          moduleId,
          contents: [],
        };

        // Add lesson to local state
        const updatedModules = modules.map((selectedModule) =>
          selectedModule._id === moduleId
            ? {
                ...selectedModule,
                lessons: [
                  ...((selectedModule.lessons as CourseLesson[]) || []),
                  lesson,
                ],
              }
            : selectedModule
        );
        setModules(updatedModules);

        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);

        setNewLesson({ title: "", description: "", isActive: true });
        setIsAddingLesson(false);

        toast.success("Lesson created successfully!");
      } else {
        toast.error("Failed to create lesson");
      }
    } catch (error) {
      console.error("Error creating lesson:", error);
      toast.error("Error creating lesson");
    }
  };

  const editLesson = async (moduleId: string) => {
    if (!editingLesson.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    if (!editingLesson.description.trim()) {
      toast.error("Lesson description is required");
      return;
    }

    if (!editingLesson._id) {
      toast.error("Lesson ID is required to edit a lesson");
      return;
    }

    try {
      const lessonData = {
        title: editingLesson.title,
        description: editingLesson.description,
      };

      // Make API call to update lesson
      const result = await updateLesson(
        effectiveCourseId!,
        moduleId,
        editingLesson._id,
        lessonData
      );

      if (result) {
        // Update lesson in local state
        const updatedModules = modules.map((selectedModule) =>
          selectedModule._id === moduleId
            ? {
                ...selectedModule,
                lessons: (selectedModule.lessons as CourseLesson[])?.map(
                  (lesson) =>
                    lesson._id === editingLesson._id
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

        // Reset form and close edit mode
        setEditingLesson({
          _id: "",
          title: "",
          description: "",
          isActive: true,
        });
        setIsEditingLesson(false);

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
    setEditingLesson({
      _id: lesson._id || "",
      title: lesson.title || "",
      description: lesson.description || "",
      isActive: true,
    });
    setIsEditingLesson(true);
  };

  const startAddingContent = (type: "video" | "quiz" | "document") => {
    setContentTypeToAdd(type);
    setNewContent({
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
    });
    setIsAddingContent(true);
  };

  const addContent = async (lessonId: string, moduleId: string) => {
    if (!newContent.title.trim()) {
      toast.error("Content title is required");
      return;
    }

    if (!newContent.description.trim()) {
      toast.error("Content description is required");
      return;
    }

    let contentData: any;

    if (newContent.type === "video") {
      if (!newContent.videoUrl.trim()) {
        toast.error("Video is required for video content");
        return;
      }
      if (!newContent.videoDuration.trim()) {
        toast.error("Video duration is required for video content");
        return;
      }
      if (
        !newContent.videoDuration ||
        isNaN(Number(newContent.videoDuration)) ||
        Number(newContent.videoDuration) <= 0
      ) {
        toast.error(
          "Please enter a valid duration in seconds (e.g., 150 for 2 minutes 30 seconds)"
        );
        return;
      }
      contentData = {
        lessonId: lessonId,
        title: newContent.title,
        description: newContent.description,
        type: "video",
        sources: [
          {
            quality: "720p",
            videoUrl: newContent.videoUrl,
          },
        ],
        thumbnailUrl: newContent.videoThumbnailUrl,
        duration: Number(newContent.videoDuration),
      };
    } else if (newContent.type === "document") {
      if (!newContent.documentUrl.trim()) {
        toast.error("Document is required for document content");
        return;
      }
      contentData = {
        lessonId: lessonId,
        title: newContent.title,
        description: newContent.description,
        type: "document",
        documentUrl: newContent.documentUrl,
      };
    } else {
      // Quiz content
      contentData = {
        lessonId: lessonId,
        title: newContent.title,
        description: newContent.description,
        type: "quiz",
        questions: [],
      };
    }

    try {
      // Make API call to create content
      const result = await createContent(
        effectiveCourseId!,
        moduleId,
        contentData
      );

      if (result) {
        let content: Content;

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
          } as VideoContent;
        } else if (result.type === "document") {
          content = {
            _id: result._id,
            title: result.title,
            description: result.description,
            type: "document",
            documentUrl: result.documentUrl,
            lessonId,
          } as DocumentContent;
        } else {
          content = {
            _id: result._id,
            title: result.title,
            description: result.description,
            type: "quiz",
            questions: result.questions || [],
            lessonId,
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

        // Reset form
        setNewContent({
          title: "",
          description: "",
          type: "video",
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
        });
        setIsAddingContent(false);
        setContentTypeToAdd(null);

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

  const editContent = async (lessonId: string, moduleId: string) => {
    if (!editingContent.title.trim()) {
      toast.error("Content title is required");
      return;
    }

    if (!editingContent.description.trim()) {
      toast.error("Content description is required");
      return;
    }

    if (!editingContent._id) {
      toast.error("Content ID is required to edit content");
      return;
    }

    let contentData: any;

    if (editingContent.type === "video") {
      if (!editingContent.videoUrl.trim()) {
        toast.error("Video is required for video content");
        return;
      }
      if (!editingContent.videoDuration.trim()) {
        toast.error("Video duration is required for video content");
        return;
      }
      if (
        !editingContent.videoDuration ||
        isNaN(Number(editingContent.videoDuration)) ||
        Number(editingContent.videoDuration) <= 0
      ) {
        toast.error(
          "Please enter a valid duration in seconds (e.g., 150 for 2 minutes 30 seconds)"
        );
        return;
      }
      contentData = {
        title: editingContent.title,
        description: editingContent.description,
        type: "video",
        sources: [
          {
            quality: "720p",
            videoUrl: editingContent.videoUrl,
          },
        ],
        thumbnailUrl: editingContent.videoThumbnailUrl,
        duration: Number(editingContent.videoDuration),
      };
    } else if (editingContent.type === "document") {
      if (!editingContent.documentUrl.trim()) {
        toast.error("Document is required for document content");
        return;
      }
      contentData = {
        title: editingContent.title,
        description: editingContent.description,
        type: "document",
        documentUrl: editingContent.documentUrl,
      };
    } else {
      // Quiz content
      contentData = {
        title: editingContent.title,
        description: editingContent.description,
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
        editingContent._id,
        contentData
      );

      if (result) {
        // Update content in local state
        const updatedModules = modules.map((selectedModule) =>
          selectedModule._id === moduleId
            ? {
                ...selectedModule,
                lessons: (selectedModule.lessons as CourseLesson[])?.map(
                  (lesson) =>
                    lesson._id === lessonId
                      ? {
                          ...lesson,
                          contents: (lesson.contents as Content[])?.map(
                            (content) =>
                              content._id === editingContent._id
                                ? {
                                    ...content,
                                    title: result.title,
                                    description: result.description,
                                    ...(result.type === "video" && {
                                      sources: result.sources || [],
                                      thumbnailUrl: result.thumbnailUrl,
                                    }),
                                    ...(result.type === "document" && {
                                      documentUrl: result.documentUrl,
                                    }),
                                    ...(result.type === "quiz" && {
                                      questions: result.questions || [],
                                    }),
                                  }
                                : content
                          ),
                        }
                      : lesson
                ),
              }
            : selectedModule
        );
        setModules(updatedModules);

        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);

        // Reset form and close edit mode
        setEditingContent({
          _id: "",
          title: "",
          description: "",
          type: "video",
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
        });
        setIsEditingContent(false);

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
    setEditingContent({
      _id: content._id || "",
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
    setIsEditingContent(true);
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
        // Remove content from local state
        const updatedModules = modules.map((selectedModule) =>
          selectedModule._id === moduleId
            ? {
                ...selectedModule,
                lessons: (selectedModule.lessons as CourseLesson[])?.map(
                  (lesson) =>
                    lesson._id === lessonId
                      ? {
                          ...lesson,
                          contents: (lesson.contents as Content[])?.filter(
                            (content) => content._id !== contentId
                          ),
                        }
                      : lesson
                ),
              }
            : selectedModule
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

  const handleContentVideoUpload = async (file: File, folderName: string) => {
    setIsUploadingVideo(true);
    setIsExtractingDuration(true);
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        // Extract video duration
        try {
          const duration = await getVideoDuration(file);

          setNewContent((prev) => ({
            ...prev,
            videoUrl: result.data!.url,
            videoSource: "upload",
            videoS3Key: result.data!.s3Key,
            videoDuration: duration.toString(),
          }));
        } catch (durationError) {
          console.error("Error extracting video duration:", durationError);
          // Still set the video URL but without duration
          setNewContent((prev) => ({
            ...prev,
            videoUrl: result.data!.url,
            videoSource: "upload",
            videoS3Key: result.data!.s3Key,
          }));
          toast.warning(
            "Video uploaded but duration could not be extracted. Please enter duration manually."
          );
        }
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Error uploading content video:", error);
      throw error;
    } finally {
      setIsUploadingVideo(false);
      setIsExtractingDuration(false);
    }
  };

  const handleContentVideoRemove = () => {
    setNewContent((prev) => ({
      ...prev,
      videoUrl: "",
      videoSource: "url",
      videoS3Key: "",
      videoDuration: "",
    }));
  };

  const handleContentVideoUrlSubmit = async (url: string) => {
    setNewContent((prev) => ({
      ...prev,
      videoUrl: url,
      videoSource: "url",
      videoS3Key: "",
    }));

    // Try to extract duration from URL
    setIsExtractingDuration(true);
    try {
      const duration = await getVideoDuration(url);
      setNewContent((prev) => ({
        ...prev,
        videoDuration: duration.toString(),
      }));
    } catch (error) {
      console.error("Error extracting video duration from URL:", error);
      // Don't show error toast for URL duration extraction as it's optional
    } finally {
      setIsExtractingDuration(false);
    }
  };

  const handleContentDocumentUpload = async (
    file: File,
    folderName: string
  ) => {
    setIsUploadingDocument(true);
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setNewContent((prev) => ({
          ...prev,
          documentUrl: result.data!.url,
          documentSource: "upload",
          documentS3Key: result.data!.s3Key,
        }));
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleContentDocumentRemove = () => {
    setNewContent((prev) => ({
      ...prev,
      documentUrl: "",
      documentSource: "url",
      documentS3Key: "",
    }));
  };

  const handleContentDocumentUrlSubmit = (url: string) => {
    setNewContent((prev) => ({
      ...prev,
      documentUrl: url,
      documentSource: "url",
      documentS3Key: "",
    }));
  };

  const handleContentVideoThumbnailUpload = async (
    file: File,
    folderName: string
  ) => {
    setIsUploadingVideoThumbnail(true);
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setNewContent((prev) => ({
          ...prev,
          videoThumbnailUrl: result.data!.url,
          videoThumbnailSource: "upload",
          videoThumbnailS3Key: result.data!.s3Key,
        }));
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Error uploading video thumbnail:", error);
      throw error;
    } finally {
      setIsUploadingVideoThumbnail(false);
    }
  };

  const handleContentVideoThumbnailRemove = () => {
    setNewContent((prev) => ({
      ...prev,
      videoThumbnailUrl: "",
      videoThumbnailSource: "url",
      videoThumbnailS3Key: "",
    }));
  };

  const handleContentVideoThumbnailUrlSubmit = (url: string) => {
    setNewContent((prev) => ({
      ...prev,
      videoThumbnailUrl: url,
      videoThumbnailSource: "url",
      videoThumbnailS3Key: "",
    }));
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
                placeholder="Enter module description"
                value={newModule.description}
                onChange={(e) =>
                  setNewModule({ ...newModule, description: e.target.value })
                }
                required
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
                placeholder="Enter module description"
                value={editingModule.description}
                onChange={(e) =>
                  setEditingModule({
                    ...editingModule,
                    description: e.target.value,
                  })
                }
                required
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
              modules.map((selectedModule) => (
                <div
                  key={selectedModule._id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  {/* Module Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
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
                      {/* Add Lesson Button */}
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-700">
                          Lessons
                        </h4>
                        {!isAddingLesson && !isEditingLesson && (
                          <WhiteButton
                            onClick={() => setIsAddingLesson(true)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Lesson
                          </WhiteButton>
                        )}
                      </div>

                      {/* Add Lesson Form */}
                      {isAddingLesson && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                          <h4 className="text-lg font-medium text-gray-800 mb-4">
                            Add New Lesson
                          </h4>
                          <div className="flex flex-col gap-4">
                            <Input
                              label="Lesson Title"
                              placeholder="Enter lesson title"
                              value={newLesson.title}
                              onChange={(e) =>
                                setNewLesson({
                                  ...newLesson,
                                  title: e.target.value,
                                })
                              }
                              required
                            />
                            <TextArea
                              label="Description"
                              placeholder="Enter lesson description"
                              value={newLesson.description}
                              onChange={(e) =>
                                setNewLesson({
                                  ...newLesson,
                                  description: e.target.value,
                                })
                              }
                              required
                            />
                            <CheckBoxContainer
                              label="Active Lesson"
                              description="Enable this lesson for students to access"
                              checked={newLesson.isActive}
                              onChange={(checked) =>
                                setNewLesson({
                                  ...newLesson,
                                  isActive: checked,
                                })
                              }
                            />
                          </div>
                          <div className="flex gap-2 mt-4">
                            <OrangeButton
                              onClick={() => addLesson(selectedModule._id!)}
                              disabled={
                                isApiLoading ||
                                !newLesson.title.trim() ||
                                !newLesson.description.trim()
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
                              onClick={() => setIsAddingLesson(false)}
                              disabled={isApiLoading}
                            >
                              Cancel
                            </WhiteButton>
                          </div>
                        </div>
                      )}

                      {/* Edit Lesson Form */}
                      {isEditingLesson && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                          <h4 className="text-lg font-medium text-gray-800 mb-4">
                            Edit Lesson
                          </h4>
                          <div className="flex flex-col gap-4">
                            <Input
                              label="Lesson Title"
                              placeholder="Enter lesson title"
                              value={editingLesson.title}
                              onChange={(e) =>
                                setEditingLesson({
                                  ...editingLesson,
                                  title: e.target.value,
                                })
                              }
                              required
                            />
                            <TextArea
                              label="Description"
                              placeholder="Enter lesson description"
                              value={editingLesson.description}
                              onChange={(e) =>
                                setEditingLesson({
                                  ...editingLesson,
                                  description: e.target.value,
                                })
                              }
                              required
                            />
                            <CheckBoxContainer
                              label="Active Lesson"
                              description="Enable this lesson for students to access"
                              checked={editingLesson.isActive}
                              onChange={(checked) =>
                                setEditingLesson({
                                  ...editingLesson,
                                  isActive: checked,
                                })
                              }
                            />
                          </div>
                          <div className="flex gap-2 mt-4">
                            <OrangeButton
                              onClick={() => editLesson(selectedModule._id!)}
                              disabled={
                                isApiLoading ||
                                !editingLesson.title.trim() ||
                                !editingLesson.description.trim()
                              }
                              glow={false}
                              className="flex items-center gap-2"
                            >
                              {isApiLoading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Updating Lesson...
                                </>
                              ) : (
                                "Update Lesson"
                              )}
                            </OrangeButton>
                            <WhiteButton
                              onClick={() => {
                                setIsEditingLesson(false);
                                setEditingLesson({
                                  _id: "",
                                  title: "",
                                  description: "",
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

                      {/* Lessons List */}
                      {!isAddingLesson && !isEditingLesson && (
                        <div className="space-y-3">
                          {(selectedModule.lessons as CourseLesson[])?.map(
                            (lesson) => (
                              <div
                                key={lesson._id}
                                className="bg-gray-50 rounded-lg border border-gray-200"
                              >
                                {/* Lesson Header */}
                                <div className="p-3 border-b border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
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

                                {/* Lesson Content */}
                                {expandedLessons.has(lesson._id!) && (
                                  <div className="p-3">
                                    {/* Add Content Buttons */}
                                    <div className="flex justify-between items-center mb-3">
                                      <h6 className="text-md font-medium text-gray-700">
                                        Content
                                      </h6>
                                      {!isAddingContent &&
                                        !isEditingContent && (
                                          <div className="flex gap-2">
                                            <WhiteButton
                                              onClick={() =>
                                                startAddingContent("video")
                                              }
                                              className="flex items-center gap-2 text-sm"
                                            >
                                              <FileVideo className="w-3 h-3" />
                                              Add Video
                                            </WhiteButton>
                                            <WhiteButton
                                              onClick={() =>
                                                startAddingContent("document")
                                              }
                                              className="flex items-center gap-2 text-sm"
                                            >
                                              <FileText className="w-3 h-3" />
                                              Add Document
                                            </WhiteButton>
                                            <WhiteButton
                                              onClick={() =>
                                                startAddingContent("quiz")
                                              }
                                              className="flex items-center gap-2 text-sm"
                                            >
                                              <HelpCircle className="w-3 h-3" />
                                              Add Quiz
                                            </WhiteButton>
                                          </div>
                                        )}
                                    </div>

                                    {/* Edit Content Form */}
                                    {isEditingContent && (
                                      <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                          <h6 className="text-sm font-medium text-gray-800">
                                            Edit{" "}
                                            {editingContent.type
                                              .charAt(0)
                                              .toUpperCase() +
                                              editingContent.type.slice(1)}{" "}
                                            Content
                                          </h6>
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                                editingContent.type === "video"
                                                  ? "bg-green-100"
                                                  : editingContent.type ===
                                                    "document"
                                                  ? "bg-blue-100"
                                                  : "bg-purple-100"
                                              }`}
                                            >
                                              {editingContent.type ===
                                              "video" ? (
                                                <FileVideo className="w-3 h-3 text-green-600" />
                                              ) : editingContent.type ===
                                                "document" ? (
                                                <FileText className="w-3 h-3 text-blue-600" />
                                              ) : (
                                                <HelpCircle className="w-3 h-3 text-purple-600" />
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                          <Input
                                            label="Content Title"
                                            placeholder="Enter content title"
                                            value={editingContent.title}
                                            onChange={(e) =>
                                              setEditingContent({
                                                ...editingContent,
                                                title: e.target.value,
                                              })
                                            }
                                            required
                                          />
                                          <TextArea
                                            label="Description"
                                            placeholder="Enter content description"
                                            value={editingContent.description}
                                            onChange={(e) =>
                                              setEditingContent({
                                                ...editingContent,
                                                description: e.target.value,
                                              })
                                            }
                                            required
                                          />
                                          <CheckBoxContainer
                                            label="Active Content"
                                            description="Enable this content for students to access"
                                            checked={editingContent.isActive}
                                            onChange={(checked) =>
                                              setEditingContent({
                                                ...editingContent,
                                                isActive: checked,
                                              })
                                            }
                                          />

                                          {/* Video Upload for Video Content */}
                                          {editingContent.type === "video" && (
                                            <>
                                              <UploadMediaContainer
                                                title="Video Content"
                                                description="Upload video file or add video URL"
                                                type="video"
                                                mediaUrl={
                                                  editingContent.videoUrl
                                                }
                                                mediaSource={
                                                  editingContent.videoSource
                                                }
                                                s3Key={
                                                  editingContent.videoS3Key
                                                }
                                                folderName={contentFolderName}
                                                uploadContext={`${
                                                  editingContent.title ||
                                                  "content"
                                                }-${lesson.title || "lesson"}`}
                                                onFileUpload={
                                                  handleContentVideoUpload
                                                }
                                                onFileRemove={
                                                  handleContentVideoRemove
                                                }
                                                onUrlSubmit={
                                                  handleContentVideoUrlSubmit
                                                }
                                                allowUrlInput={true}
                                                maxSize={10000}
                                                className="w-full"
                                                required
                                                isUploading={isUploadingVideo}
                                              />
                                              <UploadMediaContainer
                                                title="Video Thumbnail (Optional)"
                                                description="Upload a thumbnail image for this video"
                                                type="image"
                                                mediaUrl={
                                                  editingContent.videoThumbnailUrl
                                                }
                                                mediaSource={
                                                  editingContent.videoThumbnailSource
                                                }
                                                s3Key={
                                                  editingContent.videoThumbnailS3Key
                                                }
                                                folderName={contentFolderName}
                                                uploadContext={`${
                                                  editingContent.title ||
                                                  "content"
                                                }-thumbnail-${
                                                  lesson.title || "lesson"
                                                }`}
                                                onFileUpload={
                                                  handleContentVideoThumbnailUpload
                                                }
                                                onFileRemove={
                                                  handleContentVideoThumbnailRemove
                                                }
                                                onUrlSubmit={
                                                  handleContentVideoThumbnailUrlSubmit
                                                }
                                                allowUrlInput={true}
                                                maxSize={10}
                                                className="w-full"
                                                isUploading={
                                                  isUploadingVideoThumbnail
                                                }
                                              />
                                              <Input
                                                label="Video Duration (in seconds)"
                                                placeholder="Enter duration in seconds (e.g., 150 for 2 minutes 30 seconds)"
                                                value={
                                                  editingContent.videoDuration
                                                }
                                                onChange={(e) =>
                                                  setEditingContent({
                                                    ...editingContent,
                                                    videoDuration:
                                                      e.target.value,
                                                  })
                                                }
                                                required
                                                className="w-full"
                                              />
                                            </>
                                          )}

                                          {/* Document Upload for Document Content */}
                                          {editingContent.type ===
                                            "document" && (
                                            <UploadMediaContainer
                                              title="Document Content"
                                              description="Upload document file or add document URL"
                                              type="document"
                                              mediaUrl={
                                                editingContent.documentUrl
                                              }
                                              mediaSource={
                                                editingContent.documentSource
                                              }
                                              s3Key={
                                                editingContent.documentS3Key
                                              }
                                              folderName={contentFolderName}
                                              uploadContext={`${
                                                editingContent.title ||
                                                "content"
                                              }-${lesson.title || "lesson"}`}
                                              onFileUpload={
                                                handleContentDocumentUpload
                                              }
                                              onFileRemove={
                                                handleContentDocumentRemove
                                              }
                                              onUrlSubmit={
                                                handleContentDocumentUrlSubmit
                                              }
                                              allowUrlInput={true}
                                              maxSize={50}
                                              className="w-full"
                                              required
                                              isUploading={isUploadingDocument}
                                            />
                                          )}

                                          {/* Quiz Content - Basic form for now */}
                                          {editingContent.type === "quiz" && (
                                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                              <div className="flex items-center gap-2 mb-2">
                                                <HelpCircle className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm font-medium text-purple-800">
                                                  Quiz Content
                                                </span>
                                              </div>
                                              <p className="text-sm text-purple-700">
                                                Quiz questions and options will
                                                be configured in the next step.
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-end gap-2 mt-4">
                                          <OrangeButton
                                            onClick={() =>
                                              editContent(
                                                lesson._id!,
                                                selectedModule._id!
                                              )
                                            }
                                            disabled={
                                              !editingContent.title.trim() ||
                                              !editingContent.description.trim() ||
                                              isUploadingVideo ||
                                              isUploadingVideoThumbnail ||
                                              isUploadingDocument ||
                                              isExtractingDuration
                                            }
                                            glow={false}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            {isUploadingVideo ||
                                            isUploadingVideoThumbnail ||
                                            isUploadingDocument ||
                                            isExtractingDuration ? (
                                              <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                {isExtractingDuration
                                                  ? "Extracting duration..."
                                                  : "Uploading..."}
                                              </>
                                            ) : (
                                              "Update Content"
                                            )}
                                          </OrangeButton>
                                          <WhiteButton
                                            onClick={() => {
                                              setIsEditingContent(false);
                                              setEditingContent({
                                                _id: "",
                                                title: "",
                                                description: "",
                                                type: "video",
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
                                              });
                                            }}
                                            disabled={
                                              isUploadingVideo ||
                                              isUploadingVideoThumbnail ||
                                              isUploadingDocument ||
                                              isExtractingDuration
                                            }
                                            className="text-sm"
                                          >
                                            Cancel
                                          </WhiteButton>
                                        </div>
                                      </div>
                                    )}

                                    {/* Add Content Form */}
                                    {isAddingContent && contentTypeToAdd && (
                                      <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                          <h6 className="text-sm font-medium text-gray-800">
                                            Add New{" "}
                                            {contentTypeToAdd
                                              .charAt(0)
                                              .toUpperCase() +
                                              contentTypeToAdd.slice(1)}{" "}
                                            Content
                                          </h6>
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                                contentTypeToAdd === "video"
                                                  ? "bg-green-100"
                                                  : contentTypeToAdd ===
                                                    "document"
                                                  ? "bg-blue-100"
                                                  : "bg-purple-100"
                                              }`}
                                            >
                                              {contentTypeToAdd === "video" ? (
                                                <FileVideo className="w-3 h-3 text-green-600" />
                                              ) : contentTypeToAdd ===
                                                "document" ? (
                                                <FileText className="w-3 h-3 text-blue-600" />
                                              ) : (
                                                <HelpCircle className="w-3 h-3 text-purple-600" />
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                          <Input
                                            label="Content Title"
                                            placeholder="Enter content title"
                                            value={newContent.title}
                                            onChange={(e) =>
                                              setNewContent({
                                                ...newContent,
                                                title: e.target.value,
                                              })
                                            }
                                            required
                                          />
                                          <TextArea
                                            label="Description"
                                            placeholder="Enter content description"
                                            value={newContent.description}
                                            onChange={(e) =>
                                              setNewContent({
                                                ...newContent,
                                                description: e.target.value,
                                              })
                                            }
                                            required
                                          />
                                          <CheckBoxContainer
                                            label="Active Content"
                                            description="Enable this content for students to access"
                                            checked={newContent.isActive}
                                            onChange={(checked) =>
                                              setNewContent({
                                                ...newContent,
                                                isActive: checked,
                                              })
                                            }
                                          />

                                          {/* Video Upload for Video Content */}
                                          {contentTypeToAdd === "video" && (
                                            <>
                                              <UploadMediaContainer
                                                title="Video Content"
                                                description="Upload video file or add video URL"
                                                type="video"
                                                mediaUrl={newContent.videoUrl}
                                                mediaSource={
                                                  newContent.videoSource
                                                }
                                                s3Key={newContent.videoS3Key}
                                                folderName={contentFolderName}
                                                uploadContext={`${
                                                  newContent.title || "content"
                                                }-${lesson.title || "lesson"}`}
                                                onFileUpload={
                                                  handleContentVideoUpload
                                                }
                                                onFileRemove={
                                                  handleContentVideoRemove
                                                }
                                                onUrlSubmit={
                                                  handleContentVideoUrlSubmit
                                                }
                                                allowUrlInput={true}
                                                maxSize={10000}
                                                className="w-full"
                                                required
                                                isUploading={isUploadingVideo}
                                              />
                                              <UploadMediaContainer
                                                title="Video Thumbnail (Optional)"
                                                description="Upload a thumbnail image for this video"
                                                type="image"
                                                mediaUrl={
                                                  newContent.videoThumbnailUrl
                                                }
                                                mediaSource={
                                                  newContent.videoThumbnailSource
                                                }
                                                s3Key={
                                                  newContent.videoThumbnailS3Key
                                                }
                                                folderName={contentFolderName}
                                                uploadContext={`${
                                                  newContent.title || "content"
                                                }-thumbnail-${
                                                  lesson.title || "lesson"
                                                }`}
                                                onFileUpload={
                                                  handleContentVideoThumbnailUpload
                                                }
                                                onFileRemove={
                                                  handleContentVideoThumbnailRemove
                                                }
                                                onUrlSubmit={
                                                  handleContentVideoThumbnailUrlSubmit
                                                }
                                                allowUrlInput={true}
                                                maxSize={10}
                                                className="w-full"
                                                isUploading={
                                                  isUploadingVideoThumbnail
                                                }
                                              />
                                              <Input
                                                label="Video Duration (in seconds)"
                                                placeholder="Enter duration in seconds (e.g., 150 for 2 minutes 30 seconds)"
                                                value={newContent.videoDuration}
                                                onChange={(e) =>
                                                  setNewContent({
                                                    ...newContent,
                                                    videoDuration:
                                                      e.target.value,
                                                  })
                                                }
                                                required
                                                className="w-full"
                                              />
                                            </>
                                          )}

                                          {/* Document Upload for Document Content */}
                                          {contentTypeToAdd === "document" && (
                                            <UploadMediaContainer
                                              title="Document Content"
                                              description="Upload document file or add document URL"
                                              type="document"
                                              mediaUrl={newContent.documentUrl}
                                              mediaSource={
                                                newContent.documentSource
                                              }
                                              s3Key={newContent.documentS3Key}
                                              folderName={contentFolderName}
                                              uploadContext={`${
                                                newContent.title || "content"
                                              }-${lesson.title || "lesson"}`}
                                              onFileUpload={
                                                handleContentDocumentUpload
                                              }
                                              onFileRemove={
                                                handleContentDocumentRemove
                                              }
                                              onUrlSubmit={
                                                handleContentDocumentUrlSubmit
                                              }
                                              allowUrlInput={true}
                                              maxSize={50}
                                              className="w-full"
                                              required
                                              isUploading={isUploadingDocument}
                                            />
                                          )}

                                          {/* Quiz Content - Basic form for now */}
                                          {contentTypeToAdd === "quiz" && (
                                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                              <div className="flex items-center gap-2 mb-2">
                                                <HelpCircle className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm font-medium text-purple-800">
                                                  Quiz Content
                                                </span>
                                              </div>
                                              <p className="text-sm text-purple-700">
                                                Quiz questions and options will
                                                be configured in the next step.
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-end gap-2 mt-4">
                                          <OrangeButton
                                            onClick={() =>
                                              addContent(
                                                lesson._id!,
                                                selectedModule._id!
                                              )
                                            }
                                            disabled={
                                              !newContent.title.trim() ||
                                              !newContent.description.trim() ||
                                              isUploadingVideo ||
                                              isUploadingVideoThumbnail ||
                                              isUploadingDocument ||
                                              isExtractingDuration
                                            }
                                            glow={false}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            {isUploadingVideo ||
                                            isUploadingVideoThumbnail ||
                                            isUploadingDocument ||
                                            isExtractingDuration ? (
                                              <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                {isExtractingDuration
                                                  ? "Extracting duration..."
                                                  : "Uploading..."}
                                              </>
                                            ) : (
                                              `Add ${
                                                contentTypeToAdd
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                contentTypeToAdd.slice(1)
                                              }`
                                            )}
                                          </OrangeButton>
                                          <WhiteButton
                                            onClick={() => {
                                              setIsAddingContent(false);
                                              setContentTypeToAdd(null);
                                            }}
                                            disabled={
                                              isUploadingVideo ||
                                              isUploadingVideoThumbnail ||
                                              isUploadingDocument ||
                                              isExtractingDuration
                                            }
                                            className="text-sm"
                                          >
                                            Cancel
                                          </WhiteButton>
                                        </div>
                                      </div>
                                    )}

                                    {/* Content List */}
                                    {!isEditingContent && (
                                      <div className="space-y-2">
                                        {(lesson.contents as Content[])?.map(
                                          (content) => (
                                            <div
                                              key={content._id}
                                              className="bg-white rounded-lg p-3 border border-gray-200"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
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
