import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { Course, CourseLesson, CourseModule, Content } from "@/types";
import {
  canAccessModule,
  canAccessLesson,
  canAccessContent,
} from "@/lib/accessControlUtils";
import { PartialAccessControl, LastContentAccessed } from "@/types/enrollment";

export const useLessonNavigation = (
  course: Course,
  accessControl?: PartialAccessControl | null,
  lastContentAccessed?: LastContentAccessed | null
) => {
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use ref for accessControl to prevent unnecessary recalculations
  const accessControlRef = useRef(accessControl);
  useEffect(() => {
    accessControlRef.current = accessControl;
  }, [accessControl]);

  // Memoize course structure to prevent unnecessary re-initialization
  const courseStructure = useMemo(() => {
    return {
      courseId: course._id,
      modulesCount: course.modules?.length || 0,
    };
  }, [course._id, course.modules?.length]);

  // Initialize with last accessed content or first accessible module, lesson, and content
  useEffect(() => {
    if (isInitialized) return;
    if (!course.modules || course.modules.length === 0) {
      setIsInitialized(true);
      return;
    }

    const modules = course.modules as CourseModule[];

    let targetModule: CourseModule | null = null;
    let targetLesson: CourseLesson | null = null;
    let targetContent: Content | null = null;

    // Try to navigate to last accessed content first
    if (lastContentAccessed?.contentId) {
      const lastModuleId = lastContentAccessed.moduleId;
      const lastLessonId = lastContentAccessed.lessonId;
      const lastContentId = lastContentAccessed.contentId;

      // Find the last accessed content in the course structure
      for (const module of modules) {
        const moduleId = module._id || "";
        if (moduleId === lastModuleId && canAccessModule(accessControlRef.current, moduleId)) {
          if (module.lessons && Array.isArray(module.lessons)) {
            const lessons = module.lessons as CourseLesson[];
            for (const lesson of lessons) {
              const lessonId = lesson._id || "";
              if (lessonId === lastLessonId && canAccessLesson(accessControlRef.current, moduleId, lessonId)) {
                if (lesson.contents && Array.isArray(lesson.contents)) {
                  const contents = lesson.contents as Content[];
                  const content = contents.find((c) => c._id === lastContentId);
                  if (content && canAccessContent(accessControlRef.current, moduleId, lessonId, lastContentId)) {
                    targetModule = module;
                    targetLesson = lesson;
                    targetContent = content;
                    break;
                  }
                }
              }
              if (targetContent) break;
            }
          }
        }
        if (targetContent) break;
      }
    }

    // Fallback to first accessible module, lesson, and content
    if (!targetContent) {
      for (const module of modules) {
        const moduleId = module._id || "";
        if (canAccessModule(accessControlRef.current, moduleId)) {
          targetModule = module;

          // Find first accessible lesson in this module
          if (module.lessons && Array.isArray(module.lessons)) {
            const lessons = module.lessons as CourseLesson[];
            for (const lesson of lessons) {
              const lessonId = lesson._id || "";
              if (canAccessLesson(accessControlRef.current, moduleId, lessonId)) {
                targetLesson = lesson;

                // Find first accessible content in this lesson
                if (lesson.contents && Array.isArray(lesson.contents)) {
                  const contents = lesson.contents as Content[];
                  for (const content of contents) {
                    const contentId = content._id || "";
                    if (canAccessContent(accessControlRef.current, moduleId, lessonId, contentId)) {
                      targetContent = content;
                      break;
                    }
                  }
                }
                break;
              }
            }
          }
          break;
        }
      }

      // Fallback to first module/lesson/content if no accessible content found
      if (!targetModule) {
        targetModule = modules[0];
        if (targetModule?.lessons) {
          targetLesson = (targetModule.lessons as CourseLesson[])?.[0];
          if (targetLesson?.contents) {
            targetContent = (targetLesson.contents as Content[])?.[0];
          }
        }
      }
    }

    if (targetModule) {
      setSelectedModule(targetModule);

      if (targetLesson) {
        setSelectedLesson(targetLesson);

        if (targetContent) {
          setSelectedContent(targetContent);
        }
      }
    }

    setIsInitialized(true);
  }, [isInitialized, courseStructure, lastContentAccessed]);

  // Navigate to a specific content (only if user has access)
  const navigateToContent = useCallback(
    (contentId: string) => {
      if (!course.modules) return;

      const modules = course.modules as CourseModule[];
      for (const courseModule of modules) {
        if (!courseModule.lessons) continue;

        const moduleId = courseModule._id || "";

        // Check module access
        if (!canAccessModule(accessControlRef.current, moduleId)) {
          continue;
        }

        const lessons = courseModule.lessons as CourseLesson[];
        for (const lesson of lessons) {
          if (!lesson.contents) continue;

          const lessonId = lesson._id || "";

          // Check lesson access
          if (!canAccessLesson(accessControlRef.current, moduleId, lessonId)) {
            continue;
          }

          const contents = lesson.contents as Content[];
          const content = contents.find((c) => c._id === contentId);
          if (content) {
            // Check content access
            if (canAccessContent(accessControlRef.current, moduleId, lessonId, contentId)) {
              setSelectedModule(courseModule);
              setSelectedLesson(lesson);
              setSelectedContent(content);
              return;
            }
            // Content found but no access
            return;
          }
        }
      }
    },
    [course.modules]
  );

  // Navigate to next accessible content
  const navigateToNext = useCallback(() => {
    if (!selectedModule || !selectedLesson || !selectedContent) return;

    const modules = course.modules as CourseModule[];
    const moduleId = selectedModule._id || "";
    const moduleIndex = modules?.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex =
      (selectedModule.lessons as CourseLesson[])?.findIndex(
        (l) => l._id === selectedLesson._id
      ) ?? -1;
    const contentIndex =
      (selectedLesson.contents as Content[])?.findIndex(
        (c) => c._id === selectedContent._id
      ) ?? -1;

    // Helper function to find next accessible content
    const findNextAccessibleContent = (): {
      module: CourseModule;
      lesson: CourseLesson;
      content: Content;
    } | null => {
      // Try next content in same lesson
      if (
        contentIndex <
        ((selectedLesson.contents as Content[])?.length ?? 0) - 1
      ) {
        for (
          let i = contentIndex + 1;
          i < (selectedLesson.contents as Content[])?.length;
          i++
        ) {
          const content = (selectedLesson.contents as Content[])?.[i];
          if (
            content &&
            canAccessContent(
              accessControlRef.current,
              moduleId,
              selectedLesson._id || "",
              content._id || ""
            )
          ) {
            return { module: selectedModule, lesson: selectedLesson, content };
          }
        }
      }

      // Try first accessible content of next lesson in same module
      if (
        lessonIndex <
        ((selectedModule.lessons as CourseLesson[])?.length ?? 0) - 1
      ) {
        for (
          let i = lessonIndex + 1;
          i < (selectedModule.lessons as CourseLesson[])?.length;
          i++
        ) {
          const lesson = (selectedModule.lessons as CourseLesson[])?.[i];
          if (
            !lesson ||
            !canAccessLesson(accessControlRef.current, moduleId, lesson._id || "")
          )
            continue;

          const contents = lesson.contents as Content[];
          for (const content of contents) {
            if (
              content &&
              canAccessContent(
                accessControlRef.current,
                moduleId,
                lesson._id || "",
                content._id || ""
              )
            ) {
              return { module: selectedModule, lesson, content };
            }
          }
        }
      }

      // Try first accessible content of first accessible lesson in next module
      if (
        moduleIndex !== undefined &&
        moduleIndex < (modules?.length ?? 0) - 1
      ) {
        for (let i = moduleIndex + 1; i < modules.length; i++) {
          const module = modules[i];
          if (
            !module ||
            !canAccessModule(accessControlRef.current, module._id || "")
          )
            continue;

          const lessons = module.lessons as CourseLesson[];
          for (const lesson of lessons) {
            if (
              !lesson ||
              !canAccessLesson(
                accessControlRef.current,
                module._id || "",
                lesson._id || ""
              )
            )
              continue;

            const contents = lesson.contents as Content[];
            for (const content of contents) {
              if (
                content &&
                canAccessContent(
                  accessControlRef.current,
                  module._id || "",
                  lesson._id || "",
                  content._id || ""
                )
              ) {
                return { module, lesson, content };
              }
            }
          }
        }
      }

      return null;
    };

    const next = findNextAccessibleContent();
    if (next) {
      setSelectedModule(next.module);
      setSelectedLesson(next.lesson);
      setSelectedContent(next.content);
    }
  }, [selectedModule, selectedLesson, selectedContent, course.modules]);

  // Navigate to previous accessible content
  const navigateToPrevious = useCallback(() => {
    if (!selectedModule || !selectedLesson || !selectedContent) return;

    const modules = course.modules as CourseModule[];
    const moduleId = selectedModule._id || "";
    const moduleIndex = modules?.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex =
      (selectedModule.lessons as CourseLesson[])?.findIndex(
        (l) => l._id === selectedLesson._id
      ) ?? -1;
    const contentIndex =
      (selectedLesson.contents as Content[])?.findIndex(
        (c) => c._id === selectedContent._id
      ) ?? -1;

    // Helper function to find previous accessible content
    const findPreviousAccessibleContent = (): {
      module: CourseModule;
      lesson: CourseLesson;
      content: Content;
    } | null => {
      // Try previous content in same lesson
      if (contentIndex > 0) {
        for (let i = contentIndex - 1; i >= 0; i--) {
          const content = (selectedLesson.contents as Content[])?.[i];
          if (
            content &&
            canAccessContent(
              accessControlRef.current,
              moduleId,
              selectedLesson._id || "",
              content._id || ""
            )
          ) {
            return { module: selectedModule, lesson: selectedLesson, content };
          }
        }
      }

      // Try last accessible content of previous lesson in same module
      if (lessonIndex > 0) {
        for (let i = lessonIndex - 1; i >= 0; i--) {
          const lesson = (selectedModule.lessons as CourseLesson[])?.[i];
          if (
            !lesson ||
            !canAccessLesson(accessControlRef.current, moduleId, lesson._id || "")
          )
            continue;

          const contents = lesson.contents as Content[];
          for (let j = contents.length - 1; j >= 0; j--) {
            const content = contents[j];
            if (
              content &&
              canAccessContent(
                accessControlRef.current,
                moduleId,
                lesson._id || "",
                content._id || ""
              )
            ) {
              return { module: selectedModule, lesson, content };
            }
          }
        }
      }

      // Try last accessible content of last accessible lesson in previous module
      if (moduleIndex !== undefined && moduleIndex > 0) {
        for (let i = moduleIndex - 1; i >= 0; i--) {
          const module = modules[i];
          if (
            !module ||
            !canAccessModule(accessControlRef.current, module._id || "")
          )
            continue;

          const lessons = module.lessons as CourseLesson[];
          for (let j = lessons.length - 1; j >= 0; j--) {
            const lesson = lessons[j];
            if (
              !lesson ||
              !canAccessLesson(
                accessControlRef.current,
                module._id || "",
                lesson._id || ""
              )
            )
              continue;

            const contents = lesson.contents as Content[];
            for (let k = contents.length - 1; k >= 0; k--) {
              const content = contents[k];
              if (
                content &&
                canAccessContent(
                  accessControlRef.current,
                  module._id || "",
                  lesson._id || "",
                  content._id || ""
                )
              ) {
                return { module, lesson, content };
              }
            }
          }
        }
      }

      return null;
    };

    const prev = findPreviousAccessibleContent();
    if (prev) {
      setSelectedModule(prev.module);
      setSelectedLesson(prev.lesson);
      setSelectedContent(prev.content);
    }
  }, [selectedModule, selectedLesson, selectedContent, course.modules]);

  // Toggle module expansion
  const toggleModule = useCallback((module: CourseModule) => {
    setSelectedModule((prev) => (prev?._id === module._id ? null : module));
  }, []);

  // Toggle lesson expansion
  const toggleLesson = useCallback((lesson: CourseLesson) => {
    setSelectedLesson((prev) => (prev?._id === lesson._id ? null : lesson));
  }, []);

  return {
    selectedModule,
    selectedLesson,
    selectedContent,
    navigateToContent,
    navigateToNext,
    navigateToPrevious,
    toggleModule,
    toggleLesson,
    isInitialized,
  };
};
