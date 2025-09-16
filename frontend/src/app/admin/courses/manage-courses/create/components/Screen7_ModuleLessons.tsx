import Container from "@/app/admin/components/ui/Container";
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
  Layers,
  Video,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  CourseModule,
  CourseLesson,
  Content,
  VideoContent,
  QuizContent,
} from "@/types";
import ContentSection from "./content/ContentSection";
import { useScreen } from "../contexts/ScreenContext";
import AlertBanner from "@/components/ui/AlertBanner";

const Screen7_ModuleLessons = () => {
  const { state, actions } = useCourseContext();
  const { uploadWithPresignedUrl, isUploading } = useUpload();
  const { setActiveScreen } = useScreen();
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

  // Generate folder names based on course title
  const courseTitle = state.course.title || "untitled-course";

  // Handle module thumbnail upload
  const handleModuleThumbnailUpload = async (
    file: File,
    folderName: string
  ): Promise<string> => {
    try {
      const result = await uploadWithPresignedUrl(file, folderName);
      if (result.success && result.data) {
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    } catch (error) {
      console.error("Module thumbnail upload failed:", error);
      throw error;
    }
  };

  // Add new module
  const addModule = () => {
    const newModule: CourseModule = {
      title: "",
      description: "",
      thumbnailUrl: "",
      thumbnailSource: undefined,
      thumbnailS3Key: "",
      lessons: [],
      isLocked: false,
    };
    const currentModules = [...(state.course.modules || [])];
    currentModules.push(newModule);
    actions.updateCourseField("modules", currentModules);
  };

  // Remove module
  const removeModule = (moduleIndex: number) => {
    if (window.confirm("Are you sure you want to remove this module?")) {
      const currentModules = state.course.modules || [];
      const updatedModules = currentModules.filter(
        (_, index) => index !== moduleIndex
      );
      actions.updateCourseField("modules", updatedModules);
      setSavedModules((prev) => {
        const newSet = new Set(prev);
        newSet.delete(moduleIndex);
        return newSet;
      });
    }
  };

  // Update module field
  const updateModuleField = (
    moduleIndex: number,
    field: string,
    value: any
  ) => {
    const currentModules = [...(state.course.modules || [])];
    currentModules[moduleIndex] = {
      ...currentModules[moduleIndex],
      [field]: value,
    };
    actions.updateCourseField("modules", currentModules);
  };

  // Save module (mark as saved)
  const saveModule = (moduleIndex: number) => {
    setSavedModules((prev) => new Set(prev).add(moduleIndex));
  };

  // Toggle module expansion
  const toggleModuleExpansion = (moduleIndex: number) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleIndex)) {
        newSet.delete(moduleIndex);
      } else {
        newSet.add(moduleIndex);
      }
      return newSet;
    });
  };

  // Toggle lesson expansion
  const toggleLessonExpansion = (moduleIndex: number, lessonIndex: number) => {
    const lessonKey = `${moduleIndex}-${lessonIndex}`;
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonKey)) {
        newSet.delete(lessonKey);
      } else {
        newSet.add(lessonKey);
      }
      return newSet;
    });
  };

  // Get module completion status
  const getModuleCompletionStatus = (module: CourseModule) => {
    const hasTitle = module.title && module.title.trim() !== "";
    const hasDescription =
      module.description && module.description.trim() !== "";
    const hasThumbnail =
      module.thumbnailUrl && module.thumbnailUrl.trim() !== "";
    const hasLessons = module.lessons && module.lessons.length > 0;

    const completed = [
      hasTitle,
      hasDescription,
      hasThumbnail,
      hasLessons,
    ].filter(Boolean).length;
    const total = 4;

    return {
      completed,
      total,
      percentage: (completed / total) * 100,
      isComplete: completed === total,
    };
  };

  // Get lesson completion status
  const getLessonCompletionStatus = (lesson: CourseLesson) => {
    const hasTitle = lesson.title && lesson.title.trim() !== "";
    const hasContent = lesson.contents && lesson.contents.length > 0;

    const completed = [hasTitle, hasContent].filter(Boolean).length;
    const total = 2;

    return {
      completed,
      total,
      percentage: (completed / total) * 100,
      isComplete: completed === total,
    };
  };

  // Course progress stats
  const courseStats = useMemo(() => {
    const modules = state.course.modules || [];
    const totalModules = modules.length;
    const completedModules = modules.filter(
      (module) => getModuleCompletionStatus(module).isComplete
    ).length;

    const totalLessons = modules.reduce(
      (acc, module) => acc + (module.lessons?.length || 0),
      0
    );

    const completedLessons = modules.reduce(
      (acc, module) =>
        acc +
        (module.lessons?.filter(
          (lesson) => getLessonCompletionStatus(lesson).isComplete
        ).length || 0),
      0
    );

    return {
      totalModules,
      completedModules,
      totalLessons,
      completedLessons,
      moduleProgress:
        totalModules > 0 ? (completedModules / totalModules) * 100 : 0,
      lessonProgress:
        totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
    };
  }, [state.course.modules]);

  return (
    <Container
      title="Course Content - Modules & Lessons"
      description="Create and organize your course modules and lessons"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Course Progress Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <Layers className="w-6 h-6 text-blue-600" />
              Course Structure
            </h2>
            <p className="text-gray-600">
              Build your course content with modules and lessons
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {courseStats.completedModules}/{courseStats.totalModules} modules
              completed
            </div>
            <div className="text-sm text-gray-600">
              {courseStats.completedLessons}/{courseStats.totalLessons} lessons
              completed
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Module Progress
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(courseStats.moduleProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${courseStats.moduleProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Lesson Progress
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(courseStats.lessonProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${courseStats.lessonProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <AlertBanner
          message={`${validationErrors.length} validation error(s) found. Please complete all required fields.`}
          type="error"
          className="mb-6"
        />
      )}

      {/* Add Module Button */}
      <div className="mb-6">
        <OrangeButton onClick={addModule} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Module
        </OrangeButton>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {state.course.modules && state.course.modules.length > 0 ? (
          state.course.modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.has(moduleIndex);
            const isSaved = savedModules.has(moduleIndex);
            const moduleCompletion = getModuleCompletionStatus(module);
            const moduleThumbnailFolder = `courses/${courseTitle}/modules/module-${
              moduleIndex + 1
            }/thumbnail`;

            return (
              <div
                key={moduleIndex}
                className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${
                  moduleCompletion.isComplete
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Module Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          moduleCompletion.isComplete
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      >
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Module {moduleIndex + 1}
                          {module.title && `: ${module.title}`}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            {moduleCompletion.completed}/
                            {moduleCompletion.total} fields completed
                          </span>
                          <span>{module.lessons?.length || 0} lessons</span>
                          {moduleCompletion.isComplete && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Complete
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleModuleExpansion(moduleIndex)}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => removeModule(moduleIndex)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Module Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        moduleCompletion.isComplete
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${moduleCompletion.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Module Content (Collapsible) */}
                {isExpanded && (
                  <div className="p-6 space-y-6">
                    {/* Module Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Input
                          label="Module Title"
                          placeholder="Enter module title"
                          value={module.title || ""}
                          onChange={(e) =>
                            updateModuleField(
                              moduleIndex,
                              "title",
                              e.target.value
                            )
                          }
                          required
                        />
                        <TextArea
                          label="Module Description"
                          placeholder="Describe what students will learn in this module"
                          value={module.description || ""}
                          onChange={(e) =>
                            updateModuleField(
                              moduleIndex,
                              "description",
                              e.target.value
                            )
                          }
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <UploadMediaContainer
                          title="Module Thumbnail"
                          description="Upload thumbnail for this module"
                          type="image"
                          mediaUrl={module.thumbnailUrl}
                          mediaSource={module.thumbnailSource}
                          s3Key={module.thumbnailS3Key}
                          maxSize={10}
                          onFileUpload={async (file, folderName) => {
                            const url = await handleModuleThumbnailUpload(
                              file,
                              folderName
                            );
                            updateModuleField(moduleIndex, "thumbnailUrl", url);
                            updateModuleField(
                              moduleIndex,
                              "thumbnailSource",
                              "upload"
                            );
                            return url;
                          }}
                          onFileRemove={() => {
                            updateModuleField(moduleIndex, "thumbnailUrl", "");
                            updateModuleField(
                              moduleIndex,
                              "thumbnailSource",
                              undefined
                            );
                            updateModuleField(
                              moduleIndex,
                              "thumbnailS3Key",
                              ""
                            );
                          }}
                          onUrlSubmit={(url) => {
                            updateModuleField(moduleIndex, "thumbnailUrl", url);
                            updateModuleField(
                              moduleIndex,
                              "thumbnailSource",
                              "url"
                            );
                            updateModuleField(
                              moduleIndex,
                              "thumbnailS3Key",
                              ""
                            );
                          }}
                          isUploading={isUploading}
                          folderName={moduleThumbnailFolder}
                          allowUrlInput={true}
                          required={true}
                          usePresignedUrl={true}
                        />
                      </div>
                    </div>

                    {/* Lessons Section */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Video className="w-5 h-5" />
                          Lessons ({module.lessons?.length || 0})
                        </h4>
                        <OrangeButton
                          onClick={() => {
                            const newLesson: CourseLesson = {
                              title: "",
                              description: "",
                              contents: [],
                              isLocked: false,
                            };
                            const currentModules = [
                              ...(state.course.modules || []),
                            ];
                            const currentLessons = [
                              ...(currentModules[moduleIndex].lessons || []),
                            ];
                            currentLessons.push(newLesson);
                            currentModules[moduleIndex] = {
                              ...currentModules[moduleIndex],
                              lessons: currentLessons,
                            };
                            actions.updateCourseField(
                              "modules",
                              currentModules
                            );
                          }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Lesson
                        </OrangeButton>
                      </div>

                      {/* Lessons List */}
                      <div className="space-y-4">
                        {module.lessons && module.lessons.length > 0 ? (
                          module.lessons.map((lesson, lessonIndex) => {
                            const lessonKey = `${moduleIndex}-${lessonIndex}`;
                            const isLessonExpanded =
                              expandedLessons.has(lessonKey);
                            const lessonCompletion =
                              getLessonCompletionStatus(lesson);

                            return (
                              <div
                                key={lessonIndex}
                                className={`border rounded-lg overflow-hidden ${
                                  lessonCompletion.isComplete
                                    ? "border-green-200 bg-green-50"
                                    : "border-gray-200 bg-gray-50"
                                }`}
                              >
                                {/* Lesson Header */}
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                          lessonCompletion.isComplete
                                            ? "bg-green-500"
                                            : "bg-gray-500"
                                        }`}
                                      >
                                        <Play className="w-4 h-4 text-white" />
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-800">
                                          Lesson {lessonIndex + 1}
                                          {lesson.title && `: ${lesson.title}`}
                                        </span>
                                        <div className="text-sm text-gray-600">
                                          {lesson.contents?.length || 0} content
                                          items
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          toggleLessonExpansion(
                                            moduleIndex,
                                            lessonIndex
                                          )
                                        }
                                        className="p-1 text-gray-500 hover:text-gray-700"
                                      >
                                        {isLessonExpanded ? (
                                          <ChevronUp className="w-4 h-4" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (
                                            window.confirm(
                                              "Remove this lesson?"
                                            )
                                          ) {
                                            const currentModules = [
                                              ...(state.course.modules || []),
                                            ];
                                            const currentLessons = [
                                              ...(currentModules[moduleIndex]
                                                .lessons || []),
                                            ];
                                            currentLessons.splice(
                                              lessonIndex,
                                              1
                                            );
                                            currentModules[moduleIndex] = {
                                              ...currentModules[moduleIndex],
                                              lessons: currentLessons,
                                            };
                                            actions.updateCourseField(
                                              "modules",
                                              currentModules
                                            );
                                          }
                                        }}
                                        className="p-1 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Lesson Progress */}
                                  <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div
                                      className={`h-1 rounded-full transition-all duration-300 ${
                                        lessonCompletion.isComplete
                                          ? "bg-green-500"
                                          : "bg-gray-500"
                                      }`}
                                      style={{
                                        width: `${lessonCompletion.percentage}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Lesson Content (Collapsible) */}
                                {isLessonExpanded && (
                                  <div className="p-4 border-t border-gray-200 bg-white">
                                    <div className="space-y-4">
                                      <Input
                                        label="Lesson Title"
                                        placeholder="Enter lesson title"
                                        value={lesson.title || ""}
                                        onChange={(e) => {
                                          const currentModules = [
                                            ...(state.course.modules || []),
                                          ];
                                          const currentLessons = [
                                            ...(currentModules[moduleIndex]
                                              .lessons || []),
                                          ];
                                          currentLessons[lessonIndex] = {
                                            ...currentLessons[lessonIndex],
                                            title: e.target.value,
                                          };
                                          currentModules[moduleIndex] = {
                                            ...currentModules[moduleIndex],
                                            lessons: currentLessons,
                                          };
                                          actions.updateCourseField(
                                            "modules",
                                            currentModules
                                          );
                                        }}
                                        required
                                      />
                                      <TextArea
                                        label="Lesson Description (Optional)"
                                        placeholder="Describe this lesson"
                                        value={lesson.description || ""}
                                        onChange={(e) => {
                                          const currentModules = [
                                            ...(state.course.modules || []),
                                          ];
                                          const currentLessons = [
                                            ...(currentModules[moduleIndex]
                                              .lessons || []),
                                          ];
                                          currentLessons[lessonIndex] = {
                                            ...currentLessons[lessonIndex],
                                            description: e.target.value,
                                          };
                                          currentModules[moduleIndex] = {
                                            ...currentModules[moduleIndex],
                                            lessons: currentLessons,
                                          };
                                          actions.updateCourseField(
                                            "modules",
                                            currentModules
                                          );
                                        }}
                                        rows={2}
                                      />

                                      {/* Content Section */}
                                      <ContentSection
                                        lessonId={`${moduleIndex}-${lessonIndex}`}
                                        contents={lesson.contents || []}
                                        expandedContent={expandedContent}
                                        onToggleContentExpansion={(
                                          contentId
                                        ) => {
                                          setExpandedContent((prev) => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(contentId)) {
                                              newSet.delete(contentId);
                                            } else {
                                              newSet.add(contentId);
                                            }
                                            return newSet;
                                          });
                                        }}
                                        onUpdateContent={(
                                          contentId,
                                          updates
                                        ) => {
                                          const currentModules = [
                                            ...(state.course.modules || []),
                                          ];
                                          const currentLessons = [
                                            ...(currentModules[moduleIndex]
                                              .lessons || []),
                                          ];
                                          const currentContents = [
                                            ...(currentLessons[lessonIndex]
                                              .contents || []),
                                          ];
                                          const contentIndex =
                                            currentContents.findIndex(
                                              (c) => c._id === contentId
                                            );
                                          if (contentIndex >= 0) {
                                            currentContents[contentIndex] = {
                                              ...currentContents[contentIndex],
                                              ...updates,
                                            } as Content;
                                            currentLessons[lessonIndex] = {
                                              ...currentLessons[lessonIndex],
                                              contents: currentContents,
                                            };
                                            currentModules[moduleIndex] = {
                                              ...currentModules[moduleIndex],
                                              lessons: currentLessons,
                                            };
                                            actions.updateCourseField(
                                              "modules",
                                              currentModules
                                            );
                                          }
                                        }}
                                        onAddContent={(lessonId, type) => {
                                          const newContent: Content =
                                            type === "video"
                                              ? {
                                                  _id: `content-${Date.now()}`,
                                                  title: "",
                                                  type: "video" as const,
                                                  sources: [
                                                    {
                                                      videoUrl: "",
                                                      quality: "1080p" as const,
                                                    },
                                                  ],
                                                  thumbnailUrl: "",
                                                }
                                              : {
                                                  _id: `content-${Date.now()}`,
                                                  title: "",
                                                  type: "quiz" as const,
                                                  questions: [],
                                                };
                                          const currentModules = [
                                            ...(state.course.modules || []),
                                          ];
                                          const currentLessons = [
                                            ...(currentModules[moduleIndex]
                                              .lessons || []),
                                          ];
                                          const currentContents = [
                                            ...(currentLessons[lessonIndex]
                                              .contents || []),
                                          ];
                                          currentContents.push(newContent);
                                          currentLessons[lessonIndex] = {
                                            ...currentLessons[lessonIndex],
                                            contents: currentContents,
                                          };
                                          currentModules[moduleIndex] = {
                                            ...currentModules[moduleIndex],
                                            lessons: currentLessons,
                                          };
                                          actions.updateCourseField(
                                            "modules",
                                            currentModules
                                          );
                                        }}
                                        onDeleteContent={(contentId) => {
                                          const currentModules = [
                                            ...(state.course.modules || []),
                                          ];
                                          const currentLessons = [
                                            ...(currentModules[moduleIndex]
                                              .lessons || []),
                                          ];
                                          const currentContents = (
                                            currentLessons[lessonIndex]
                                              .contents || []
                                          ).filter((c) => c._id !== contentId);
                                          currentLessons[lessonIndex] = {
                                            ...currentLessons[lessonIndex],
                                            contents: currentContents,
                                          };
                                          currentModules[moduleIndex] = {
                                            ...currentModules[moduleIndex],
                                            lessons: currentLessons,
                                          };
                                          actions.updateCourseField(
                                            "modules",
                                            currentModules
                                          );
                                        }}
                                        courseTitle={courseTitle}
                                        moduleIndex={moduleIndex}
                                        lessonIndex={lessonIndex}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No lessons added yet</p>
                            <p className="text-sm">
                              Click &quot;Add Lesson&quot; to get started
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Save Module Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={() => saveModule(moduleIndex)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          isSaved
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        disabled={isSaved}
                      >
                        <Save className="w-4 h-4" />
                        {isSaved ? "Module Saved" : "Save Module"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 rounded-xl">
            <Layers className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No modules created yet</p>
            <p className="mb-4">
              Start building your course by adding your first module
            </p>
            <OrangeButton
              onClick={addModule}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create First Module
            </OrangeButton>
          </div>
        )}
      </div>

      {/* Enhanced Navigation */}
      <ScreenNavigation
        currentStep={7}
        totalSteps={8}
        previousScreen="screen7"
        nextScreen="screen8"
        setActiveScreen={setActiveScreen}
        isNextDisabled={validationErrors.length > 0}
      />

      {/* Validation Summary */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">
              {validationErrors.length} Error(s) Found
            </span>
          </div>
          <ul className="text-sm text-red-700 space-y-1 ml-7">
            {validationErrors.slice(0, 5).map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
            {validationErrors.length > 5 && (
              <li className="text-red-600 font-medium">
                ... and {validationErrors.length - 5} more error(s)
              </li>
            )}
          </ul>
        </div>
      )}
    </Container>
  );
};

export default Screen7_ModuleLessons;
