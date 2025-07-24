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
import { CourseModule, CourseLesson, Content, Video as VideoType, VideoQuality, Quiz, QuizQuestion, QuizOption } from "@/types/course";
import UploadComponent from "@/components/ui/UploadComponent";
import { cn } from "@/lib/utils";

const ModulesSection = () => {
  const { state, addModule, removeModule, updateField } = useCourseFormContext();

  // UI States
  const [currentStep, setCurrentStep] = useState<
    | "overview"
    | "create-module"
    | "edit-module"
    | "manage-lessons"
    | "create-lesson"
    | "edit-lesson"
    | "manage-content"
    | "create-content"
  >("overview");
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [selectedContentType, setSelectedContentType] = useState<'video' | 'quiz' | null>(null);

  // Form States
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
  });

  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    quality: "720p" as VideoQuality["quality"],
  });

  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    passingScore: 70,
    maxAttempts: 3,
    questions: [] as QuizQuestion[],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    options: ["", "", "", ""] as string[],
    correctAnswers: [] as number[],
    timeLimit: 30,
  });

  // Reset indices when modules change to prevent out-of-bounds errors
  useEffect(() => {
    if (selectedModuleIndex !== null && selectedModuleIndex >= state.modules.length) {
      console.log('Resetting selectedModuleIndex due to modules change');
      setSelectedModuleIndex(null);
      setSelectedLessonIndex(null);
      setCurrentStep("overview");
    }
    
    if (selectedModuleIndex !== null && selectedLessonIndex !== null) {
      const currentModule = state.modules[selectedModuleIndex];
      if (currentModule && selectedLessonIndex >= currentModule.lessons.length) {
        console.log('Resetting selectedLessonIndex due to lessons change');
        setSelectedLessonIndex(null);
        setCurrentStep("manage-lessons");
      }
    }
  }, [state.modules, selectedModuleIndex, selectedLessonIndex]);

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
    });
  };

  const resetVideoForm = () => {
    setVideoForm({
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      quality: "720p",
    });
  };

  const resetQuizForm = () => {
    setQuizForm({
      title: "",
      description: "",
      passingScore: 70,
      maxAttempts: 3,
      questions: [],
    });
    setCurrentQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswers: [],
      timeLimit: 30,
    });
  };

  const resetContentForms = () => {
    resetVideoForm();
    resetQuizForm();
    setSelectedContentType(null);
  };

  // Upload handlers
  const handleModuleThumbnailUpload = (url: string) => {
    setModuleForm(prev => ({
      ...prev,
      thumbnailUrl: url
    }));
  };

  const handleVideoUpload = (url: string) => {
    setVideoForm(prev => ({
      ...prev,
      videoUrl: url
    }));
    
    // Show success message
    console.log('✅ Video uploaded successfully');
    console.log('🎬 Don\'t forget to click "Create Video" to add it to your lesson!');
  };

  const handleVideoThumbnailUpload = (url: string) => {
    setVideoForm(prev => ({
      ...prev,
      thumbnailUrl: url
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
      isCompleted: false,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addModule(newModule);
    resetModuleForm();
    
    // Automatically move to manage lessons for the newly created module
    setSelectedModuleIndex(state.modules.length); // Index of the new module
    setCurrentStep("manage-lessons");
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

    const updatedModules = [...state.modules];
    updatedModules[selectedModuleIndex] = {
      ...state.modules[selectedModuleIndex],
      title: moduleForm.title,
      description: moduleForm.description || undefined,
      thumbnailUrl: moduleForm.thumbnailUrl || undefined,
      updatedAt: new Date(),
    };

    updateField("modules", updatedModules);
    resetModuleForm();
    setSelectedModuleIndex(null);
    setCurrentStep("overview");
  };

  // Lesson Operations
  const handleCreateLesson = () => {
    if (!lessonForm.title.trim() || selectedModuleIndex === null) return;

    // Validate index before accessing
    if (selectedModuleIndex >= state.modules.length || selectedModuleIndex < 0) {
      console.error('selectedModuleIndex out of bounds in handleCreateLesson');
      return;
    }

    const newLesson: CourseLesson = {
      _id: Date.now().toString(),
      title: lessonForm.title,
      description: lessonForm.description || undefined,
      content: [], // Content will be added later through content management
      isCompleted: false,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedModules = [...state.modules];
    updatedModules[selectedModuleIndex] = {
      ...state.modules[selectedModuleIndex],
      lessons: [...state.modules[selectedModuleIndex].lessons, newLesson],
      updatedAt: new Date(),
    };

    updateField("modules", updatedModules);
    resetLessonForm();
    
    // Automatically move to manage content for the newly created lesson
    setSelectedLessonIndex(state.modules[selectedModuleIndex].lessons.length); // Index of the new lesson
    setCurrentStep("manage-content");
  };

  const removeLesson = (lessonIndex: number) => {
    if (selectedModuleIndex === null) return;

    // Validate index before accessing
    if (selectedModuleIndex >= state.modules.length || selectedModuleIndex < 0) {
      console.error('selectedModuleIndex out of bounds in removeLesson');
      return;
    }

    const updatedModules = [...state.modules];
    updatedModules[selectedModuleIndex] = {
      ...state.modules[selectedModuleIndex],
      lessons: state.modules[selectedModuleIndex].lessons.filter(
        (_, index) => index !== lessonIndex
      ),
      updatedAt: new Date(),
    };

    updateField("modules", updatedModules);
  };

  // Content Operations
  const handleCreateVideoContent = () => {
    if (!videoForm.title.trim() || !videoForm.videoUrl.trim() || selectedModuleIndex === null || selectedLessonIndex === null) return;

    // Validate indices before accessing
    if (selectedModuleIndex >= state.modules.length || selectedModuleIndex < 0) {
      console.error('selectedModuleIndex out of bounds in handleCreateVideoContent');
      return;
    }
    
    if (selectedLessonIndex >= state.modules[selectedModuleIndex].lessons.length || selectedLessonIndex < 0) {
      console.error('selectedLessonIndex out of bounds in handleCreateVideoContent');
      return;
    }

    const videoQuality: VideoQuality = {
      _id: Date.now().toString() + '_quality',
      quality: videoForm.quality,
      videoUrl: videoForm.videoUrl,
    };

    const video: VideoType = {
      _id: Date.now().toString() + '_video',
      sources: [videoQuality],
      thumbnailUrl: videoForm.thumbnailUrl || undefined,
      duration: 0, // Duration will be automatically calculated from the video file
    };

    const content: Content = {
      _id: Date.now().toString(),
      title: videoForm.title,
      description: videoForm.description || undefined,
      content: video,
      type: 'video',
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedModules = [...state.modules];
    const lesson = updatedModules[selectedModuleIndex].lessons[selectedLessonIndex];
    lesson.content = [...lesson.content, content];
    updatedModules[selectedModuleIndex].updatedAt = new Date();

    updateField("modules", updatedModules);
    resetContentForms();
    setCurrentStep("manage-content");
  };

  const handleAddQuizQuestion = () => {
    if (!currentQuestion.question.trim() || currentQuestion.options.some(opt => !opt.trim()) || currentQuestion.correctAnswers.length === 0) return;

    const options: QuizOption[] = currentQuestion.options.map((option, index) => ({
      _id: Date.now().toString() + '_option_' + index,
      option: option.trim(),
    }));

    const correctAnswers = currentQuestion.correctAnswers.map(index => options[index]);

    const question: QuizQuestion = {
      _id: Date.now().toString() + '_question',
      question: currentQuestion.question,
      options,
      correctAnswer: correctAnswers,
      timeLimit: currentQuestion.timeLimit,
    };

    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, question]
    }));

    setCurrentQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswers: [],
      timeLimit: 30,
    });
  };

  const removeQuizQuestion = (questionIndex: number) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, index) => index !== questionIndex)
    }));
  };

  const handleCreateQuizContent = () => {
    if (!quizForm.title.trim() || quizForm.questions.length === 0 || selectedModuleIndex === null || selectedLessonIndex === null) return;

    // Validate indices before accessing
    if (selectedModuleIndex >= state.modules.length || selectedModuleIndex < 0) {
      console.error('selectedModuleIndex out of bounds in handleCreateQuizContent');
      return;
    }
    
    if (selectedLessonIndex >= state.modules[selectedModuleIndex].lessons.length || selectedLessonIndex < 0) {
      console.error('selectedLessonIndex out of bounds in handleCreateQuizContent');
      return;
    }

    const quiz: Quiz = {
      _id: Date.now().toString() + '_quiz',
      title: quizForm.title,
      description: quizForm.description || undefined,
      questions: quizForm.questions,
      passingScore: quizForm.passingScore,
      maxAttempts: quizForm.maxAttempts,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const content: Content = {
      _id: Date.now().toString(),
      title: quizForm.title,
      description: quizForm.description || undefined,
      content: quiz,
      type: 'quiz',
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedModules = [...state.modules];
    const lesson = updatedModules[selectedModuleIndex].lessons[selectedLessonIndex];
    lesson.content = [...lesson.content, content];
    updatedModules[selectedModuleIndex].updatedAt = new Date();

    updateField("modules", updatedModules);
    resetContentForms();
    setCurrentStep("manage-content");
  };

  const removeContent = (contentIndex: number) => {
    if (selectedModuleIndex === null || selectedLessonIndex === null) return;

    // Validate indices before accessing
    if (selectedModuleIndex >= state.modules.length || selectedModuleIndex < 0) {
      console.error('selectedModuleIndex out of bounds in removeContent');
      return;
    }
    
    if (selectedLessonIndex >= state.modules[selectedModuleIndex].lessons.length || selectedLessonIndex < 0) {
      console.error('selectedLessonIndex out of bounds in removeContent');
      return;
    }

    const updatedModules = [...state.modules];
    const lesson = updatedModules[selectedModuleIndex].lessons[selectedLessonIndex];
    lesson.content = lesson.content.filter((_, index) => index !== contentIndex);
    updatedModules[selectedModuleIndex].updatedAt = new Date();

    updateField("modules", updatedModules);
  };

  const toggleExpandModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const getLessonTypeIcon = (lesson: CourseLesson) => {
    if (lesson.content.length === 0) {
      return <FileText className="size-4 text-gray-400" />;
    }

    const hasVideo = lesson.content.some((content) => content.type === "video");
    const hasQuiz = lesson.content.some((content) => content.type === "quiz");

    if (hasVideo && hasQuiz) {
      return <Play className="size-4 text-purple-500" />;
    } else if (hasVideo) {
      return <Video className="size-4 text-[#F77124]" />;
    } else if (hasQuiz) {
      return <HelpCircle className="size-4 text-[#24F795]" />;
    } else {
      return <FileText className="size-4 text-gray-500" />;
    }
  };

  const getContentTypeIcon = (content: Content) => {
    if (content.type === "video") {
      return <Video className="size-4 text-[#F77124]" />;
    } else if (content.type === "quiz") {
      return <HelpCircle className="size-4 text-[#24F795]" />;
    }
    return <FileText className="size-4 text-gray-400" />;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return "No duration";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getTotalModuleDuration = (courseModule: CourseModule): number => {
    return courseModule.lessons.reduce((total, lesson) => {
      return total + lesson.content.reduce((lessonTotal, content) => {
        if (content.type === "video" && 'duration' in content.content) {
          return lessonTotal + (content.content.duration || 0);
        }
        return lessonTotal;
      }, 0);
    }, 0);
  };

  // Render different steps
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-6 border-b border-[#FFE9DB]">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#2B1508] font-coolvetica">
            Course Modules Overview
          </h3>
          <p className="text-sm text-[#2B1508]/70 font-medium">
            Organize your course content into structured modules and lessons
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-[#2B1508]/60">
            <span className="flex items-center gap-1">
              <BookOpen className="size-4 text-[#F77124]" />
              {state.modules.length} module{state.modules.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Play className="size-4 text-[#F77124]" />
              {state.modules.reduce((total, module) => total + module.lessons.length, 0)} lesson{state.modules.reduce((total, module) => total + module.lessons.length, 0) !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentStep("create-module")}
          className="flex items-center gap-2 px-6 py-3 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] transition-all duration-300 shadow-[0_0_2px_3px_rgba(247,113,36,0.3)] font-bold whitespace-nowrap"
        >
          <Plus className="size-4" />
          Add Module
        </button>
      </div>

      {/* Modules List */}
      {state.modules.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
          <div className="mx-auto w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="size-10 text-[#F77124]" />
          </div>
          <h3 className="text-xl font-bold text-[#2B1508] mb-3 font-coolvetica">
            No modules yet
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start building your course by creating your first module. Each module will contain lessons and content for your students.
          </p>
          <button
            type="button"
            onClick={() => setCurrentStep("create-module")}
            className="px-8 py-4 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] transition-all duration-300 shadow-[0_0_2px_3px_rgba(247,113,36,0.3)] font-bold"
          >
            Create First Module
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {state.modules.map((module, moduleIndex) => (
            <div
              key={module._id}
              className="bg-white border-2 border-[#F77124] rounded-2xl shadow-[0_0_2px_4px_rgba(247,113,36,0.3)] hover:shadow-[0_0_4px_6px_rgba(247,113,36,0.4)] transition-all duration-300"
            >
              <div className="p-8">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => toggleExpandModule(module._id)}
                        className="mt-1 p-1 text-[#F77124] hover:text-[#F5691D] transition-colors rounded hover:bg-[#FFE9DB]"
                      >
                        {expandedModules[module._id] ? (
                          <ChevronDown className="size-5" />
                        ) : (
                          <ChevronRight className="size-5" />
                        )}
                      </button>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-bold text-[#2B1508] font-coolvetica">
                            {module.title}
                          </h4>
                          <span className="px-3 py-1 bg-[#F77124] text-white rounded-full text-xs font-bold">
                            Module {moduleIndex + 1}
                          </span>
                        </div>
                        {module.description && (
                          <p className="text-[#2B1508]/70 leading-relaxed font-medium">
                            {module.description}
                          </p>
                        )}
                        <div className="flex items-center gap-6 text-sm text-[#2B1508]/60 pt-2">
                          <span className="flex items-center gap-2">
                            <Play className="size-4 text-[#F77124]" />
                            <span className="font-bold">{module.lessons.length}</span>
                            lesson{module.lessons.length !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="size-4 text-[#F77124]" />
                            <span className="font-bold">
                              {formatDuration(getTotalModuleDuration(module))}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <FileText className="size-4 text-[#F77124]" />
                            <span className="font-bold">
                              {module.lessons.reduce((total, lesson) => total + lesson.content.length, 0)}
                            </span>
                            content item{module.lessons.reduce((total, lesson) => total + lesson.content.length, 0) !== 1 ? "s" : ""}
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
                      className="px-4 py-2 bg-[#FFE9DB] text-[#F77124] rounded-lg hover:bg-[#F77124] hover:text-white transition-all text-sm font-bold border border-[#F77124]"
                    >
                      Manage Lessons
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditModule(moduleIndex)}
                      className="p-2 text-[#F77124] hover:text-white hover:bg-[#F77124] rounded-lg transition-all border border-[#F77124]"
                      title="Edit module"
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeModule(moduleIndex)}
                      className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all border border-red-400"
                      title="Delete module"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Module Content */}
                {expandedModules[module._id] && module.lessons.length > 0 && (
                  <div className="mt-6 pl-6 border-l-2 border-[#FFE9DB]">
                    <div className="space-y-4">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson._id}
                          className="bg-gray-50 p-6 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                                {getLessonTypeIcon(lesson)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <h5 className="font-bold text-[#2B1508] font-coolvetica">
                                    {lesson.title}
                                  </h5>
                                  <span className="px-2 py-1 bg-[#F77124] text-white rounded text-xs font-bold">
                                    Lesson {lessonIndex + 1}
                                  </span>
                                </div>
                                {lesson.description && (
                                  <p className="text-sm text-[#2B1508]/70 font-medium">
                                    {lesson.description}
                                  </p>
                                )}
                                <span className="text-xs text-[#2B1508]/60 flex items-center gap-1 font-medium">
                                  <FileText className="size-3 text-[#F77124]" />
                                  {lesson.content.length} content item{lesson.content.length !== 1 ? "s" : ""}
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
      <div className="flex items-center gap-4 pb-6 border-b border-[#FFE9DB]">
        <button
          type="button"
          onClick={() => setCurrentStep("overview")}
          className="p-2 text-[#F77124] hover:text-white hover:bg-[#F77124] rounded-lg transition-all border border-[#F77124]"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#2B1508] font-coolvetica">
            Create New Module
          </h3>
          <p className="text-sm text-[#2B1508]/70 font-medium">
            Add a new module to organize your course content into structured lessons
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="max-w-2xl space-y-8">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#2B1508]">
              Module Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Introduction to React Basics"
              value={moduleForm.title}
              onChange={(e) =>
                setModuleForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#2B1508]">
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all resize-none outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#2B1508]">
              Module Thumbnail
            </label>
            <UploadComponent
              onUploadComplete={handleModuleThumbnailUpload}
              acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              uploadType="module-thumbnail"
              maxFileSize={50 * 1024 * 1024} // 50MB 
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
              className="px-6 py-3 border-2 border-[#F77124] text-[#F77124] rounded-2xl hover:bg-[#FFE9DB] transition-all font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateModule}
              disabled={!moduleForm.title.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_2px_3px_rgba(247,113,36,0.3)] font-bold"
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
          className="p-2 text-[#F77124] hover:text-white hover:bg-[#F77124] rounded-lg transition-all border border-[#F77124]"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h3 className="text-lg font-bold text-[#2B1508] font-coolvetica">Edit Module</h3>
          <p className="text-sm text-[#2B1508]/70 font-medium">Update module information</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gray-50 p-6 rounded-2xl space-y-6 border border-gray-200">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2B1508]">
            Module Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Introduction to React Basics"
            value={moduleForm.title}
            onChange={(e) =>
              setModuleForm((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2B1508]">
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
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all resize-none outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2B1508]">
            Module Thumbnail
          </label>
          <UploadComponent
            onUploadComplete={handleModuleThumbnailUpload}
            acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
            uploadType="module-thumbnail"
            maxFileSize={50 * 1024 * 1024} // 50MB 
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
            className="px-6 py-3 border-2 border-[#F77124] text-[#F77124] rounded-2xl hover:bg-[#FFE9DB] transition-all font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdateModule}
            disabled={!moduleForm.title.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold"
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
    
    // Validate index before accessing
    if (selectedModuleIndex >= state.modules.length || selectedModuleIndex < 0) {
      console.error('selectedModuleIndex out of bounds in renderManageLessons');
      setSelectedModuleIndex(null);
      setCurrentStep("overview");
      return null;
    }
    
    const courseModule = state.modules[selectedModuleIndex];

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-[#FFE9DB]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setSelectedModuleIndex(null);
                setCurrentStep("overview");
              }}
              className="p-2 text-[#F77124] hover:text-white hover:bg-[#F77124] rounded-lg transition-all border border-[#F77124]"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#2B1508] font-coolvetica">
                Manage Lessons
              </h3>
              <p className="text-sm text-[#2B1508]/70 font-medium">
                Module:{" "}
                <span className="font-bold text-[#2B1508]">
                  {courseModule.title}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentStep("create-lesson")}
            className="flex items-center gap-2 px-6 py-3 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] transition-all duration-300 shadow-[0_0_2px_3px_rgba(247,113,36,0.3)] font-bold whitespace-nowrap"
          >
            <Plus className="size-4" />
            Add Lesson
          </button>
        </div>

        {/* Lessons List */}
        {courseModule.lessons.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <Play className="size-8 text-[#F77124]" />
            </div>
            <h4 className="text-xl font-bold text-[#2B1508] mb-3 font-coolvetica">
              No lessons yet
            </h4>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Start adding lessons to this module to build your course content
            </p>
            <button
              type="button"
              onClick={() => setCurrentStep("create-lesson")}
              className="px-6 py-3 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] transition-all duration-300 shadow-[0_0_2px_3px_rgba(247,113,36,0.3)] font-bold"
            >
              Add First Lesson
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {courseModule.lessons.map((lesson, lessonIndex) => (
              <div
                key={lesson._id}
                className="bg-white border-2 border-[#F77124] rounded-2xl p-6 shadow-[0_0_2px_4px_rgba(247,113,36,0.3)] hover:shadow-[0_0_4px_6px_rgba(247,113,36,0.4)] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                      {getLessonTypeIcon(lesson)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h5 className="font-bold text-[#2B1508] font-coolvetica">
                          {lesson.title}
                        </h5>
                        <span className="px-2 py-1 bg-[#F77124] text-white rounded text-xs font-bold">
                          Lesson {lessonIndex + 1}
                        </span>
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-[#2B1508]/70 font-medium">
                          {lesson.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-[#2B1508]/60">
                        <span className="flex items-center gap-1">
                          <FileText className="size-3 text-[#F77124]" />
                          <span className="font-bold">{lesson.content.length}</span>
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
                      className="px-4 py-2 bg-[#FFE9DB] text-[#F77124] rounded-lg hover:bg-[#F77124] hover:text-white transition-all text-sm font-bold border border-[#F77124]"
                    >
                      Content
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLesson(lessonIndex)}
                      className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all border border-red-400"
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
          className="p-2 text-[#F77124] hover:text-white hover:bg-[#F77124] rounded-lg transition-all border border-[#F77124]"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h3 className="text-lg font-bold text-[#2B1508] font-coolvetica">
            Create New Lesson
          </h3>
          <p className="text-sm text-[#2B1508]/70 font-medium">
            Add a lesson to{" "}
            {selectedModuleIndex !== null
              ? state.modules[selectedModuleIndex].title
              : ""}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#2B1508]">
              Lesson Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Creating Your First Component"
              value={lessonForm.title}
              onChange={(e) =>
                setLessonForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#2B1508]">
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all resize-none outline-none"
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
                  After creating the lesson, you can add videos, quizzes, and reading materials in the content management section.
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
            className="px-6 py-3 border-2 border-[#F77124] text-[#F77124] rounded-2xl hover:bg-[#FFE9DB] transition-all font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateLesson}
            disabled={!lessonForm.title.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold"
          >
            <Save className="size-4" />
            Create Lesson
          </button>
        </div>
      </div>
    </div>
  );

  const renderManageContent = () => {
    if (selectedModuleIndex === null || selectedLessonIndex === null) return null;
    
    // Validate indices to prevent undefined access
    if (selectedModuleIndex >= state.modules.length || selectedModuleIndex < 0) {
      console.error('selectedModuleIndex out of bounds:', selectedModuleIndex, 'modules length:', state.modules.length);
      setSelectedModuleIndex(null);
      setCurrentStep("overview");
      return null;
    }
    
    const currentModule = state.modules[selectedModuleIndex];
    if (!currentModule || !currentModule.lessons) {
      console.error('Invalid module at index:', selectedModuleIndex);
      setSelectedModuleIndex(null);
      setCurrentStep("overview");
      return null;
    }
    
    if (selectedLessonIndex >= currentModule.lessons.length || selectedLessonIndex < 0) {
      console.error('selectedLessonIndex out of bounds:', selectedLessonIndex, 'lessons length:', currentModule.lessons.length);
      setSelectedLessonIndex(null);
      setCurrentStep("manage-lessons");
      return null;
    }
    
    const lesson = currentModule.lessons[selectedLessonIndex];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedLessonIndex(null);
                setCurrentStep("manage-lessons");
              }}
              className="p-2 text-[#F77124] hover:text-white hover:bg-[#F77124] rounded-lg transition-all border border-[#F77124]"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-[#2B1508] font-coolvetica">
                Manage Lesson Content
              </h3>
              <p className="text-sm text-[#2B1508]/70 font-medium">
                Lesson: <span className="font-bold">{lesson.title}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentStep("create-content")}
            className="flex items-center gap-2 px-6 py-3 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] transition-all duration-300 shadow-[0_0_2px_3px_rgba(247,113,36,0.3)] font-bold"
          >
            <Plus className="size-4" />
            Add Content
          </button>
        </div>

        {/* Content List */}
        {lesson.content.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <FileText className="size-8 text-[#F77124]" />
            </div>
            <h4 className="text-xl font-bold text-[#2B1508] mb-3 font-coolvetica">
              No content yet
            </h4>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Start adding videos or quizzes to this lesson
            </p>
            <button
              type="button"
              onClick={() => setCurrentStep("create-content")}
              className="px-6 py-3 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] transition-all duration-300 shadow-[0_0_2px_3px_rgba(247,113,36,0.3)] font-bold"
            >
              Add First Content
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {lesson.content.map((content, contentIndex) => (
              <div
                key={content._id}
                className="bg-white border-2 border-[#F77124] rounded-2xl p-6 shadow-[0_0_2px_4px_rgba(247,113,36,0.3)] hover:shadow-[0_0_4px_6px_rgba(247,113,36,0.4)] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                      {getContentTypeIcon(content)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h5 className="font-bold text-[#2B1508] font-coolvetica">
                          {content.title}
                        </h5>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold text-white",
                          content.type === 'video' ? "bg-[#F77124]" : "bg-[#24F795]"
                        )}>
                          {content.type.toUpperCase()}
                        </span>
                      </div>
                      {content.description && (
                        <p className="text-sm text-[#2B1508]/70 font-medium">
                          {content.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-[#2B1508]/60">
                        {content.type === 'video' && 'duration' in content.content && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-[#F77124]" />
                            <span className="font-bold">{formatDuration(content.content.duration || 0)}</span>
                          </span>
                        )}
                        {content.type === 'quiz' && 'questions' in content.content && (
                          <span className="flex items-center gap-1">
                            <HelpCircle className="size-3 text-[#24F795]" />
                            <span className="font-bold">{content.content.questions.length} questions</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeContent(contentIndex)}
                    className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all border border-red-400"
                    title="Delete content"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCreateContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            resetContentForms();
            setCurrentStep("manage-content");
          }}
          className="p-2 text-[#F77124] hover:text-white hover:bg-[#F77124] rounded-lg transition-all border border-[#F77124]"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h3 className="text-lg font-bold text-[#2B1508] font-coolvetica">
            Add Content
          </h3>
          <p className="text-sm text-[#2B1508]/70 font-medium">
            Choose content type and add details
          </p>
        </div>
      </div>

      {!selectedContentType ? (
        /* Content Type Selection */
        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
          <h4 className="text-lg font-bold text-[#2B1508] mb-6 text-center font-coolvetica">
            Choose Content Type
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => setSelectedContentType('video')}
              className="p-8 bg-white border-2 border-[#F77124] rounded-2xl hover:bg-[#FFE9DB] transition-all group text-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-[#F77124]/20 rounded-full flex items-center justify-center">
                  <Video className="size-8 text-[#F77124]" />
                </div>
                <div>
                  <h5 className="text-lg font-bold text-[#2B1508] font-coolvetica">Video Content</h5>
                  <p className="text-sm text-[#2B1508]/70">Add video lessons with upload or URL</p>
                </div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setSelectedContentType('quiz')}
              className="p-8 bg-white border-2 border-[#24F795] rounded-2xl hover:bg-[#24F795]/10 transition-all group text-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-[#24F795]/20 rounded-full flex items-center justify-center">
                  <HelpCircle className="size-8 text-[#24F795]" />
                </div>
                <div>
                  <h5 className="text-lg font-bold text-[#2B1508] font-coolvetica">Quiz Content</h5>
                  <p className="text-sm text-[#2B1508]/70">Create interactive quizzes with questions</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      ) : selectedContentType === 'video' ? (
        /* Video Form */
        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 space-y-6">
          <h4 className="text-lg font-bold text-[#2B1508] font-coolvetica">Create Video Content</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#2B1508]">
                Video Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Introduction to Components"
                value={videoForm.title}
                onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#2B1508]">
                Video Quality
              </label>
              <select
                value={videoForm.quality}
                onChange={(e) => setVideoForm(prev => ({ ...prev, quality: e.target.value as VideoQuality["quality"] }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none bg-white"
              >
                <option value="1080p">1080p (Full HD)</option>
                <option value="720p">720p (HD)</option>
                <option value="480p">480p (SD)</option>
                <option value="360p">360p (Low)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#2B1508]">
              Video Description
            </label>
            <textarea
              placeholder="Describe what this video covers..."
              value={videoForm.description}
              onChange={(e) => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all resize-none outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#2B1508]">
              Video File <span className="text-red-500">*</span>
            </label>
            <UploadComponent
              onUploadComplete={handleVideoUpload}
              acceptedFileTypes={['video/mp4', 'video/webm', 'video/ogg']}
              uploadType="lesson-video"
              maxFileSize={50 * 1024 * 1024 * 1024} // 50GB 
              placeholder="Upload video file"
              currentUrl={videoForm.videoUrl}
              allowUrlInput={true}
            />
            {videoForm.videoUrl && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Video uploaded successfully!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  👆 Click &quot;Create Video&quot; below to add this video to your lesson.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#2B1508]">
                Video Thumbnail
              </label>
                             <UploadComponent
                 onUploadComplete={handleVideoThumbnailUpload}
                 acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                 uploadType="thumbnail"
                 maxFileSize={50 * 1024 * 1024} // 50MB
                 placeholder="Upload thumbnail (optional)"
                 currentUrl={videoForm.thumbnailUrl}
                 allowUrlInput={true}
               />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetContentForms();
                setCurrentStep("manage-content");
              }}
              className="px-6 py-3 border-2 border-[#F77124] text-[#F77124] rounded-2xl hover:bg-[#FFE9DB] transition-all font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateVideoContent}
              disabled={!videoForm.title.trim() || !videoForm.videoUrl.trim()}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-bold ${
                videoForm.videoUrl.trim() && videoForm.title.trim()
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg animate-pulse'
                  : 'bg-[#F77124] text-white hover:bg-[#F5691D] disabled:bg-gray-300 disabled:cursor-not-allowed'
              }`}
            >
              <Save className="size-4" />
              {videoForm.videoUrl.trim() && videoForm.title.trim() ? '🎬 Create Video!' : 'Create Video'}
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Form */
        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 space-y-6">
          <h4 className="text-lg font-bold text-[#2B1508] font-coolvetica">Create Quiz Content</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#2B1508]">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Components Quiz"
                value={quizForm.title}
                onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#2B1508]">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={quizForm.passingScore}
                onChange={(e) => setQuizForm(prev => ({ ...prev, passingScore: Number(e.target.value) }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#2B1508]">
                Max Attempts
              </label>
              <input
                type="number"
                min="1"
                value={quizForm.maxAttempts}
                onChange={(e) => setQuizForm(prev => ({ ...prev, maxAttempts: Number(e.target.value) }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#2B1508]">
              Quiz Description
            </label>
            <textarea
              placeholder="Describe what this quiz covers..."
              value={quizForm.description}
              onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all resize-none outline-none"
            />
          </div>

          {/* Questions Management */}
          <div className="space-y-4">
            <h5 className="text-md font-bold text-[#2B1508] font-coolvetica">Quiz Questions</h5>
            
            {/* Add Question Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#2B1508]">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your question..."
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="space-y-2">
                    <label className="block text-sm font-bold text-[#2B1508]">
                      Option {index + 1} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={currentQuestion.correctAnswers.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCurrentQuestion(prev => ({
                              ...prev,
                              correctAnswers: [...prev.correctAnswers, index]
                            }));
                          } else {
                            setCurrentQuestion(prev => ({
                              ...prev,
                              correctAnswers: prev.correctAnswers.filter(i => i !== index)
                            }));
                          }
                        }}
                        className="mt-3 rounded border-gray-300 text-[#F77124] focus:ring-[#F77124]"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...currentQuestion.options];
                          newOptions[index] = e.target.value;
                          setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                        }}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#2B1508]">
                    Time Limit (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={currentQuestion.timeLimit}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, timeLimit: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] transition-all outline-none"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleAddQuizQuestion}
                disabled={!currentQuestion.question.trim() || currentQuestion.options.some(opt => !opt.trim()) || currentQuestion.correctAnswers.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#24F795] text-white rounded-lg hover:bg-[#20d084] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold"
              >
                <Plus className="size-4" />
                Add Question
              </button>
            </div>

            {/* Questions List */}
            {quizForm.questions.length > 0 && (
              <div className="space-y-3">
                <h6 className="text-sm font-bold text-[#2B1508]">Added Questions ({quizForm.questions.length})</h6>
                {quizForm.questions.map((question, questionIndex) => (
                  <div key={question._id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-start">
                    <div className="flex-1">
                      <h6 className="font-bold text-[#2B1508] mb-2">{questionIndex + 1}. {question.question}</h6>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {question.options.map((option) => (
                          <div key={option._id} className={cn(
                            "p-2 rounded",
                            question.correctAnswer.some(correct => correct._id === option._id)
                              ? "bg-[#24F795]/20 text-[#24F795] font-bold"
                              : "bg-gray-100"
                          )}>
                            {option.option}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuizQuestion(questionIndex)}
                      className="p-1 text-red-400 hover:text-red-600 ml-4"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetContentForms();
                setCurrentStep("manage-content");
              }}
              className="px-6 py-3 border-2 border-[#F77124] text-[#F77124] rounded-2xl hover:bg-[#FFE9DB] transition-all font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateQuizContent}
              disabled={!quizForm.title.trim() || quizForm.questions.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-[#24F795] text-white rounded-2xl hover:bg-[#20d084] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold"
            >
              <Save className="size-4" />
              Create Quiz ({quizForm.questions.length} questions)
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Main render based on current step
  return (
    <Container
      id="modules"
      icon={BookOpen}
      title="Course Modules & Content"
      description="Create and organize your course structure with proper type safety"
    >
      <div className="w-full">
        {currentStep === "overview" && renderOverview()}
        {currentStep === "create-module" && renderCreateModule()}
        {currentStep === "edit-module" && renderEditModule()}
        {currentStep === "manage-lessons" && renderManageLessons()}
        {currentStep === "create-lesson" && renderCreateLesson()}
        {currentStep === "manage-content" && renderManageContent()}
        {currentStep === "create-content" && renderCreateContent()}
      </div>
    </Container>
  );
};

export default ModulesSection;
