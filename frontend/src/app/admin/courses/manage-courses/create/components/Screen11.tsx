import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import Input from "@/components/ui/inputs/Input";
import React, { useMemo, useState, useEffect } from "react";
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
  Lock,
} from "lucide-react";
import {
  CourseModule,
  CourseLesson,
  Content,
  VideoContent,
  QuizContent,
} from "@/types";
import { useScreen } from "../contexts/ScreenContext";
import ContentSection from "../../create/components/content/ContentSection";
import { useCourses } from "@/hooks/useCourses";
import { InlineLoader } from "@/components/ui/Loader";

const Screen11 = () => {
  const { state, actions } = useCourseContext();
  const { uploadWithPresignedUrl, isUploading } = useUpload();
  const { setActiveScreen } = useScreen();
  const { addSingleCourseModule, updateSingleCourseModule, isLoading: isApiLoading } = useCourses();
  
  // Local state for managing modules
  const [localModules, setLocalModules] = useState<CourseModule[]>([]);
  const [savedModules, setSavedModules] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [expandedContent, setExpandedContent] = useState<Set<string>>(new Set());
  const [savingModule, setSavingModule] = useState<Set<string>>(new Set());

  // Validation checks
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    // Check if at least one module exists
    if (!localModules || localModules.length === 0) {
      errors.push("At least one module is required");
      return errors; // Early return if no modules
    }

    // Validate each module is fully configured
    localModules.forEach((courseModule, moduleIndex) => {
      if (!courseModule) {
        errors.push(`Module ${moduleIndex + 1}: Module data is missing`);
        return;
      }

      // Check module basic requirements
      if (!courseModule.title || courseModule.title.trim() === "") {
        errors.push(`Module ${moduleIndex + 1}: Title is required`);
      }

      if (!courseModule.description || courseModule.description.trim() === "") {
        errors.push(`Module ${moduleIndex + 1}: Description is required`);
      }

      if (!courseModule.thumbnailUrl || courseModule.thumbnailUrl.trim() === "") {
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
              errors.push(
                `Module ${moduleIndex + 1}, Lesson ${
                  lessonIndex + 1
                }, Content ${contentIndex + 1}: Video thumbnail is required`
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

    return errors;
  }, [localModules]);

  // Initialize local modules from course state
  useEffect(() => {
    if (state.course.modules && state.course.modules.length > 0) {
      setLocalModules(state.course.modules);
      // Mark existing modules as saved
      const savedIds = new Set<string>();
      state.course.modules.forEach((module) => {
        if (module._id && !module._id.startsWith('temp_')) {
          savedIds.add(module._id);
        }
      });
      setSavedModules(savedIds);
    }
  }, [state.course.modules]);

  // Debug: Log course state
  useEffect(() => {
    console.log("Course state:", {
      courseId: state.course._id,
      modules: state.course.modules?.length || 0,
      localModules: localModules.length,
      validationErrors: validationErrors.length
    });
  }, [state.course._id, state.course.modules, localModules.length, validationErrors.length]);

  // Helper function to generate a unique ID
  const generateId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Helper function to add a new module locally
  const addModule = () => {
    const newModule: CourseModule = {
      _id: generateId(),
      title: "",
      description: "",
      lessons: [],
      thumbnailUrl: "",
      isActive: true,
      isCompleted: false,
      lessonIds: [],
    };

    // Add the new module to the array
    setLocalModules((prev) => {
      const updatedModules = [...prev, newModule];
      // Get the index of the newly added module
      const newIndex = updatedModules.length - 1;
      // Expand the new module for editing
      setExpandedModules((prev) => new Set([...prev, newIndex]));
      return updatedModules;
    });
  };

  // Helper function to save module to API
  const saveModuleToAPI = async (moduleIndex: number) => {
    const module = localModules[moduleIndex];
    if (!module) return;

    // Check if course ID exists, if not, we need to create the course first
    if (!state.course._id) {
      console.error("Course ID not found. Please create the course first.");
      // You might want to show a toast notification here
      return;
    }

    setSavingModule((prev) => new Set([...prev, module._id!]));

    try {
      // Prepare module data for API (remove temp ID)
      const { _id, ...moduleData } = module;
      
      const response = await addSingleCourseModule(state.course._id, moduleData);
      
      if (response.success && response.module) {
        // Update local module with real ID from API
        const updatedModule = {
          ...module,
          _id: response.module._id,
        };
        
        setLocalModules((prev) => 
          prev.map((m, index) => index === moduleIndex ? updatedModule : m)
        );
        
        setSavedModules((prev) => new Set([...prev, response.module._id]));
        
        // Update course state
        actions.updateCourseModule(module._id!, updatedModule);
        
        // Collapse the module after saving
        setExpandedModules((prev) => {
          const newSet = new Set(prev);
          newSet.delete(moduleIndex);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Failed to save module:", error);
      // You might want to show a toast notification here
    } finally {
      setSavingModule((prev) => {
        const newSet = new Set(prev);
        newSet.delete(module._id!);
        return newSet;
      });
    }
  };

  // Helper function to add a new lesson to a module
  const addLesson = (moduleIndex: number) => {
    const courseModule = localModules[moduleIndex];
    if (!courseModule) return;

    const newLesson: CourseLesson = {
      _id: generateId(),
      title: "",
      description: "",
      contentIds: [],
      contents: [],
    };

    const updatedModule = {
      ...courseModule,
      lessons: [...(courseModule.lessons || []), newLesson],
    };

    setLocalModules((prev) => 
      prev.map((m, index) => index === moduleIndex ? updatedModule : m)
    );

    // Expand the new lesson
    setExpandedLessons((prev) => new Set([...prev, newLesson._id!]));
  };

  // Helper function to add content to a lesson
  const addContent = (lessonId: string, type: "video" | "quiz") => {
    // Generate a default title that meets the requirement
    const contentCount =
      localModules
        .flatMap((m) => m.lessons || [])
        .flatMap((l) => l.contents || [])
        .filter((c) => c.type === type).length + 1;

    const defaultTitle =
      type === "video"
        ? `Video Content ${contentCount}`
        : `Quiz ${contentCount}`;

    const newContent: Content = type === "video"
      ? {
          _id: generateId(),
          title: defaultTitle,
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
        }
      : {
          _id: generateId(),
          title: defaultTitle,
          description: "",
          type: "quiz",
          isCompleted: false,
          questions: [],
          passingScore: 70,
          maxAttempts: 3,
          readingMaterials: [],
        };

    // Find the module and lesson to add content to
    const moduleIndex = findModuleIndexByLessonId(lessonId);
    if (moduleIndex === -1) return;

    const module = localModules[moduleIndex];
    const updatedLessons: CourseLesson[] = (module.lessons || []).map((lesson) =>
      lesson._id === lessonId
        ? { ...lesson, contents: [...(lesson.contents || []), newContent] }
        : lesson
    );

    const updatedModule = {
      ...module,
      lessons: updatedLessons,
    };

    setLocalModules((prev) => 
      prev.map((m, index) => index === moduleIndex ? updatedModule : m)
    );

    // Expand the new content
    setExpandedContent((prev) => new Set([...prev, newContent._id!]));
  };

  // Helper function to find module index by lesson ID
  const findModuleIndexByLessonId = (lessonId: string): number => {
    for (let i = 0; i < localModules.length; i++) {
      const module = localModules[i];
      if ((module.lessons || []).some((lesson) => lesson._id === lessonId)) {
        return i;
      }
    }
    return -1;
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

  // Helper function to update module data
  const updateModuleData = (moduleIndex: number, updates: Partial<CourseModule>) => {
    setLocalModules((prev) => 
      prev.map((m, index) => 
        index === moduleIndex ? { ...m, ...updates } : m
      )
    );
  };

  // Helper function to update lesson data
  const updateLessonData = (lessonId: string, updates: Partial<CourseLesson>) => {
    const moduleIndex = findModuleIndexByLessonId(lessonId);
    if (moduleIndex === -1) return;

    const module = localModules[moduleIndex];
    const updatedLessons: CourseLesson[] = (module.lessons || []).map((lesson) =>
      lesson._id === lessonId ? { ...lesson, ...updates } : lesson
    );

    const updatedModule = {
      ...module,
      lessons: updatedLessons,
    };

    setLocalModules((prev) => 
      prev.map((m, index) => index === moduleIndex ? updatedModule : m)
    );
  };

  // Helper function to update content data
  const updateContentData = (contentId: string, updates: Partial<Content>) => {
    const location = findContentLocation(contentId);
    if (!location) return;

    const { moduleIndex, lessonId } = location;
    const module = localModules[moduleIndex];
    const updatedLessons: CourseLesson[] = (module.lessons || []).map((lesson) =>
      lesson._id === lessonId
        ? {
            ...lesson,
            contents: (lesson.contents || []).map((content) =>
              content._id === contentId ? { ...content, ...updates } as Content : content
            ),
          }
        : lesson
    );

    const updatedModule = {
      ...module,
      lessons: updatedLessons,
    };

    setLocalModules((prev) => 
      prev.map((m, index) => index === moduleIndex ? updatedModule : m)
    );
  };

  // Helper function to delete content data
  const deleteContentData = (contentId: string) => {
    const location = findContentLocation(contentId);
    if (!location) return;

    const { moduleIndex, lessonId } = location;
    const module = localModules[moduleIndex];
    const updatedLessons: CourseLesson[] = (module.lessons || []).map((lesson) =>
      lesson._id === lessonId
        ? {
            ...lesson,
            contents: (lesson.contents || []).filter((content) => content._id !== contentId),
          }
        : lesson
    );

    const updatedModule = {
      ...module,
      lessons: updatedLessons,
    };

    setLocalModules((prev) => 
      prev.map((m, index) => index === moduleIndex ? updatedModule : m)
    );
  };

  // Helper function to find the location of content by content ID
  const findContentLocation = (
    contentId: string
  ): { moduleIndex: number; lessonId: string } | undefined => {
    for (let i = 0; i < localModules.length; i++) {
      const module = localModules[i];
      for (const lesson of module.lessons || []) {
        if ((lesson.contents || []).some((content) => content._id === contentId)) {
          return { moduleIndex: i, lessonId: lesson._id! };
        }
      }
    }
    return undefined;
  };

  // Helper function to handle thumbnail upload
  const handleThumbnailUpload = async (
    moduleIndex: number,
    file: File,
    folderName: string
  ): Promise<string> => {
    try {
      const uploadResponse = await uploadWithPresignedUrl(file, folderName);
      if (uploadResponse.success && uploadResponse.data?.url) {
        const uploadedUrl = uploadResponse.data.url;
        updateModuleData(moduleIndex, {
          thumbnailUrl: uploadedUrl,
          thumbnailSource: "upload",
        });
        return uploadedUrl;
      } else {
        throw new Error(uploadResponse.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  };

  // Helper function to handle thumbnail URL submission
  const handleThumbnailUrlSubmit = (moduleIndex: number, url: string) => {
    updateModuleData(moduleIndex, {
      thumbnailUrl: url,
      thumbnailSource: "url",
    });
  };

  // Helper function to handle thumbnail removal
  const handleThumbnailRemove = (moduleIndex: number) => {
    updateModuleData(moduleIndex, {
      thumbnailUrl: "",
      thumbnailSource: undefined,
    });
  };

  // Helper function to remove a module
  const removeModule = (index: number) => {
    setLocalModules((prev) => prev.filter((_, i) => i !== index));
    
    // Update saved and expanded states
    setSavedModules((prev) => {
      const newSet = new Set(prev);
      const module = localModules[index];
      if (module._id) {
        newSet.delete(module._id);
      }
      return newSet;
    });
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  return (
    <Container
      title="Course Modules & Content"
      description="Create and organize your course modules, lessons, and content"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Course ID Warning */}
      {!state.course._id && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="font-medium mb-2 text-red-800">
            Course Not Created Yet
          </div>
          <p className="text-sm text-red-700">
            Please complete the previous steps to create the course before adding modules.
          </p>
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
              <li key={index} className="text-sm">
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
            className="flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </OrangeButton>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {localModules.map((courseModule, moduleIndex) => {
            if (!courseModule) return null;
            const isSaved = savedModules.has(courseModule._id!);
            const isExpanded = expandedModules.has(moduleIndex);
            const isComplete = isModuleComplete(courseModule);
            const isSaving = savingModule.has(courseModule._id!);

            return (
              <div
                key={moduleIndex}
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
                    {isSaved && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        Saved
                      </span>
                    )}
                    {isSaving && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                        <InlineLoader size="sm" variant="spinner" />
                        Saving...
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
                            updateModuleData(moduleIndex, {
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
                          updateModuleData(moduleIndex, {
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
                        description="Upload a thumbnail image for this module (required)"
                        type="image"
                        mediaUrl={courseModule.thumbnailUrl}
                        mediaSource={courseModule.thumbnailSource}
                        maxSize={10} // 10MB
                        acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
                        onFileUpload={(file, folderName) =>
                          handleThumbnailUpload(
                            moduleIndex,
                            file,
                            folderName
                          )
                        }
                        onFileRemove={() =>
                          handleThumbnailRemove(moduleIndex)
                        }
                        onUrlSubmit={(url) =>
                          handleThumbnailUrlSubmit(moduleIndex, url)
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
                              updateModuleData(moduleIndex, {
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
                          <div className="flex items-center gap-2">
                            {!isSaved && (
                              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                <Lock className="w-3 h-3" />
                                Save module first
                              </div>
                            )}
                            <OrangeButton
                              onClick={() => addLesson(moduleIndex)}
                              disabled={!isSaved || isSaving}
                              className="flex items-center gap-2 px-3 py-1 text-sm"
                            >
                              <Plus className="w-3 h-3" />
                              Add Lesson
                            </OrangeButton>
                          </div>
                        </div>

                        {/* Lessons List */}
                        <div className="space-y-3 pl-4">
                          {(courseModule.lessons || []).map((lesson, lessonIndex) =>
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
                                courseTitle={state.course.title || "untitled"}
                                moduleIndex={moduleIndex}
                                lessonIndex={lessonIndex}
                                isModuleSaved={isSaved}
                              />
                            ) : null
                          )}

                          {(courseModule.lessons || []).length === 0 && (
                            <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                              <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No lessons added yet</p>
                              <p className="text-xs">
                                {!isSaved 
                                  ? "Save the module first to add lessons"
                                  : "Click \"Add Lesson\" to get started"
                                }
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
                            onClick={() => saveModuleToAPI(moduleIndex)}
                            disabled={!isComplete || isSaving || !state.course._id}
                            className="flex items-center gap-2 px-4 py-2"
                          >
                            {isSaving ? (
                              <InlineLoader size="sm" variant="spinner" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {isSaving 
                              ? "Saving..." 
                              : !state.course._id 
                                ? "Course Not Created" 
                                : "Save Module"
                            }
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
                          <span>{(courseModule.lessons || []).length} lessons</span>
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

          {localModules.length === 0 && (
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
        nextButtonText="Review & Submit"
        setActiveScreen={setActiveScreen}
        isNextDisabled={validationErrors.length > 0}
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
  courseTitle?: string;
  moduleIndex?: number;
  lessonIndex?: number;
  isModuleSaved: boolean;
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
  courseTitle,
  moduleIndex,
  lessonIndex,
  isModuleSaved,
}) => {
  const lesson = lessonData;

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
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {(lesson.contents || []).length} items
          </span>
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
              courseTitle={courseTitle}
              moduleIndex={moduleIndex}
              lessonIndex={lessonIndex}
              isLessonSaved={isModuleSaved}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Screen11;
