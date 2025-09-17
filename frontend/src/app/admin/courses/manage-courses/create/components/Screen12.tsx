import React, { useState, useCallback, useMemo } from "react";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import Container from "@/app/admin/components/ui/Container";
import ScreenNavigation from "./shared/ScreenNavigation";
import { useScreen } from "../contexts/ScreenContext";
import { useUpload } from "@/hooks/useUpload";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import DropDown from "@/components/ui/dropdown/DropDown";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import {
  Plus,
  Edit3,
  Trash2,
  Play,
  FileText,
  BookOpen,
  Video,
  HelpCircle,
  Clock,
  Lock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  CourseModule,
  CourseLesson,
  Content,
  VideoContent,
  QuizContent,
} from "@/types";

const Screen12 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const { uploadWithPresignedUrl, isUploading } = useUpload();

  // State for UI
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set()
  );
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Form states
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    isActive: true,
  });
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
  });
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    type: "video" as "video" | "quiz",
    // Video specific
    videoUrl: "",
    thumbnailUrl: "",
    duration: "",
    // Quiz specific
    questions: [] as any[],
    passingScore: "",
  });

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Generate folder names
  const courseTitle = state.course.title || "untitled-course";
  const moduleFolder = `courses/${courseTitle}/modules`;

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

  // Handle video upload
  const handleVideoUpload = async (
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
      console.error("Video upload failed:", error);
      throw error;
    }
  };

  // Module management
  const handleCreateModule = async () => {
    if (!newModule.title.trim()) return;

    setIsCreating(true);
    try {
      const moduleData: CourseModule = {
        title: newModule.title.trim(),
        description: newModule.description.trim() || undefined,
        thumbnailUrl: newModule.thumbnailUrl,
        lessonIds: [],
        lessons: [],
        isCompleted: false,
        isActive: newModule.isActive,
        isLocked: false,
      };

      actions.addCourseModule(moduleData);
      setNewModule({
        title: "",
        description: "",
        thumbnailUrl: "",
        isActive: true,
      });
      setShowModuleModal(false);
    } catch (error) {
      console.error("Error creating module:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateModule = async () => {
    if (!editingModule || !editingModule._id) return;

    setIsUpdating(true);
    try {
      const updatedModule = {
        ...editingModule,
        title: newModule.title.trim(),
        description: newModule.description.trim() || undefined,
        thumbnailUrl: newModule.thumbnailUrl,
        isActive: newModule.isActive,
      };

      actions.updateCourseModule(editingModule._id, updatedModule);
      setEditingModule(null);
      setShowModuleModal(false);
    } catch (error) {
      console.error("Error updating module:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this module? This will also delete all lessons and content within it."
      )
    ) {
      return;
    }

    setIsDeleting(moduleId);
    try {
      actions.deleteCourseModule(moduleId);
    } catch (error) {
      console.error("Error deleting module:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Lesson management
  const handleCreateLesson = async () => {
    if (!newLesson.title.trim() || !selectedModuleId) return;

    setIsCreating(true);
    try {
      const lessonData: CourseLesson = {
        title: newLesson.title.trim(),
        description: newLesson.description.trim() || undefined,
        contentIds: [],
        isCompleted: false,
        isLocked: false,
      };

      actions.addCourseLesson(selectedModuleId!, lessonData);
      setNewLesson({ title: "", description: "" });
      setShowLessonModal(false);
      setSelectedModuleId(null);
    } catch (error) {
      console.error("Error creating lesson:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson || !editingLesson._id) return;

    setIsUpdating(true);
    try {
      const updatedLesson = {
        ...editingLesson,
        title: newLesson.title.trim(),
        description: newLesson.description.trim() || undefined,
      };

      actions.updateCourseLesson(
        selectedModuleId!,
        editingLesson._id,
        updatedLesson
      );
      setEditingLesson(null);
      setShowLessonModal(false);
    } catch (error) {
      console.error("Error updating lesson:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this lesson? This will also delete all content within it."
      )
    ) {
      return;
    }

    setIsDeleting(lessonId);
    try {
      actions.deleteCourseLesson(selectedModuleId!, lessonId);
    } catch (error) {
      console.error("Error deleting lesson:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Content management
  const handleCreateContent = async () => {
    if (!newContent.title.trim() || !selectedLessonId) return;

    setIsCreating(true);
    try {
      let contentData: Content;

      if (newContent.type === "video") {
        contentData = {
          title: newContent.title.trim(),
          description: newContent.description.trim() || undefined,
          type: "video",
          sources: [
            {
              quality: "1080p",
              videoUrl: newContent.videoUrl,
            },
          ],
          thumbnailUrl: newContent.thumbnailUrl || undefined,
          duration: newContent.duration
            ? parseInt(newContent.duration)
            : undefined,
          isCompleted: false,
          isLocked: false,
        } as VideoContent;
      } else {
        contentData = {
          title: newContent.title.trim(),
          description: newContent.description.trim() || undefined,
          type: "quiz",
          questions: newContent.questions,
          passingScore: newContent.passingScore
            ? parseInt(newContent.passingScore)
            : undefined,
          isCompleted: false,
          isLocked: false,
        } as QuizContent;
      }

      actions.addCourseContent(
        selectedModuleId!,
        selectedLessonId!,
        contentData
      );
      setNewContent({
        title: "",
        description: "",
        type: "video",
        videoUrl: "",
        thumbnailUrl: "",
        duration: "",
        questions: [],
        passingScore: "",
      });
      setShowContentModal(false);
      setSelectedLessonId(null);
    } catch (error) {
      console.error("Error creating content:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateContent = async () => {
    if (!editingContent || !editingContent._id) return;

    setIsUpdating(true);
    try {
      let updatedContent: Content;

      if (editingContent.type === "video") {
        updatedContent = {
          ...editingContent,
          title: newContent.title.trim(),
          description: newContent.description.trim() || undefined,
          sources: [
            {
              quality: "1080p",
              videoUrl: newContent.videoUrl,
            },
          ],
          thumbnailUrl: newContent.thumbnailUrl || undefined,
          duration: newContent.duration
            ? parseInt(newContent.duration)
            : undefined,
        } as VideoContent;
      } else {
        updatedContent = {
          ...editingContent,
          title: newContent.title.trim(),
          description: newContent.description.trim() || undefined,
          questions: newContent.questions,
          passingScore: newContent.passingScore
            ? parseInt(newContent.passingScore)
            : undefined,
        } as QuizContent;
      }

      actions.updateCourseContent(
        selectedModuleId!,
        selectedLessonId!,
        editingContent._id,
        updatedContent
      );
      setEditingContent(null);
      setShowContentModal(false);
    } catch (error) {
      console.error("Error updating content:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this content?")) {
      return;
    }

    setIsDeleting(contentId);
    try {
      actions.deleteCourseContent(
        selectedModuleId!,
        selectedLessonId!,
        contentId
      );
    } catch (error) {
      console.error("Error deleting content:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Toggle expanded states
  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleLessonExpanded = (lessonId: string) => {
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

  // Open modals
  const openModuleModal = (module?: CourseModule) => {
    if (module) {
      setEditingModule(module);
      setNewModule({
        title: module.title,
        description: module.description || "",
        thumbnailUrl: module.thumbnailUrl,
        isActive: module.isActive ?? true,
      });
    } else {
      setEditingModule(null);
      setNewModule({
        title: "",
        description: "",
        thumbnailUrl: "",
        isActive: true,
      });
    }
    setShowModuleModal(true);
  };

  const openLessonModal = (lesson?: CourseLesson, moduleId?: string) => {
    if (lesson) {
      setEditingLesson(lesson);
      setNewLesson({
        title: lesson.title,
        description: lesson.description || "",
      });
    } else {
      setEditingLesson(null);
      setNewLesson({ title: "", description: "" });
      setSelectedModuleId(moduleId || null);
    }
    setShowLessonModal(true);
  };

  const openContentModal = (content?: Content, lessonId?: string) => {
    if (content) {
      setEditingContent(content);
      setNewContent({
        title: content.title,
        description: content.description || "",
        type: content.type,
        videoUrl:
          content.type === "video" ? content.sources[0]?.videoUrl || "" : "",
        thumbnailUrl:
          content.type === "video" ? content.thumbnailUrl || "" : "",
        duration:
          content.type === "video" ? content.duration?.toString() || "" : "",
        questions: content.type === "quiz" ? content.questions : [],
        passingScore:
          content.type === "quiz" ? content.passingScore?.toString() || "" : "",
      });
    } else {
      setEditingContent(null);
      setNewContent({
        title: "",
        description: "",
        type: "video",
        videoUrl: "",
        thumbnailUrl: "",
        duration: "",
        questions: [],
        passingScore: "",
      });
      setSelectedLessonId(lessonId || null);
    }
    setShowContentModal(true);
  };

  // Validation
  const isFormValid = useMemo(() => {
    return state.course.modules && state.course.modules.length > 0;
  }, [state.course.modules]);

  return (
    <Container
      title="Course Modules & Content"
      description="Create and organize your course modules, lessons, and content"
      className="rounded-b-none h-full w-full flex flex-col"
    >
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen className="w-4 h-4" />
            <span>{state.course.modules?.length || 0} Modules</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>
              {state.course.modules?.reduce(
                (total, module) => total + (module.lessons?.length || 0),
                0
              ) || 0}{" "}
              Lessons
            </span>
          </div>
        </div>
        <OrangeButton
          onClick={() => openModuleModal()}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Module
        </OrangeButton>
      </div>

      {/* Modules List */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        {state.course.modules?.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Modules Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first module to start building your course content.
            </p>
            <OrangeButton onClick={() => openModuleModal()}>
              Create First Module
            </OrangeButton>
          </div>
        ) : (
          state.course.modules?.map((module, index) => (
            <div
              key={module._id || `module-${index}`}
              className="bg-white border border-gray-200 rounded-xl shadow-sm"
            >
              {/* Module Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleModuleExpanded(module._id!)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedModules.has(module._id!) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      {module.thumbnailUrl ? (
                        <img
                          src={module.thumbnailUrl}
                          alt={module.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <BookOpen className="w-8 h-8 text-white" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {module.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {module.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                              Inactive
                            </span>
                          )}
                          {module.isLocked && (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      {module.description && (
                        <p className="text-gray-600 text-sm">
                          {module.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{module.lessons?.length || 0} Lessons</span>
                        <span>
                          {module.lessons?.reduce(
                            (total, lesson) =>
                              total + (lesson.contents?.length || 0),
                            0
                          ) || 0}{" "}
                          Content Items
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openLessonModal(undefined, module._id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Add Lesson"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModuleModal(module)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Module"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(module._id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Module"
                      disabled={isDeleting === module._id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Module Lessons */}
              {expandedModules.has(module._id!) && (
                <div className="p-6 bg-gray-50">
                  {module.lessons?.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">
                        No lessons in this module yet.
                      </p>
                      <WhiteButton
                        onClick={() => openLessonModal(undefined, module._id)}
                      >
                        Add First Lesson
                      </WhiteButton>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {module.lessons?.map((lesson, index) => (
                        <div
                          key={lesson._id || `lesson-${index}`}
                          className="bg-white border border-gray-200 rounded-lg"
                        >
                          {/* Lesson Header */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    toggleLessonExpanded(lesson._id!)
                                  }
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                  {expandedLessons.has(lesson._id!) ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>

                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-white" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900">
                                      {lesson.title}
                                    </h4>
                                    {lesson.isLocked && (
                                      <Lock className="w-3 h-3 text-gray-400" />
                                    )}
                                  </div>
                                  {lesson.description && (
                                    <p className="text-sm text-gray-600">
                                      {lesson.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    <span>
                                      {lesson.contents?.length || 0} Content
                                      Items
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    openContentModal(undefined, lesson._id)
                                  }
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Add Content"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => openLessonModal(lesson)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                  title="Edit Lesson"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteLesson(lesson._id!)
                                  }
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Lesson"
                                  disabled={isDeleting === lesson._id}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Lesson Content */}
                          {expandedLessons.has(lesson._id!) && (
                            <div className="px-4 pb-4 bg-gray-50">
                              {lesson.contents?.length === 0 ? (
                                <div className="text-center py-6">
                                  <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500 mb-3">
                                    No content in this lesson yet.
                                  </p>
                                  <WhiteButton
                                    onClick={() =>
                                      openContentModal(undefined, lesson._id)
                                    }
                                    className="text-sm px-3 py-1.5"
                                  >
                                    Add Content
                                  </WhiteButton>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {lesson.contents?.map((content, index) => (
                                    <div
                                      key={content._id || `content-${index}`}
                                      className="bg-white border border-gray-200 rounded-lg p-3"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                            {content.type === "video" ? (
                                              <Play className="w-4 h-4 text-white" />
                                            ) : (
                                              <HelpCircle className="w-4 h-4 text-white" />
                                            )}
                                          </div>

                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h5 className="font-medium text-gray-900 text-sm">
                                                {content.title}
                                              </h5>
                                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                {content.type}
                                              </span>
                                              {content.isLocked && (
                                                <Lock className="w-3 h-3 text-gray-400" />
                                              )}
                                            </div>
                                            {content.description && (
                                              <p className="text-xs text-gray-600">
                                                {content.description}
                                              </p>
                                            )}
                                            {content.type === "video" &&
                                              content.duration && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                  <Clock className="w-3 h-3" />
                                                  <span>
                                                    {Math.floor(
                                                      content.duration / 60
                                                    )}
                                                    m {content.duration % 60}s
                                                  </span>
                                                </div>
                                              )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() =>
                                              openContentModal(content)
                                            }
                                            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                            title="Edit Content"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeleteContent(content._id!)
                                            }
                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Delete Content"
                                            disabled={
                                              isDeleting === content._id
                                            }
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingModule ? "Edit Module" : "Create New Module"}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <Input
                label="Module Title"
                value={newModule.title}
                onChange={(e) =>
                  setNewModule((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter module title"
                required
              />

              <TextArea
                label="Description (Optional)"
                value={newModule.description}
                onChange={(e) =>
                  setNewModule((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter module description"
                rows={3}
              />

              <UploadMediaContainer
                title="Module Thumbnail"
                description="Upload a thumbnail image for this module"
                type="image"
                mediaUrl={newModule.thumbnailUrl}
                onFileUpload={async (file) => {
                  const url = await handleModuleThumbnailUpload(
                    file,
                    moduleFolder
                  );
                  setNewModule((prev) => ({ ...prev, thumbnailUrl: url }));
                  return url;
                }}
                onFileRemove={() =>
                  setNewModule((prev) => ({ ...prev, thumbnailUrl: "" }))
                }
                onUrlSubmit={(url) =>
                  setNewModule((prev) => ({ ...prev, thumbnailUrl: url }))
                }
                acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
                maxSize={5}
                allowUrlInput={true}
                urlPlaceholder="Enter thumbnail URL"
                folderName={moduleFolder}
                isUploading={isUploading}
                usePresignedUrl={true}
                presignedUrlThreshold={2}
              />

              <CheckBoxContainer
                label="Module Active"
                checked={newModule.isActive}
                onChange={(checked) =>
                  setNewModule((prev) => ({ ...prev, isActive: checked }))
                }
                description="Enable this module for students"
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton onClick={() => setShowModuleModal(false)}>
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={
                  editingModule ? handleUpdateModule : handleCreateModule
                }
                disabled={!newModule.title.trim() || isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? "Saving..."
                  : editingModule
                  ? "Update Module"
                  : "Create Module"}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingLesson ? "Edit Lesson" : "Create New Lesson"}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <Input
                label="Lesson Title"
                value={newLesson.title}
                onChange={(e) =>
                  setNewLesson((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter lesson title"
                required
              />

              <TextArea
                label="Description (Optional)"
                value={newLesson.description}
                onChange={(e) =>
                  setNewLesson((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter lesson description"
                rows={3}
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton onClick={() => setShowLessonModal(false)}>
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={
                  editingLesson ? handleUpdateLesson : handleCreateLesson
                }
                disabled={!newLesson.title.trim() || isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? "Saving..."
                  : editingLesson
                  ? "Update Lesson"
                  : "Create Lesson"}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {/* Content Modal */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingContent ? "Edit Content" : "Create New Content"}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <Input
                label="Content Title"
                value={newContent.title}
                onChange={(e) =>
                  setNewContent((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter content title"
                required
              />

              <TextArea
                label="Description (Optional)"
                value={newContent.description}
                onChange={(e) =>
                  setNewContent((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter content description"
                rows={3}
              />

              <DropDown
                label="Content Type"
                value={newContent.type === "video" ? "Video" : "Quiz"}
                options={["Video", "Quiz"]}
                onChange={(e) =>
                  setNewContent((prev) => ({
                    ...prev,
                    type: e.target.value === "Video" ? "video" : "quiz",
                  }))
                }
                required
              />

              {newContent.type === "video" && (
                <>
                  <Input
                    label="Video URL"
                    value={newContent.videoUrl}
                    onChange={(e) =>
                      setNewContent((prev) => ({
                        ...prev,
                        videoUrl: e.target.value,
                      }))
                    }
                    placeholder="Enter video URL"
                    required
                  />

                  <Input
                    label="Thumbnail URL (Optional)"
                    value={newContent.thumbnailUrl}
                    onChange={(e) =>
                      setNewContent((prev) => ({
                        ...prev,
                        thumbnailUrl: e.target.value,
                      }))
                    }
                    placeholder="Enter thumbnail URL"
                  />

                  <Input
                    label="Duration (seconds)"
                    type="number"
                    value={newContent.duration}
                    onChange={(e) =>
                      setNewContent((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    placeholder="Enter duration in seconds"
                  />
                </>
              )}

              {newContent.type === "quiz" && (
                <>
                  <Input
                    label="Passing Score (Optional)"
                    type="number"
                    value={newContent.passingScore}
                    onChange={(e) =>
                      setNewContent((prev) => ({
                        ...prev,
                        passingScore: e.target.value,
                      }))
                    }
                    placeholder="Enter passing score"
                  />

                  <div className="text-sm text-gray-500">
                    Quiz questions can be added after creating the content.
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton onClick={() => setShowContentModal(false)}>
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={
                  editingContent ? handleUpdateContent : handleCreateContent
                }
                disabled={!newContent.title.trim() || isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? "Saving..."
                  : editingContent
                  ? "Update Content"
                  : "Create Content"}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      <ScreenNavigation
        currentStep={12}
        previousScreen="screen11"
        nextScreen="screen13"
        isNextDisabled={!isFormValid}
        setActiveScreen={setActiveScreen}
      />
    </Container>
  );
};

export default Screen12;
