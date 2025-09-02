import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import { useEditCourseContext } from "../../../reducers/course/providers/EditCourseReducerProvider";
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
} from "lucide-react";
import {
  CourseModule,
  CourseLesson,
  Content,
  VideoContent,
  QuizContent,
} from "@/types";
import { useEditScreen } from "../contexts/EditScreenContext";
import ContentSection from "../../create/components/content/ContentSection";

const Screen7 = () => {
  const { state, actions } = useEditCourseContext();
  const { uploadFile, isUploading } = useUpload();
  const { setActiveScreen } = useEditScreen();
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

  // Validation checks
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    // Check if at least one module exists
    if (!state.course.modules || state.course.modules.length === 0) {
      errors.push("At least one module is required");
      return errors; // Early return if no modules
    }

    // Validate each module is fully configured
    state.course.modules.forEach((courseModule, moduleIndex) => {
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

      if (
        !courseModule.thumbnailUrl ||
        courseModule.thumbnailUrl.trim() === ""
      ) {
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
  const generateId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Helper function to add a new module
  const addModule = () => {
    const newModule: CourseModule = {
      _id: generateId(),
      title: "",
      description: "",
      lessons: [], // Now store full lesson objects
      thumbnailUrl: "",
      isActive: true,
    };

    // Use the proper action to add the module with full object
    actions.addCourseModule(newModule);

    const newIndex = (state.course.modules || []).length;
    setExpandedModules((prev) => new Set([...prev, newIndex]));
  };

  // Helper function to add a new lesson to a module
  const addLesson = (moduleIndex: number) => {
    const courseModule = state.course.modules?.[moduleIndex];
    if (!courseModule) return;

    const newLesson: CourseLesson = {
      _id: generateId(),
      title: "",
      description: "",
      contents: [], // Now store full content objects
    };

    // Use the proper action to add the lesson
    actions.addCourseLesson(courseModule._id!, newLesson);

    // Expand the new lesson
    setExpandedLessons((prev) => new Set([...prev, newLesson._id!]));
  };

  // Helper function to add content to a lesson
  const addContent = (lessonId: string, type: "video" | "quiz") => {
    // Generate a default title that meets the requirement
    const contentCount =
      state.course.modules
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
            title: defaultTitle,
            description: "",
            type: "video",
            sources: [
              {
                quality: "1080p" as const,
                videoUrl: "",
                videoSource: undefined,
                videoS3Key: "",
              },
            ],
            thumbnailUrl: "",
            thumbnailSource: undefined,
            thumbnailS3Key: "",
            duration: 0,
            readingMaterials: [],
          } as VideoContent)
        : ({
            _id: generateId(),
            title: defaultTitle,
            description: "",
            type: "quiz",
            questions: [],
            passingScore: 70,
            maxAttempts: 3,
            readingMaterials: [],
          } as QuizContent);

    // Find the module and lesson to add content to
    const moduleId = findModuleIdByLessonId(lessonId);
    if (!moduleId) return;

    // Use the proper action to add the content
    actions.addCourseContent(moduleId, lessonId, newContent);

    // Expand the new content
    setExpandedContent((prev) => new Set([...prev, newContent._id!]));
  };

  // Helper function to find module ID by lesson ID
  const findModuleIdByLessonId = (lessonId: string): string | undefined => {
    for (const courseModule of state.course.modules) {
      if (courseModule.lessons.some((lesson) => lesson._id === lessonId)) {
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

  // Helper function to update module data
  const updateModuleData = (
    moduleId: string,
    updates: Partial<CourseModule>
  ) => {
    actions.updateCourseModule(moduleId, updates);
  };

  // Helper function to update lesson data
  const updateLessonData = (
    lessonId: string,
    updates: Partial<CourseLesson>
  ) => {
    const moduleId = findModuleIdByLessonId(lessonId);
    if (moduleId) {
      actions.updateCourseLesson(moduleId, lessonId, updates);
    }
  };

  // Helper function to update content data
  const updateContentData = (contentId: string, updates: Partial<Content>) => {
    const location = findContentLocation(contentId);
    if (!location) return;

    const { moduleId, lessonId } = location;
    actions.updateCourseContent(moduleId, lessonId, contentId, updates);
  };

  // Helper function to delete content data
  const deleteContentData = (contentId: string) => {
    const location = findContentLocation(contentId);
    if (!location) return;

    const { moduleId, lessonId } = location;
    actions.deleteCourseContent(moduleId, lessonId, contentId);
  };

  // Helper function to find the location of content by content ID
  const findContentLocation = (
    contentId: string
  ): { moduleId: string; lessonId: string } | undefined => {
    for (const courseModule of state.course.modules) {
      for (const lesson of courseModule.lessons) {
        if (lesson.contents.some((content) => content._id === contentId)) {
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
    folderName: string
  ): Promise<string> => {
    try {
      const uploadResponse = await uploadFile(file, folderName);
      if (uploadResponse.success && uploadResponse.data?.url) {
        const uploadedUrl = uploadResponse.data.url;
        updateModuleData(moduleId, {
          thumbnailUrl: uploadedUrl,
          thumbnailSource: "upload",
          thumbnailS3Key: uploadResponse.data.s3Key || "",
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
  const handleThumbnailUrlSubmit = (moduleId: string, url: string) => {
    updateModuleData(moduleId, {
      thumbnailUrl: url,
      thumbnailSource: "url",
      thumbnailS3Key: "",
    });
  };

  // Helper function to handle thumbnail removal
  const handleThumbnailRemove = (moduleId: string) => {
    updateModuleData(moduleId, {
      thumbnailUrl: "",
      thumbnailSource: undefined,
      thumbnailS3Key: "",
    });
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
          {(state.course.modules || []).map((courseModule, moduleIndex) => {
            if (!courseModule) return null;
            const isSaved = savedModules.has(moduleIndex);
            const isExpanded = expandedModules.has(moduleIndex);
            const isComplete = isModuleComplete(courseModule);

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
                    {isSaved && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        Saved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {courseModule.lessons.length} lessons
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
                        description="Upload a thumbnail image for this module (required)"
                        type="image"
                        mediaUrl={courseModule.thumbnailUrl}
                        mediaSource={courseModule.thumbnailSource}
                        s3Key={courseModule.thumbnailS3Key}
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
                            className="flex items-center gap-2 px-3 py-1 text-sm"
                          >
                            <Plus className="w-3 h-3" />
                            Add Lesson
                          </OrangeButton>
                        </div>

                        {/* Lessons List */}
                        <div className="space-y-3 pl-4">
                          {courseModule.lessons.map((lesson, lessonIndex) =>
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
                              />
                            ) : null
                          )}

                          {courseModule.lessons.length === 0 && (
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
                          {courseModule.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{courseModule.lessons.length} lessons</span>
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
        currentStep={7}
        previousScreen="screen6"
        nextScreen="screen8"
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
            {lesson.contents.length} items
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
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Screen7;
