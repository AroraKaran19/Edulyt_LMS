"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  Plus,
  FileText,
  Video,
  Play,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Upload,
  FileVideo,
  HelpCircle,
  Clock,
  Lock,
  Unlock,
} from "lucide-react";
import { FlexBox } from "@/components/ui";
import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import { useUpload } from "@/hooks/useUpload";
import { useCourses } from "@/hooks/useCourses";
import {
  CourseModule,
  CourseLesson,
  Content,
  VideoContent,
  QuizContent,
} from "@/types/course";
import { useCourseFormContext } from "@/contexts/CourseFormContext";
import { useFormContext } from "react-hook-form";
import { CourseFormData } from "@/types/courseForm";

const Screen11 = () => {
  const { isEditMode, courseId } = useCourseFormContext();
  const { watch } = useFormContext<CourseFormData>();
  
  // LocalStorage key for modules
  const modulesStorageKey = `course_modules_${isEditMode ? courseId : 'new'}`;

  // Watch course title for dynamic folder naming
  const titleValue = watch("title");

  // Dynamic folder naming based on course title
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

  const { uploadFile, deleteFile } = useUpload();
  const { 
    addSingleCourseModule, 
    updateSingleCourseModule, 
    deleteSingleCourseModule, 
    isLoading: isApiLoading 
  } = useCourses();

  // LocalStorage helper functions
  const saveModulesToLocalStorage = (modules: CourseModule[]) => {
    try {
      localStorage.setItem(modulesStorageKey, JSON.stringify(modules));
    } catch (error) {
      console.error("Error saving modules to localStorage:", error);
    }
  };

  const loadModulesFromLocalStorage = (): CourseModule[] => {
    try {
      const stored = localStorage.getItem(modulesStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading modules from localStorage:", error);
      return [];
    }
  };

  const clearModulesFromLocalStorage = () => {
    try {
      localStorage.removeItem(modulesStorageKey);
    } catch (error) {
      console.error("Error clearing modules from localStorage:", error);
    }
  };

  const [modules, setModules] = useState<CourseModule[]>(() => {
    // Initialize modules from localStorage
    if (typeof window !== 'undefined') {
      return loadModulesFromLocalStorage();
    }
    return [];
  });

  // Save modules to localStorage whenever modules change
  useEffect(() => {
    if (typeof window !== 'undefined' && modules.length > 0) {
      saveModulesToLocalStorage(modules);
    }
  }, [modules, modulesStorageKey]);

  // Clear localStorage when switching between create and edit modes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear old localStorage data when mode changes
      const oldKey = `course_modules_${isEditMode ? 'new' : courseId}`;
      localStorage.removeItem(oldKey);
    }
  }, [isEditMode, courseId]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set()
  );
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(
    null
  );
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(
    null
  );
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    thumbnailSource: "url" as "upload" | "url",
    thumbnailS3Key: "",
    isActive: true,
  });
  const [newLesson, setNewLesson] = useState({ title: "", description: "", isActive: true });
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    type: "video" as "video" | "quiz",
    videoUrl: "",
    videoSource: "url" as "upload" | "url",
    videoS3Key: "",
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
      return;
    }

    if (!courseId) {
      console.error("Course ID is required to add a module");
      return;
    }

    try {
      // Prepare module data for API
      const moduleData = {
        title: newModule.title,
        description: newModule.description,
        thumbnailUrl: newModule.thumbnailUrl,
        thumbnailSource: newModule.thumbnailSource,
        thumbnailS3Key: newModule.thumbnailS3Key,
        isCompleted: false,
        isActive: newModule.isActive,
        isLocked: false,
      };

      // Make API call to create module
      const result = await addSingleCourseModule(courseId, moduleData);

			console.log(result);

      if (result.success && result.data) {
        const module: CourseModule = {
          _id: result.data._id,
          title: result.data.title,
          description: result.data.description,
          thumbnailUrl: result.data.thumbnailUrl,
          thumbnailSource: result.data.thumbnailSource || "url",
          thumbnailS3Key: result.data.thumbnailS3Key || "",
          lessonIds: result.data.lessonIds || [],
          isCompleted: result.data.isCompleted || false,
          isActive: result.data.isActive !== undefined ? result.data.isActive : true,
          isLocked: result.data.isLocked || false,
          lessons: [],
        };

        // Add module to local state
        const updatedModules = [...modules, module];
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
      } else {
        console.error("Failed to create module:", result.error || result.message);
      }
    } catch (error) {
      console.error("Error creating module:", error);
    }
  };

  const editModule = async () => {
    if (!editingModule.title.trim()) {
      return;
    }

    if (!courseId || !editingModule._id) {
      console.error("Course ID and Module ID are required to edit a module");
      return;
    }

    try {
      // Prepare module data for API
      const moduleData = {
        title: editingModule.title,
        description: editingModule.description,
        thumbnailUrl: editingModule.thumbnailUrl,
        thumbnailSource: editingModule.thumbnailSource,
        thumbnailS3Key: editingModule.thumbnailS3Key,
        isActive: editingModule.isActive,
      };

      // Make API call to update module
      const result = await updateSingleCourseModule(courseId, editingModule._id, moduleData);

      if (result.success && result.data) {
        // Update module in local state
        const updatedModules = modules.map(module => 
          module._id === editingModule._id 
            ? {
                ...module,
                title: result.data.title,
                description: result.data.description,
                thumbnailUrl: result.data.thumbnailUrl,
                thumbnailSource: result.data.thumbnailSource || "url",
                thumbnailS3Key: result.data.thumbnailS3Key || "",
                isActive: result.data.isActive !== undefined ? result.data.isActive : true,
              }
            : module
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
      } else {
        console.error("Failed to update module:", result.error || result.message);
      }
    } catch (error) {
      console.error("Error updating module:", error);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!courseId) {
      console.error("Course ID is required to delete a module");
      return;
    }

    if (!confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
      return;
    }

    try {
      // Make API call to delete module
      const result = await deleteSingleCourseModule(courseId, moduleId);

      if (result.success) {
        // Remove module from local state
        const updatedModules = modules.filter(module => module._id !== moduleId);
        setModules(updatedModules);
        
        // Save to localStorage
        saveModulesToLocalStorage(updatedModules);
        
        console.log("Module deleted successfully");
      } else {
        console.error("Failed to delete module:", result.error || result.message);
      }
    } catch (error) {
      console.error("Error deleting module:", error);
    }
  };

  const startEditingModule = (module: CourseModule) => {
    setEditingModule({
      _id: module._id || "",
      title: module.title || "",
      description: module.description || "",
      thumbnailUrl: module.thumbnailUrl || "",
      thumbnailSource: module.thumbnailSource || "url",
      thumbnailS3Key: module.thumbnailS3Key || "",
      isActive: module.isActive !== undefined ? module.isActive : true,
    });
    setIsEditingModule(true);
  };

  const addLesson = (moduleId: string) => {
    if (newLesson.title.trim()) {
      const lesson: CourseLesson = {
        _id: Date.now().toString(),
        title: newLesson.title,
        description: newLesson.description,
      contentIds: [],
      moduleId,
      isCompleted: false,
      isActive: newLesson.isActive,
      isLocked: false,
        contents: [],
    };

      const updatedModules = modules.map((module) =>
      module._id === moduleId 
        ? { 
            ...module, 
                lessons: [...(module.lessons || []), lesson],
                lessonIds: [...module.lessonIds, lesson._id!],
          }
        : module
        );
      setModules(updatedModules);
      
      // Save to localStorage
      saveModulesToLocalStorage(updatedModules);

      setNewLesson({ title: "", description: "", isActive: true });
      setIsAddingLesson(false);
    }
  };

  const addContent = (lessonId: string, moduleId: string) => {
    if (newContent.title.trim()) {
      const content: Content =
        newContent.type === "video"
          ? ({
              _id: Date.now().toString(),
              title: newContent.title,
              description: newContent.description,
              type: "video",
              sources: [
                {
                  quality: "720p",
                  videoUrl: newContent.videoUrl,
                  videoSource: newContent.videoSource,
                  videoS3Key: newContent.videoS3Key,
                },
              ],
          isCompleted: false,
          isActive: newContent.isActive,
          isLocked: false,
          lessonId,
            } as VideoContent)
          : ({
              _id: Date.now().toString(),
              title: newContent.title,
              description: newContent.description,
              type: "quiz",
          questions: [],
          isCompleted: false,
          isActive: newContent.isActive,
          isLocked: false,
              lessonId,
            } as QuizContent);

      const updatedModules = modules.map((module) =>
      module._id === moduleId 
        ? {
            ...module,
                lessons: module.lessons?.map((lesson) =>
              lesson._id === lessonId
                ? {
                    ...lesson,
                        contents: [...(lesson.contents || []), content],
                        contentIds: [...lesson.contentIds, content._id!],
                  }
                : lesson
                ),
          }
        : module
        );
      setModules(updatedModules);
      
      // Save to localStorage
      saveModulesToLocalStorage(updatedModules);

      setNewContent({
        title: "",
        description: "",
        type: "video",
        videoUrl: "",
        videoSource: "url",
        videoS3Key: "",
        isActive: true,
      });
      setIsAddingContent(false);
    }
  };


  const deleteLesson = (moduleId: string, lessonId: string) => {
    const updatedModules = modules.map((module) =>
      module._id === moduleId
        ? {
            ...module,
            lessons: module.lessons?.filter(
              (lesson) => lesson._id !== lessonId
            ),
            lessonIds: module.lessonIds.filter((_id) => _id !== lessonId),
          }
        : module
    );
    setModules(updatedModules);
    
    // Save to localStorage
    saveModulesToLocalStorage(updatedModules);
  };

  const deleteContent = (
    moduleId: string,
    lessonId: string,
    contentId: string
  ) => {
    const updatedModules = modules.map((module) =>
      module._id === moduleId
        ? {
            ...module,
            lessons: module.lessons?.map((lesson) =>
              lesson._id === lessonId
                ? {
                    ...lesson,
                    contents: lesson.contents?.filter(
                      (content) => content._id !== contentId
                    ),
                    contentIds: lesson.contentIds.filter(
                      (_id) => _id !== contentId
                    ),
                  }
                : lesson
            ),
          }
        : module
    );
    setModules(updatedModules);
    
    // Save to localStorage
    saveModulesToLocalStorage(updatedModules);
  };

  // Upload handlers
  const handleModuleThumbnailUpload = async (
    file: File,
    folderName: string
  ) => {
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
    try {
      const result = await uploadFile(file, folderName);
      if (result.success && result.data) {
        setNewContent((prev) => ({
          ...prev,
          videoUrl: result.data!.url,
          videoSource: "upload",
          videoS3Key: result.data!.s3Key,
        }));
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Error uploading content video:", error);
      throw error;
    }
  };

  const handleContentVideoRemove = () => {
    setNewContent((prev) => ({
      ...prev,
      videoUrl: "",
      videoSource: "url",
      videoS3Key: "",
    }));
  };

  const handleContentVideoUrlSubmit = (url: string) => {
    setNewContent((prev) => ({
      ...prev,
      videoUrl: url,
      videoSource: "url",
      videoS3Key: "",
    }));
  };

  return (
    <Container
      title="Course Modules & Content"
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
            <FlexBox className="flex-col gap-4">
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
              />
              <CheckBoxContainer
                label="Active Module"
                description="Enable this module for students to access"
                checked={newModule.isActive}
                onChange={(checked) =>
                  setNewModule({ ...newModule, isActive: checked })
                }
              />
            </FlexBox>
            <div className="flex gap-2 mt-4">
              <OrangeButton 
                onClick={addModule}
                disabled={isApiLoading || !newModule.title.trim()}
                glow={false}
                className="flex items-center gap-2"
              >
                {isApiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Module...
                  </>
                ) : (
                  "Add Module"
                )}
              </OrangeButton>
              <WhiteButton 
                onClick={() => setIsAddingModule(false)}
                disabled={isApiLoading}
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
            <FlexBox className="flex-col gap-4">
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
                  setEditingModule({ ...editingModule, description: e.target.value })
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
                    const url = await handleModuleThumbnailUpload(file, folderName);
                    if (url) {
                      setEditingModule(prev => ({
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
                  setEditingModule(prev => ({
                    ...prev,
                    thumbnailUrl: "",
                    thumbnailSource: "url",
                    thumbnailS3Key: "",
                  }));
                }}
                onUrlSubmit={(url) => {
                  setEditingModule(prev => ({
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
            </FlexBox>
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
          <FlexBox className="w-full flex-col items-center justify-center py-16 px-4 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-lg">
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
          </FlexBox>
        ) : (
          /* Modules List - Only show when modules exist */
          <div className="space-y-4">
            {modules.map((module) => (
              <div
                key={module._id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                {/* Module Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleModuleExpansion(module._id!)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedModules.has(module._id!) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {module.thumbnailUrl ? (
                          <img
                            src={module.thumbnailUrl}
                            alt={module.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {module.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {module.lessons?.length || 0} lessons
                      </span>
                      <button
                        onClick={() => startEditingModule(module)}
                        disabled={isApiLoading}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      >
                        <Edit3 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => deleteModule(module._id!)}
                        disabled={isApiLoading}
                        className="p-1 hover:bg-red-100 rounded disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Module Content */}
                {expandedModules.has(module._id!) && (
                  <div className="p-4">
                    {/* Add Lesson Button */}
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-700">
                        Lessons
                      </h4>
                      <WhiteButton
                        onClick={() => setIsAddingLesson(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Lesson
                      </WhiteButton>
                    </div>

                    {/* Add Lesson Form */}
                    {isAddingLesson && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                        <h4 className="text-md font-medium text-gray-800 mb-3">
                          Add New Lesson
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          />
                          <div className="flex items-end gap-2">
                            <WhiteButton onClick={() => addLesson(module._id!)}>
                              Add Lesson
                            </WhiteButton>
                            <WhiteButton
                              onClick={() => setIsAddingLesson(false)}
                            >
                              Cancel
                            </WhiteButton>
                          </div>
                        </div>
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
                        className="mt-4"
                      />
                      <CheckBoxContainer
                        label="Active Lesson"
                        description="Enable this lesson for students to access"
                        checked={newLesson.isActive}
                        onChange={(checked) =>
                          setNewLesson({ ...newLesson, isActive: checked })
                        }
                        className="mt-4"
                      />
                      </div>
                    )}

                    {/* Lessons List */}
                    <div className="space-y-3">
                      {module.lessons?.map((lesson) => (
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
                                  onClick={() => setSelectedLesson(lesson)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Edit3 className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={() =>
                                    deleteLesson(module._id!, lesson._id!)
                                  }
                                  className="p-1 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Lesson Content */}
                          {expandedLessons.has(lesson._id!) && (
                            <div className="p-3">
                              {/* Add Content Button */}
                              <div className="flex justify-between items-center mb-3">
                                <h6 className="text-md font-medium text-gray-700">
                                  Content
                                </h6>
                                <WhiteButton
                                  onClick={() => setIsAddingContent(true)}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Content
                                </WhiteButton>
                              </div>

                              {/* Add Content Form */}
                              {isAddingContent && (
                                <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                                  <h6 className="text-sm font-medium text-gray-800 mb-2">
                                    Add New Content
                                  </h6>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                    />
                                    <div className="flex items-center gap-2">
                                      <label className="text-sm font-medium text-gray-700">
                                        Type:
                                      </label>
                                      <select
                                        value={newContent.type}
                                        onChange={(e) =>
                                          setNewContent({
                                            ...newContent,
                                            type: e.target.value as
                                              | "video"
                                              | "quiz",
                                          })
                                        }
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                      >
                                        <option value="video">Video</option>
                                        <option value="quiz">Quiz</option>
                                      </select>
                                    </div>
                                  </div>
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
                                    className="mt-3"
                                  />
                                  <CheckBoxContainer
                                    label="Active Content"
                                    description="Enable this content for students to access"
                                    checked={newContent.isActive}
                                    onChange={(checked) =>
                                      setNewContent({ ...newContent, isActive: checked })
                                    }
                                    className="mt-3"
                                  />

                                  {/* Video Upload for Video Content */}
                                  {newContent.type === "video" && (
                                    <div className="mt-3">
                                      <UploadMediaContainer
                                        title="Video Content"
                                        description="Upload video file or add video URL"
                                        type="video"
                                        mediaUrl={newContent.videoUrl}
                                        mediaSource={newContent.videoSource}
                                        s3Key={newContent.videoS3Key}
                                        folderName={contentFolderName}
                                        uploadContext={`${
                                          newContent.title || "content"
                                        }-${lesson.title || "lesson"}`}
                                        onFileUpload={handleContentVideoUpload}
                                        onFileRemove={handleContentVideoRemove}
                                        onUrlSubmit={
                                          handleContentVideoUrlSubmit
                                        }
                                        allowUrlInput={true}
                                        maxSize={500}
                                        className="w-full"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-end gap-2 mt-3">
                                    <WhiteButton
                                      onClick={() =>
                                        addContent(lesson._id!, module._id!)
                                      }
                                      className="text-sm"
                                    >
                                      Add Content
                                    </WhiteButton>
                                    <WhiteButton
                                      onClick={() => setIsAddingContent(false)}
                                      className="text-sm"
                                    >
                                      Cancel
                                    </WhiteButton>
                                  </div>
                                </div>
                              )}

                              {/* Content List */}
                              <div className="space-y-2">
                                {lesson.contents?.map((content) => (
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
                                              : "bg-purple-100"
                                          }`}
                                        >
                                          {content.type === "video" ? (
                                            <FileVideo className="w-3 h-3 text-green-600" />
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
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 capitalize">
                                          {content.type}
                                        </span>
                                        <button
                                          onClick={() =>
                                            setSelectedContent(content)
                                          }
                                          className="p-1 hover:bg-gray-200 rounded"
                                        >
                                          <Edit3 className="w-3 h-3 text-gray-600" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            deleteContent(
                                              module._id!,
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
                                      (content as VideoContent).sources?.[0]
                                        ?.videoUrl && (
                                        <div className="mt-3">
                                          <video
                                            src={
                                              (content as VideoContent)
                                                .sources[0].videoUrl
                                            }
                                            className="w-full max-w-xs h-32 object-cover rounded border"
                                            controls
                                          />
                                        </div>
                                      )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
