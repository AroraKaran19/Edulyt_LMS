"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Course, CourseModule, Content } from "@/types";

interface CollaborationDomainPartialAccessPickerProps {
  courseDetails: Course | null;
  loading: boolean;
  selectedModules: Set<string>;
  selectedLessons: Record<string, Set<string>>;
  selectedContents: Record<string, Set<string>>;
  onToggleModule: (moduleId: string) => void;
  onToggleLesson: (moduleId: string, lessonId: string) => void;
  onToggleContent: (
    moduleId: string,
    lessonId: string,
    contentId: string
  ) => void;
}

export default function CollaborationDomainPartialAccessPicker({
  courseDetails,
  loading,
  selectedModules,
  selectedLessons,
  selectedContents,
  onToggleModule,
  onToggleLesson,
  onToggleContent,
}: CollaborationDomainPartialAccessPickerProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set()
  );
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    () => new Set()
  );

  const toggleModuleExpand = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }, []);

  const toggleLessonExpand = useCallback((lessonId: string) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Loading course structure…</p>
      </div>
    );
  }

  if (
    !courseDetails?.modules ||
    !Array.isArray(courseDetails.modules) ||
    courseDetails.modules.length === 0
  ) {
    return (
      <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">
        This course has no modules yet.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 max-h-80 overflow-y-auto">
      <div className="p-3 space-y-2">
        {(courseDetails.modules as CourseModule[]).map((module) => {
          const moduleId =
            typeof module === "string" ? module : module._id || "";
          const moduleTitle =
            typeof module === "string" ? "Module" : module.title;
          const moduleLessons =
            typeof module === "string"
              ? []
              : Array.isArray(module.lessons)
                ? module.lessons
                : [];

          const isModuleSelected = selectedModules.has(moduleId);
          const isModuleExpanded = expandedModules.has(moduleId);

          return (
            <div key={moduleId} className="border border-gray-200 rounded-md bg-white">
              <div className="flex items-center p-2.5 hover:bg-gray-50/80">
                <button
                  type="button"
                  onClick={() => toggleModuleExpand(moduleId)}
                  className="mr-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {isModuleExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="checkbox"
                  checked={isModuleSelected}
                  onChange={() => onToggleModule(moduleId)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {moduleTitle}
                </span>
              </div>

              {isModuleExpanded && moduleLessons.length > 0 && (
                <div className="pl-7 pr-2 pb-2 space-y-1">
                  {moduleLessons.map((lesson) => {
                    const lessonId =
                      typeof lesson === "string" ? lesson : lesson._id || "";
                    const lessonTitle =
                      typeof lesson === "string" ? "Lesson" : lesson.title;
                    const lessonContents: (Content | string)[] =
                      typeof lesson === "string"
                        ? []
                        : Array.isArray(lesson.contents)
                          ? lesson.contents
                          : [];

                    const isLessonSelected =
                      selectedLessons[moduleId]?.has(lessonId) || false;
                    const isLessonExpanded = expandedLessons.has(lessonId);

                    return (
                      <div
                        key={lessonId}
                        className="border border-gray-100 rounded p-1.5 bg-gray-50/50"
                      >
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => toggleLessonExpand(lessonId)}
                            className="mr-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {isLessonExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                          <input
                            type="checkbox"
                            checked={isLessonSelected}
                            onChange={() =>
                              onToggleLesson(moduleId, lessonId)
                            }
                            className="w-3.5 h-3.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="ml-2 text-xs font-medium text-gray-800">
                            {lessonTitle}
                          </span>
                        </div>

                        {isLessonExpanded && lessonContents.length > 0 && (
                          <div className="pl-6 pr-1 pt-1 space-y-0.5">
                            {lessonContents.map((content) => {
                              const contentId =
                                typeof content === "string"
                                  ? content
                                  : content._id || "";
                              const contentTitle =
                                typeof content === "string"
                                  ? "Content"
                                  : content.title;
                              const contentType =
                                typeof content === "string"
                                  ? "unknown"
                                  : content.type;

                              const lessonAllSelected = isLessonSelected;
                              const contentOnly =
                                !lessonAllSelected &&
                                (selectedContents[lessonId]?.has(contentId) ||
                                  false);

                              return (
                                <label
                                  key={contentId}
                                  className="flex items-center text-xs text-gray-600 cursor-pointer hover:bg-white/80 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      lessonAllSelected || contentOnly
                                    }
                                    onChange={() =>
                                      onToggleContent(
                                        moduleId,
                                        lessonId,
                                        contentId
                                      )
                                    }
                                    className="w-3 h-3 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                  />
                                  <span className="ml-2">
                                    {contentTitle}{" "}
                                    <span className="text-gray-400">
                                      ({contentType})
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
