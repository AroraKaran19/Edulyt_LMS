"use client";
import React, { useEffect, useState } from "react";
import Container from "@/app/(pages)/admin/components/ui/Container";
import {
  BookOpen,
  Plus,
  X,
  Play,
  FileText,
  Edit,
  ChevronDown,
  ChevronRight,
  Clock,
  Video,
  HelpCircle,
  Save,
  ArrowLeft,
} from "lucide-react";
import { useCourseFormContext } from "../context/CourseFormContext";
import { CourseModule, CourseLesson } from "@/types/course";
import UploadComponent from "@/components/ui/UploadComponent";

const ModulesSection = () => {
  const { state, addModule, removeModule, updateArrayItem } =
    useCourseFormContext();

  // UI States
  const [currentStep, setCurrentStep] = useState<
    | "overview"
    | "create-module"
    | "edit-module"
    | "manage-lessons"
    | "create-lesson"
    | "manage-content"
  >("overview");
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(
    null
  );
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(
    null
  );
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    console.log(selectedLessonIndex);
  }, [selectedLessonIndex]);

  // Form States
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
  });

  // Reset forms
  const resetModuleForm = () => {
    setModuleForm({
      title: "",
      description: "",
      thumbnailUrl: "",
    });
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: "",
      description: "",
      videoUrl: "",
    });
  };

  // Upload handlers
  const handleModuleThumbnailUpload = (url: string, fileName: string) => {
    setModuleForm(prev => ({
      ...prev,
      thumbnailUrl: url
    }));
  };

  const handleLessonVideoUpload = (url: string, fileName: string) => {
    setLessonForm(prev => ({
      ...prev,
      videoUrl: url
    }));
  };

  // Module Operations
  const handleCreateModule = () => {
    if (!moduleForm.title.trim()) return;

    const newModule: CourseModule = {
      _id: Date.now().toString(),
      title: moduleForm.title,
      description: moduleForm.description || undefined,
      thumbnailUrl: moduleForm.thumbnailUrl || undefined,
      lessons: [],
      order: state.modules.length,
      isCompleted: false,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addModule(newModule);
    resetModuleForm();
    setCurrentStep("overview");
  };

  const handleEditModule = (index: number) => {
    const courseModule = state.modules[index];
    setModuleForm({
      title: courseModule.title,
      description: courseModule.description || "",
      thumbnailUrl: courseModule.thumbnailUrl || "",
    });
    setSelectedModuleIndex(index);
    setCurrentStep("edit-module");
  };

  const handleUpdateModule = () => {
    if (selectedModuleIndex === null || !moduleForm.title.trim()) return;

    const updatedModule: CourseModule = {
      ...state.modules[selectedModuleIndex],
      title: moduleForm.title,
      description: moduleForm.description || undefined,
      thumbnailUrl: moduleForm.thumbnailUrl || undefined,
      updatedAt: new Date(),
    };

    updateArrayItem("modules", selectedModuleIndex, updatedModule);
    resetModuleForm();
    setSelectedModuleIndex(null);
    setCurrentStep("overview");
  };

  // Lesson Operations
  const handleCreateLesson = () => {
    if (!lessonForm.title.trim() || selectedModuleIndex === null) return;

    // Create lesson content based on video URL
    const lessonContent = [];
    if (lessonForm.videoUrl) {
      lessonContent.push({
        _id: Date.now().toString(),
        title: `${lessonForm.title} Video`,
        description: `Video content for ${lessonForm.title}`,
        content: [{
          _id: Date.now().toString() + '_video',
          sources: [{
            _id: Date.now().toString() + '_source',
            quality: '720p' as const,
            videoUrl: lessonForm.videoUrl,
          }],
          duration: 0, // Will be set later
          order: 0,
        }],
        type: 'video' as const,
        order: 0,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const newLesson: CourseLesson = {
      _id: Date.now().toString(),
      title: lessonForm.title,
      description: lessonForm.description || undefined,
      content: lessonContent,
      order: state.modules[selectedModuleIndex].lessons.length,
      isCompleted: false,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedModule = {
      ...state.modules[selectedModuleIndex],
      lessons: [...state.modules[selectedModuleIndex].lessons, newLesson],
    };

    updateArrayItem("modules", selectedModuleIndex, updatedModule);
    resetLessonForm();
    setCurrentStep("manage-lessons");
  };

  const removeLesson = (lessonIndex: number) => {
    if (selectedModuleIndex === null) return;

    const updatedModule = {
      ...state.modules[selectedModuleIndex],
      lessons: state.modules[selectedModuleIndex].lessons.filter(
        (_, index) => index !== lessonIndex
      ),
    };

    updateArrayItem("modules", selectedModuleIndex, updatedModule);
  };

  const toggleExpandModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const getLessonTypeIcon = (lesson: CourseLesson) => {
    // Determine the primary content type of the lesson
    if (lesson.content.length === 0) {
      return <FileText className="size-4 text-gray-400" />;
    }

    const hasVideo = lesson.content.some((content) => content.type === "video");
    const hasQuiz = lesson.content.some((content) => content.type === "quiz");

    if (hasVideo && hasQuiz) {
      return <Play className="size-4 text-purple-500" />; // Mixed content
    } else if (hasVideo) {
      return <Video className="size-4 text-blue-500" />;
    } else if (hasQuiz) {
      return <HelpCircle className="size-4 text-green-500" />;
    } else {
      return <FileText className="size-4 text-gray-500" />;
    }
  };

  // Render different steps
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-6 border-b border-gray-200">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-gray-900">
            Course Modules Overview
          </h3>
          <p className="text-sm text-gray-600">
            Organize your course content into structured modules and lessons
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <BookOpen className="size-4" />
              {state.modules.length} module
              {state.modules.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Play className="size-4" />
              {state.modules.reduce(
                (total, module) => total + module.lessons.length,
                0
              )}{" "}
              lesson
              {state.modules.reduce(
                (total, module) => total + module.lessons.length,
                0
              ) !== 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentStep("create-module")}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium whitespace-nowrap"
        >
          <Plus className="size-4" />
          Add Module
        </button>
      </div>

      {/* Modules List */}
      {state.modules.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-16 text-center">
          <div className="mx-auto w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="size-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            No modules yet
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Start building your course by creating your first module. Each
            module will contain lessons and content for your students.
          </p>
          <button
            type="button"
            onClick={() => setCurrentStep("create-module")}
            className="px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            Create First Module
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {state.modules.map((module, moduleIndex) => (
            <div
              key={module._id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="p-8">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => toggleExpandModule(module._id)}
                        className="mt-1 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
                      >
                        {expandedModules[module._id] ? (
                          <ChevronDown className="size-5" />
                        ) : (
                          <ChevronRight className="size-5" />
                        )}
                      </button>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-semibold text-gray-900">
                            {module.title}
                          </h4>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            Module {moduleIndex + 1}
                          </span>
                        </div>
                        {module.description && (
                          <p className="text-gray-600 leading-relaxed">
                            {module.description}
                          </p>
                        )}
                        <div className="flex items-center gap-6 text-sm text-gray-500 pt-2">
                          <span className="flex items-center gap-2">
                            <Play className="size-4" />
                            <span className="font-medium">
                              {module.lessons.length}
                            </span>{" "}
                            lesson{module.lessons.length !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="size-4" />
                            <span className="font-medium">
                              {module.lessons.reduce(
                                (total, lesson) =>
                                  total + lesson.content.length,
                                0
                              )}
                            </span>{" "}
                            content item
                            {module.lessons.reduce(
                              (total, lesson) => total + lesson.content.length,
                              0
                            ) !== 1
                              ? "s"
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-6">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedModuleIndex(moduleIndex);
                        setCurrentStep("manage-lessons");
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      Manage Lessons
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditModule(moduleIndex)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit module"
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeModule(moduleIndex)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete module"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Module Content */}
                {expandedModules[module._id] && module.lessons.length > 0 && (
                  <div className="mt-6 pl-6 border-l-2 border-gray-100">
                    <div className="space-y-4">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson._id}
                          className="bg-gradient-to-r from-gray-50 to-gray-50/50 p-6 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white rounded-lg shadow-sm border">
                                {getLessonTypeIcon(lesson)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <h5 className="font-semibold text-gray-900">
                                    {lesson.title}
                                  </h5>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                    Lesson {lessonIndex + 1}
                                  </span>
                                </div>
                                {lesson.description && (
                                  <p className="text-sm text-gray-600">
                                    {lesson.description}
                                  </p>
                                )}
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <FileText className="size-3" />
                                  {lesson.content.length} content item
                                  {lesson.content.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateModule = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setCurrentStep("overview")}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-gray-900">
            Create New Module
          </h3>
          <p className="text-sm text-gray-600">
            Add a new module to organize your course content into structured
            lessons
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="max-w-2xl space-y-8">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Module Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Introduction to React Basics"
              value={moduleForm.title}
              onChange={(e) =>
                setModuleForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Module Description
            </label>
            <textarea
              placeholder="Describe what students will learn in this module..."
              value={moduleForm.description}
              onChange={(e) =>
                setModuleForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Module Thumbnail
            </label>
            <UploadComponent
              onUploadComplete={handleModuleThumbnailUpload}
              acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              uploadType="module-thumbnail"
              maxFileSize={5 * 1024 * 1024} // 5MB
              placeholder="Upload module thumbnail image"
              currentUrl={moduleForm.thumbnailUrl}
              allowUrlInput={true}
            />
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => {
                resetModuleForm();
                setCurrentStep("overview");
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateModule}
              disabled={!moduleForm.title.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              <Save className="size-4" />
              Create Module
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditModule = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            resetModuleForm();
            setSelectedModuleIndex(null);
            setCurrentStep("overview");
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h3 className="text-lg font-medium text-gray-800">Edit Module</h3>
          <p className="text-sm text-gray-600">Update module information</p>
        </div>
      </div>

      {/* Form - Same as create but with update button */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-6">
        {/* Same form fields as create module */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Module Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Introduction to React Basics"
            value={moduleForm.title}
            onChange={(e) =>
              setModuleForm((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Module Description
          </label>
          <textarea
            placeholder="Describe what students will learn in this module..."
            value={moduleForm.description}
            onChange={(e) =>
              setModuleForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Module Thumbnail
          </label>
          <UploadComponent
            onUploadComplete={handleModuleThumbnailUpload}
            acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
            uploadType="module-thumbnail"
            maxFileSize={5 * 1024 * 1024} // 5MB
            placeholder="Upload module thumbnail image"
            currentUrl={moduleForm.thumbnailUrl}
            allowUrlInput={true}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              resetModuleForm();
              setSelectedModuleIndex(null);
              setCurrentStep("overview");
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdateModule}
            disabled={!moduleForm.title.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="size-4" />
            Update Module
          </button>
        </div>
      </div>
    </div>
  );

  const renderManageLessons = () => {
    if (selectedModuleIndex === null) return null;
    const courseModule = state.modules[selectedModuleIndex];

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setSelectedModuleIndex(null);
                setCurrentStep("overview");
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900">
                Manage Lessons
              </h3>
              <p className="text-sm text-gray-600">
                Module:{" "}
                <span className="font-medium text-gray-800">
                  {courseModule.title}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentStep("create-lesson")}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium whitespace-nowrap"
          >
            <Plus className="size-4" />
            Add Lesson
          </button>
        </div>

        {/* Lessons List */}
        {courseModule.lessons.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-dashed border-blue-300 rounded-xl p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mb-6">
              <Play className="size-8 text-blue-500" />
            </div>
            <h4 className="text-xl font-semibold text-gray-700 mb-3">
              No lessons yet
            </h4>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Start adding lessons to this module to build your course content
            </p>
            <button
              type="button"
              onClick={() => setCurrentStep("create-lesson")}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              Add First Lesson
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {courseModule.lessons.map((lesson, lessonIndex) => (
              <div
                key={lesson._id}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
                      {getLessonTypeIcon(lesson)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h5 className="font-semibold text-gray-900">
                          {lesson.title}
                        </h5>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Lesson {lessonIndex + 1}
                        </span>
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-gray-600">
                          {lesson.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="size-3" />
                          <span className="font-medium">
                            {lesson.content.length}
                          </span>{" "}
                          content item{lesson.content.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLessonIndex(lessonIndex);
                        setCurrentStep("manage-content");
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      Content
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLesson(lessonIndex)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete lesson"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCreateLesson = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep("manage-lessons")}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h3 className="text-lg font-medium text-gray-800">
            Create New Lesson
          </h3>
          <p className="text-sm text-gray-600">
            Add a lesson to{" "}
            {selectedModuleIndex !== null
              ? state.modules[selectedModuleIndex].title
              : ""}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Lesson Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Creating Your First Component"
              value={lessonForm.title}
              onChange={(e) =>
                setLessonForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Lesson Description
            </label>
            <textarea
              placeholder="Describe what students will learn in this lesson..."
              value={lessonForm.description}
              onChange={(e) =>
                setLessonForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Lesson Video
            </label>
            <UploadComponent
              onUploadComplete={handleLessonVideoUpload}
              acceptedFileTypes={['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm']}
              uploadType="lesson-video"
              maxFileSize={200 * 1024 * 1024} // 200MB
              placeholder="Upload lesson video"
              currentUrl={lessonForm.videoUrl}
              allowUrlInput={true}
              showProgress={true}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-200 rounded">
                <FileText className="size-4 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-blue-800">
                  Content Management
                </h4>
                <p className="text-xs text-blue-700">
                  After creating the lesson, you can add videos, quizzes, and
                  reading materials in the content management section.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              resetLessonForm();
              setCurrentStep("manage-lessons");
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateLesson}
            disabled={!lessonForm.title.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="size-4" />
            Create Lesson
          </button>
        </div>
      </div>
    </div>
  );

  const renderManageContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setSelectedLessonIndex(null);
            setCurrentStep("manage-lessons");
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h3 className="text-lg font-medium text-gray-800">
            Manage Lesson Content
          </h3>
          <p className="text-sm text-gray-600">
            Advanced content management (coming soon)
          </p>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="text-lg font-medium text-blue-800 mb-2">
          Content Management
        </h4>
        <p className="text-blue-700">
          Advanced lesson content management including video uploads, quiz
          builders, and interactive elements will be available in the next
          update.
        </p>
      </div>
    </div>
  );

  // Main render based on current step
  return (
    <Container
      id="modules"
      icon={BookOpen}
      title="Course Modules & Content"
      description="Create and organize your course structure"
    >
      <div className="w-full">
        {currentStep === "overview" && renderOverview()}
        {currentStep === "create-module" && renderCreateModule()}
        {currentStep === "edit-module" && renderEditModule()}
        {currentStep === "manage-lessons" && renderManageLessons()}
        {currentStep === "create-lesson" && renderCreateLesson()}
        {currentStep === "manage-content" && renderManageContent()}
      </div>
    </Container>
  );
};

export default ModulesSection;
