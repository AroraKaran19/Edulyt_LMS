import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useMemo, useState, useEffect } from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";
import AlertBanner from "@/components/ui/AlertBanner";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
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
} from "lucide-react";
import {
  CourseModule,
  CourseLesson,
  Content,
  Video as VideoType,
  Quiz,
} from "@/types/course";
import ContentSection from "./content/ContentSection";

const Screen7 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const { uploadFile, isUploading } = useUpload();
  const [savedModules, setSavedModules] = useState<Set<number>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [expandedContent, setExpandedContent] = useState<Set<string>>(new Set());
  const [moduleData, setModuleData] = useState<Map<string, CourseModule>>(new Map());
  const [lessonData, setLessonData] = useState<Map<string, CourseLesson>>(new Map());
  const [contentData, setContentData] = useState<Map<string, Content>>(new Map());

  // Validation checks
  const validationErrors = useMemo(() => {
    const errors = [];
    if (!state.course.modules || state.course.modules.length === 0)
      errors.push("At least one module is required");
    return errors;
  }, [state.course]);

  // Initialize saved modules state when modules are loaded
  useEffect(() => {
    const modules = state.course.modules || [];
    const savedIndices = new Set<number>();
    
    modules.forEach((moduleId, index) => {
      // Consider a module as saved if it has a title (basic requirement)
      if (moduleId) {
        savedIndices.add(index);
      }
    });
    
    setSavedModules(savedIndices);
  }, [state.course.modules]);

  // Helper function to generate a unique ID
  const generateId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Helper function to add a new module
  const addModule = () => {
    const newModule: CourseModule = {
      _id: generateId(),
      title: "",
      description: "",
      lessonIds: [],
      thumbnailUrl: "",
      isActive: true,
    };
    
    const currentModules = state.course.modules || [];
    const newIndex = currentModules.length;
    actions.updateCourseField("modules", [...currentModules, newModule._id!]);
    
    // Store the module data (you might need to add this to your reducer)
    // For now, we'll work with a local state approach
    setExpandedModules((prev) => new Set([...prev, newIndex]));
  };

  // Helper function to add a new lesson to a module
  const addLesson = (moduleIndex: number) => {
    const moduleId = state.course.modules?.[moduleIndex];
    if (!moduleId) return;

    const newLesson: CourseLesson = {
      _id: generateId(),
      title: "",
      description: "",
      moduleId: moduleId,
      contentIds: [],
    };

    // Store lesson data
    setLessonData(prev => {
      const newMap = new Map(prev);
      newMap.set(newLesson._id!, newLesson);
      return newMap;
    });

    // Update module's lesson IDs
    updateModuleData(moduleId, {
      lessonIds: [...(getModuleData(moduleId).lessonIds || []), newLesson._id!]
    });

    // Expand the new lesson
    setExpandedLessons((prev) => new Set([...prev, newLesson._id!]));
  };

  // Helper function to add content to a lesson
  const addContent = (lessonId: string, type: "video" | "quiz") => {
    const newContent: Content = {
      _id: generateId(),
      title: "",
      description: "",
      type,
      content: type === "video" 
        ? {
            sources: [{ quality: "1080p", videoUrl: "" }],
            thumbnailUrl: "",
            duration: 0,
          } as VideoType
        : {
            questions: [],
            passingScore: 70,
            maxAttempts: 3,
          } as Quiz,
      readingMaterials: [],
    };

    // Store content data
    setContentData(prev => {
      const newMap = new Map(prev);
      newMap.set(newContent._id!, newContent);
      return newMap;
    });

    // Update lesson's content IDs
    updateLessonData(lessonId, {
      contentIds: [...(getLessonData(lessonId).contentIds || []), newContent._id!]
    });

    // Expand the new content
    setExpandedContent((prev) => new Set([...prev, newContent._id!]));
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
  const isModuleComplete = (module: CourseModule) => {
    return module.title && module.description && module.thumbnailUrl;
  };

  // Helper function to update module data
  const updateModuleData = (moduleId: string, updates: Partial<CourseModule>) => {
    setModuleData(prev => {
      const newMap = new Map(prev);
      const currentModule = newMap.get(moduleId) || {
        _id: moduleId,
      title: "",
      description: "",
        lessonIds: [],
        thumbnailUrl: "",
        isActive: true,
    };
      newMap.set(moduleId, { ...currentModule, ...updates });
      return newMap;
    });
  };

  // Helper function to get module data
  const getModuleData = (moduleId: string): CourseModule => {
    return moduleData.get(moduleId) || {
      _id: moduleId,
      title: "",
      description: "",
      lessonIds: [],
      thumbnailUrl: "",
      isActive: true,
    };
  };

  // Helper function to update lesson data
  const updateLessonData = (lessonId: string, updates: Partial<CourseLesson>) => {
    setLessonData(prev => {
      const newMap = new Map(prev);
      const currentLesson = newMap.get(lessonId) || {
        _id: lessonId,
        title: "",
        description: "",
        moduleId: "",
        contentIds: [],
      };
      newMap.set(lessonId, { ...currentLesson, ...updates });
      return newMap;
    });
  };

  // Helper function to get lesson data
  const getLessonData = (lessonId: string): CourseLesson => {
    return lessonData.get(lessonId) || {
      _id: lessonId,
      title: "",
      description: "",
      moduleId: "",
      contentIds: [],
    };
  };

  // Helper function to update content data
  const updateContentData = (contentId: string, updates: Partial<Content>) => {
    setContentData(prev => {
      const newMap = new Map(prev);
      const currentContent = newMap.get(contentId) || {
        _id: contentId,
        title: "",
        description: "",
        type: "video" as const,
        content: {
          sources: [{ quality: "1080p", videoUrl: "" }],
          thumbnailUrl: "",
          duration: 0,
        } as VideoType,
      };
      newMap.set(contentId, { ...currentContent, ...updates });
      return newMap;
    });
  };

  // Helper function to get content data
  const getContentData = (contentId: string): Content => {
    return contentData.get(contentId) || {
      _id: contentId,
      title: "",
      description: "",
      type: "video",
      content: {
        sources: [{ quality: "1080p", videoUrl: "" }],
            thumbnailUrl: "",
        duration: 0,
      } as VideoType,
    };
  };

  // Helper function to handle thumbnail upload
  const handleThumbnailUpload = async (moduleId: string, file: File, folderName: string): Promise<string> => {
    try {
      const uploadResponse = await uploadFile(file, folderName);
      if (uploadResponse.success && uploadResponse.data?.url) {
        const uploadedUrl = uploadResponse.data.url;
        updateModuleData(moduleId, { thumbnailUrl: uploadedUrl });
        return uploadedUrl;
      } else {
        throw new Error(uploadResponse.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  };

  // Helper function to handle thumbnail removal
  const handleThumbnailRemove = (moduleId: string) => {
    updateModuleData(moduleId, { thumbnailUrl: "" });
  };

  // Helper function to save a module
  const saveModule = (index: number) => {
    setSavedModules((prev) => new Set([...prev, index]));
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  // Helper function to remove a module
  const removeModule = (index: number) => {
    const currentModules = state.course.modules || [];
    const updatedModules = currentModules.filter((_, i) => i !== index);
    actions.updateCourseField("modules", updatedModules);

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
  };

  return (
    <Container
      title="Course Modules & Content"
      description="Create and organize your course modules, lessons, and content"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Validation Feedback */}
      {validationErrors.length > 0 && (
        <AlertBanner
          message={`Please complete: ${validationErrors.join(", ")}`}
          type="info"
          className="mb-4"
        />
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
          {(state.course.modules || []).map((moduleId, moduleIndex) => {
            if (!moduleId) return null;
            const isSaved = savedModules.has(moduleIndex);
            const isExpanded = expandedModules.has(moduleIndex);
            const module = getModuleData(moduleId);
            const isComplete = isModuleComplete(module);

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
                      {module.title || `Module ${moduleIndex + 1}`}
                    </h4>
                    {isSaved && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        Saved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {module.lessonIds.length} lessons
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
                          value={module.title}
                          onChange={(e) => {
                            updateModuleData(moduleId, { title: e.target.value });
                          }}
                          required
                        />
                      </div>

                      <TextArea
                        label="Module Description"
                        placeholder="Describe what students will learn in this module"
                        value={module.description || ""}
                        onChange={(e) => {
                          updateModuleData(moduleId, { description: e.target.value });
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
                        mediaUrl={module.thumbnailUrl}
                        maxSize={10} // 10MB
                        acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
                        onFileUpload={(file, folderName) => handleThumbnailUpload(moduleId, file, folderName)}
                        onFileRemove={() => handleThumbnailRemove(moduleId)}
                        isUploading={isUploading}
                        required={true}
                        allowUrlInput={true}
                        onUrlSubmit={(url) => updateModuleData(moduleId, { thumbnailUrl: url })}
                        folderName={`courses/${state.course.title || 'untitled'}/modules`}
                        uploadContext={`module-${moduleIndex + 1}`}
                        className="w-full"
                      />

                      {/* Module Settings */}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={module.isActive}
                            onChange={(e) => {
                              updateModuleData(moduleId, { isActive: e.target.checked });
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
                            className="flex items-center gap-2 px-3 py-1 text-sm"
                          >
                            <Plus className="w-3 h-3" />
                            Add Lesson
                          </OrangeButton>
                        </div>

                        {/* Lessons List */}
                        <div className="space-y-3 pl-4">
                          {module.lessonIds.map((lessonId, lessonIndex) => 
                            lessonId ? (
                              <LessonItem
                                key={lessonId}
                                lessonId={lessonId}
                                lessonData={getLessonData(lessonId)}
                                isExpanded={expandedLessons.has(lessonId)}
                                onToggleExpansion={() => toggleLessonExpansion(lessonId)}
                                onUpdateLesson={updateLessonData}
                                onAddContent={addContent}
                                expandedContent={expandedContent}
                                onToggleContentExpansion={toggleContentExpansion}
                                getContentData={getContentData}
                                onUpdateContent={updateContentData}
                                courseTitle={state.course.title || "untitled"}
                                moduleIndex={moduleIndex}
                                lessonIndex={lessonIndex}
                              />
                            ) : null
                          )}

                          {module.lessonIds.length === 0 && (
                            <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                              <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No lessons added yet</p>
                              <p className="text-xs">Click "Add Lesson" to get started</p>
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
                          disabled={!isComplete}
                          className="flex items-center gap-2 px-4 py-2"
                        >
                          <Save className="w-4 h-4" />
                          Save Module
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
                          {module.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{module.lessonIds.length} lessons</span>
                          <span className={module.isActive ? "text-green-600" : "text-red-600"}>
                            {module.isActive ? "Active" : "Inactive"}
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
              <p className="text-sm">Click "Add Module" to get started</p>
            </div>
          )}
        </div>
      </div>

      <ScreenNavigation
        currentStep={7}
        previousScreen="screen6"
        nextScreen="screen8"
        nextButtonText="Review & Submit"
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
  getContentData: (contentId: string) => Content;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  courseTitle?: string;
  moduleIndex?: number;
  lessonIndex?: number;
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
  getContentData,
  onUpdateContent,
  courseTitle,
  moduleIndex,
  lessonIndex,
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
            {lesson.contentIds.length} items
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
              contentIds={lesson.contentIds.filter((id): id is string => !!id)}
              expandedContent={expandedContent}
              onToggleContentExpansion={onToggleContentExpansion}
              getContentData={getContentData}
              onUpdateContent={onUpdateContent}
              onAddContent={onAddContent}
              courseTitle={courseTitle}
              moduleIndex={moduleIndex}
              lessonIndex={lessonIndex}
            />
          </div>
        </div>
      )}
    </div>
  );
};



export default Screen7;