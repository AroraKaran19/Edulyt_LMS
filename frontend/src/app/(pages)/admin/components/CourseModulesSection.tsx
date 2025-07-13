"use client";

import React, { useState } from "react";
import {
  Plus,
  X,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface Material {
  id: string;
  name: string;
  file?: File;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  videoFile?: File;
  materials: Material[];
  isForCollegeStudent: boolean;
}

interface Module {
  id: string;
  title: string;
  duration: string;
  description: string;
  lessons: Lesson[];
}

const CourseModulesSection = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(
    new Set()
  );
  const [collapsedLessons, setCollapsedLessons] = useState<Set<string>>(
    new Set()
  );

  const addModule = () => {
    const newModule: Module = {
      id: `module_${Date.now()}`,
      title: "",
      duration: "",
      description: "",
      lessons: [
        {
          id: `lesson_${Date.now()}_1`,
          title: "",
          duration: "",
          videoUrl: "",
          materials: [{ id: `material_${Date.now()}`, name: "" }],
          isForCollegeStudent: false,
        },
      ],
    };
    setModules([...modules, newModule]);
  };

  const removeModule = (moduleId: string) => {
    setModules(modules.filter((module) => module.id !== moduleId));
  };

  const updateModule = (
    moduleId: string,
    field: keyof Module,
    value: string
  ) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId ? { ...module, [field]: value } : module
      )
    );
  };

  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: `lesson_${Date.now()}`,
      title: "",
      duration: "",
      videoUrl: "",
      materials: [{ id: `material_${Date.now()}`, name: "" }],
      isForCollegeStudent: false,
    };

    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? { ...module, lessons: [...module.lessons, newLesson] }
          : module
      )
    );
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.filter(
                (lesson) => lesson.id !== lessonId
              ),
            }
          : module
      )
    );
  };

  const updateLesson = (
    moduleId: string,
    lessonId: string,
    field: keyof Lesson,
    value: string | boolean
  ) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
              ),
            }
          : module
      )
    );
  };

  const addMaterial = (moduleId: string, lessonId: string) => {
    const newMaterial: Material = {
      id: `material_${Date.now()}`,
      name: "",
    };

    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === lessonId
                  ? { ...lesson, materials: [...lesson.materials, newMaterial] }
                  : lesson
              ),
            }
          : module
      )
    );
  };

  const removeMaterial = (
    moduleId: string,
    lessonId: string,
    materialId: string
  ) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === lessonId
                  ? {
                      ...lesson,
                      materials: lesson.materials.filter(
                        (material) => material.id !== materialId
                      ),
                    }
                  : lesson
              ),
            }
          : module
      )
    );
  };

  const updateMaterial = (
    moduleId: string,
    lessonId: string,
    materialId: string,
    name: string
  ) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === lessonId
                  ? {
                      ...lesson,
                      materials: lesson.materials.map((material) =>
                        material.id === materialId
                          ? { ...material, name }
                          : material
                      ),
                    }
                  : lesson
              ),
            }
          : module
      )
    );
  };

  const handleVideoUpload = (
    moduleId: string,
    lessonId: string,
    file: File
  ) => {
    console.log("Uploading video:", file);
  };

  const handleMaterialUpload = (
    moduleId: string,
    lessonId: string,
    materialId: string,
    file: File
  ) => {
    console.log("Uploading material:", file);
  };

  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleLessonCollapse = (lessonId: string) => {
    setCollapsedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Course Modules
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Structure your course content into organized modules and lessons
            </p>
          </div>
          <button
            type="button"
            onClick={addModule}
            className="bg-[#F77124] text-white px-4 py-2.5 rounded-lg hover:bg-[#e5631f] transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        </div>

        {/* Empty State */}
        {modules.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6">
                <BookOpen className="w-10 h-10 text-gray-400" />
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#F77124] rounded-full flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Ready to build your course?
              </h3>

              <p className="text-gray-600 mb-8 leading-relaxed">
                Start by creating your first module. Each module can contain
                multiple lessons with videos, materials, and assignments to
                create a comprehensive learning experience.
              </p>

              <button
                type="button"
                onClick={addModule}
                className="bg-[#F77124] text-white px-6 py-3 rounded-lg hover:bg-[#e5631f] transition-all duration-200 flex items-center gap-2 font-medium mx-auto shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" />
                Create Your First Module
              </button>

              <div className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <span>Organize content for better learning outcomes</span>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          /* Modules List */
          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <div
                key={module.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Module Header */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleModuleCollapse(module.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        {collapsedModules.has(module.id) ? (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-[#F77124] rounded-lg">
                          <span className="text-white font-semibold text-sm">
                            {moduleIndex + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {module.title || `Module ${moduleIndex + 1}`}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            {module.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{module.duration}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              <span>
                                {module.lessons.length} lesson
                                {module.lessons.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeModule(module.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                      Remove Module
                    </button>
                  </div>
                </div>

                {/* Module Content */}
                {!collapsedModules.has(module.id) && (
                  <div className="p-6 space-y-6">
                    {/* Module Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Module Title *
                        </label>
                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) =>
                            updateModule(module.id, "title", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200"
                          placeholder="e.g., Python Fundamentals"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={module.duration}
                          onChange={(e) =>
                            updateModule(module.id, "duration", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200"
                          placeholder="e.g., 8 hours"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Module Description
                      </label>
                      <textarea
                        rows={3}
                        value={module.description}
                        onChange={(e) =>
                          updateModule(module.id, "description", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Brief description of what this module covers..."
                      />
                    </div>

                    {/* Lessons Section */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-semibold text-gray-900">Lessons</h5>
                        <button
                          type="button"
                          onClick={() => addLesson(module.id)}
                          className="bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 text-sm font-medium border border-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                          Add Lesson
                        </button>
                      </div>

                      <div className="space-y-4">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="bg-white border border-gray-200 rounded-lg"
                          >
                            {/* Lesson Header */}
                            <div className="px-4 py-3 border-b border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleLessonCollapse(lesson.id)
                                    }
                                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 transition-colors duration-200"
                                  >
                                    {collapsedLessons.has(lesson.id) ? (
                                      <ChevronRight className="w-3 h-3 text-gray-600" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3 text-gray-600" />
                                    )}
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-xs font-medium text-gray-600">
                                      {lessonIndex + 1}
                                    </div>
                                    <span className="font-medium text-gray-900 text-sm">
                                      {lesson.title ||
                                        `Lesson ${lessonIndex + 1}`}
                                    </span>
                                    {lesson.duration && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        <span>{lesson.duration}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeLesson(module.id, lesson.id)
                                  }
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors duration-200 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {/* Lesson Content */}
                            {!collapsedLessons.has(lesson.id) && (
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                      Lesson Title *
                                    </label>
                                    <input
                                      type="text"
                                      value={lesson.title}
                                      onChange={(e) =>
                                        updateLesson(
                                          module.id,
                                          lesson.id,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200"
                                      placeholder="e.g., Introduction to Python"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                      Duration
                                    </label>
                                    <input
                                      type="text"
                                      value={lesson.duration}
                                      onChange={(e) =>
                                        updateLesson(
                                          module.id,
                                          lesson.id,
                                          "duration",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200"
                                      placeholder="e.g., 45 min"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Video URL *
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="url"
                                      value={lesson.videoUrl}
                                      onChange={(e) =>
                                        updateLesson(
                                          module.id,
                                          lesson.id,
                                          "videoUrl",
                                          e.target.value
                                        )
                                      }
                                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200"
                                      placeholder="https://example.com/videos/lesson1.mp4"
                                    />
                                    <input
                                      type="file"
                                      accept="video/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                          handleVideoUpload(
                                            module.id,
                                            lesson.id,
                                            file
                                          );
                                      }}
                                      className="hidden"
                                      id={`video-${lesson.id}`}
                                    />
                                    <label
                                      htmlFor={`video-${lesson.id}`}
                                      className="bg-[#F77124] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#e5631f] transition-colors duration-200 cursor-pointer font-medium whitespace-nowrap"
                                    >
                                      Upload Video
                                    </label>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Learning Materials
                                  </label>
                                  <div className="space-y-2">
                                    {lesson.materials.map((material) => (
                                      <div
                                        key={material.id}
                                        className="flex gap-2 items-center"
                                      >
                                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <input
                                          type="text"
                                          value={material.name}
                                          onChange={(e) =>
                                            updateMaterial(
                                              module.id,
                                              lesson.id,
                                              material.id,
                                              e.target.value
                                            )
                                          }
                                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200"
                                          placeholder="Material name (e.g., python-basics.pdf)"
                                        />
                                        <input
                                          type="file"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file)
                                              handleMaterialUpload(
                                                module.id,
                                                lesson.id,
                                                material.id,
                                                file
                                              );
                                          }}
                                          className="hidden"
                                          id={`material-${material.id}`}
                                        />
                                        <label
                                          htmlFor={`material-${material.id}`}
                                          className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors duration-200 cursor-pointer font-medium whitespace-nowrap"
                                        >
                                          Upload File
                                        </label>
                                        {lesson.materials.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeMaterial(
                                                module.id,
                                                lesson.id,
                                                material.id
                                              )
                                            }
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors duration-200"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addMaterial(module.id, lesson.id)
                                      }
                                      className="text-[#F77124] hover:text-[#e5631f] text-sm flex items-center gap-1 font-medium"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Material
                                    </button>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={lesson.isForCollegeStudent}
                                      onChange={(e) =>
                                        updateLesson(
                                          module.id,
                                          lesson.id,
                                          "isForCollegeStudent",
                                          e.target.checked
                                        )
                                      }
                                      className="w-4 h-4 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
                                    />
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-gray-700 font-medium">
                                      Available for College Students
                                    </span>
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseModulesSection;
