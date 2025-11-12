import { useCallback, useEffect, useState } from "react";
import { Course, CourseLesson, CourseModule, Content } from "@/types";
import {
  canAccessModule,
  canAccessLesson,
  canAccessContent,
} from "@/lib/accessControlUtils";
import { PartialAccessControl } from "@/types/enrollment";

export const useLessonNavigation = (
  course: Course,
  accessControl?: PartialAccessControl | null
) => {
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with first accessible module, lesson, and content
  useEffect(() => {
    if (isInitialized) return;

    // Always initialize, even if there's no content
    if (course.modules && course.modules.length > 0) {
      const modules = course.modules as CourseModule[];
      
      // Find first accessible module
      let firstModule: CourseModule | null = null;
      let firstLesson: CourseLesson | null = null;
      let firstContent: Content | null = null;
      
      for (const module of modules) {
        const moduleId = module._id || "";
        if (canAccessModule(accessControl, moduleId)) {
          firstModule = module;
          
          // Find first accessible lesson in this module
          if (module.lessons && Array.isArray(module.lessons)) {
            const lessons = module.lessons as CourseLesson[];
            for (const lesson of lessons) {
              const lessonId = lesson._id || "";
              if (canAccessLesson(accessControl, moduleId, lessonId)) {
                firstLesson = lesson;
                
                // Find first accessible content in this lesson
                if (lesson.contents && Array.isArray(lesson.contents)) {
                  const contents = lesson.contents as Content[];
                  for (const content of contents) {
                    const contentId = content._id || "";
                    if (canAccessContent(accessControl, moduleId, lessonId, contentId)) {
                      firstContent = content;
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
      if (!firstModule) {
        firstModule = modules[0];
        if (firstModule?.lessons) {
          firstLesson = (firstModule.lessons as CourseLesson[])?.[0];
          if (firstLesson?.contents) {
            firstContent = (firstLesson.contents as Content[])?.[0];
          }
        }
      }

      if (firstModule) {
        setSelectedModule(firstModule);
        
        if (firstLesson) {
          setSelectedLesson(firstLesson);
          
          if (firstContent) {
            setSelectedContent(firstContent);
          }
        }
      }
    }
    
    setIsInitialized(true);
  }, [course.modules, isInitialized, accessControl]);

  // Preload next video content
  useEffect(() => {
    if (!selectedModule || !selectedLesson || !selectedContent) return;

    const modules = course.modules as CourseModule[];
    const moduleIndex = modules?.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = (selectedModule.lessons as CourseLesson[])?.findIndex((l) => l._id === selectedLesson._id) ?? -1;
    const contentIndex = (selectedLesson.contents as Content[])?.findIndex((c) => c._id === selectedContent._id) ?? -1;

    // Find next content
    let nextContent: Content | null = null;

    // Try next content in same lesson
    if (contentIndex < ((selectedLesson.contents as Content[])?.length ?? 0) - 1) {
      nextContent = (selectedLesson.contents as Content[])?.[contentIndex + 1] || null;
    }
    // Try first content of next lesson in same module
    else if (lessonIndex < ((selectedModule.lessons as CourseLesson[])?.length ?? 0) - 1) {
      const nextLesson = (selectedModule.lessons as CourseLesson[])?.[lessonIndex + 1];
      nextContent = (nextLesson?.contents as Content[])?.[0] || null;
    }
    // Try first content of first lesson in next module
    else if (moduleIndex !== undefined && moduleIndex < (modules?.length ?? 0) - 1) {
      const nextModule = modules?.[moduleIndex + 1];
      const firstLesson = (nextModule?.lessons as CourseLesson[])?.[0];
      nextContent = (firstLesson?.contents as Content[])?.[0] || null;
    }

    // Preload if next content is a video
    if (nextContent?.type === "video" && nextContent.sources) {
      const videoSources = nextContent.sources;
      const nextVideoUrl = videoSources?.[0]?.videoUrl;

      if (nextVideoUrl) {
        const preloadLink = document.createElement("link");
        preloadLink.href = nextVideoUrl;
        preloadLink.rel = "preload";
        preloadLink.as = "video";
        document.head.appendChild(preloadLink);

        return () => {
          if (document.head.contains(preloadLink)) {
            document.head.removeChild(preloadLink);
          }
        };
      }
    }
  }, [selectedModule, selectedLesson, selectedContent, course.modules]);

  // Navigate to a specific content (only if user has access)
  const navigateToContent = useCallback(
    (contentId: string) => {
      if (!course.modules) return;
      
      const modules = course.modules as CourseModule[];
      for (const courseModule of modules) {
        if (!courseModule.lessons) continue;
        
        const moduleId = courseModule._id || "";
        
        // Check module access
        if (!canAccessModule(accessControl, moduleId)) {
          continue; // Skip this module
        }
        
        const lessons = courseModule.lessons as CourseLesson[];
        for (const lesson of lessons) {
          if (!lesson.contents) continue;
          
          const lessonId = lesson._id || "";
          
          // Check lesson access
          if (!canAccessLesson(accessControl, moduleId, lessonId)) {
            continue; // Skip this lesson
          }
          
          const contents = lesson.contents as Content[];
          const content = contents.find((c) => c._id === contentId);
          if (content) {
            // Check content access
            if (canAccessContent(accessControl, moduleId, lessonId, contentId)) {
              setSelectedModule(courseModule);
              setSelectedLesson(lesson);
              setSelectedContent(content);
              return;
            }
            // Content found but no access - don't navigate
            return;
          }
        }
      }
    },
    [course.modules, accessControl]
  );

  // Navigate to next accessible content
  const navigateToNext = useCallback(() => {
    if (!selectedModule || !selectedLesson || !selectedContent) return;

    const modules = course.modules as CourseModule[];
    const moduleId = selectedModule._id || "";
    const moduleIndex = modules?.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = (selectedModule.lessons as CourseLesson[])?.findIndex((l) => l._id === selectedLesson._id) ?? -1;
    const contentIndex = (selectedLesson.contents as Content[])?.findIndex((c) => c._id === selectedContent._id) ?? -1;

    // Helper function to find next accessible content
    const findNextAccessibleContent = (
      startModuleIndex: number,
      startLessonIndex: number,
      startContentIndex: number
    ): { module: CourseModule; lesson: CourseLesson; content: Content } | null => {
      const modules = course.modules as CourseModule[];
      
      // Try next content in same lesson
      if (startContentIndex < ((selectedLesson.contents as Content[])?.length ?? 0) - 1) {
        for (let i = startContentIndex + 1; i < (selectedLesson.contents as Content[])?.length; i++) {
          const content = (selectedLesson.contents as Content[])?.[i];
          if (content && canAccessContent(accessControl, moduleId, selectedLesson._id || "", content._id || "")) {
            return { module: selectedModule, lesson: selectedLesson, content };
          }
        }
      }
      
      // Try first accessible content of next lesson in same module
      if (startLessonIndex < ((selectedModule.lessons as CourseLesson[])?.length ?? 0) - 1) {
        for (let i = startLessonIndex + 1; i < (selectedModule.lessons as CourseLesson[])?.length; i++) {
          const lesson = (selectedModule.lessons as CourseLesson[])?.[i];
          if (!lesson || !canAccessLesson(accessControl, moduleId, lesson._id || "")) continue;
          
          const contents = lesson.contents as Content[];
          for (const content of contents) {
            if (content && canAccessContent(accessControl, moduleId, lesson._id || "", content._id || "")) {
              return { module: selectedModule, lesson, content };
            }
          }
        }
      }
      
      // Try first accessible content of first accessible lesson in next module
      if (moduleIndex !== undefined && moduleIndex < (modules?.length ?? 0) - 1) {
        for (let i = moduleIndex + 1; i < modules.length; i++) {
          const module = modules[i];
          if (!module || !canAccessModule(accessControl, module._id || "")) continue;
          
          const lessons = module.lessons as CourseLesson[];
          for (const lesson of lessons) {
            if (!lesson || !canAccessLesson(accessControl, module._id || "", lesson._id || "")) continue;
            
            const contents = lesson.contents as Content[];
            for (const content of contents) {
              if (content && canAccessContent(accessControl, module._id || "", lesson._id || "", content._id || "")) {
                return { module, lesson, content };
              }
            }
          }
        }
      }
      
      return null;
    };

    const next = findNextAccessibleContent(moduleIndex ?? 0, lessonIndex, contentIndex);
    if (next) {
      setSelectedModule(next.module);
      setSelectedLesson(next.lesson);
      setSelectedContent(next.content);
    }
  }, [selectedModule, selectedLesson, selectedContent, course.modules, accessControl]);

  // Navigate to previous accessible content
  const navigateToPrevious = useCallback(() => {
    if (!selectedModule || !selectedLesson || !selectedContent) return;

    const modules = course.modules as CourseModule[];
    const moduleId = selectedModule._id || "";
    const moduleIndex = modules?.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = (selectedModule.lessons as CourseLesson[])?.findIndex((l) => l._id === selectedLesson._id) ?? -1;
    const contentIndex = (selectedLesson.contents as Content[])?.findIndex((c) => c._id === selectedContent._id) ?? -1;

    // Helper function to find previous accessible content
    const findPreviousAccessibleContent = (
      startModuleIndex: number,
      startLessonIndex: number,
      startContentIndex: number
    ): { module: CourseModule; lesson: CourseLesson; content: Content } | null => {
      const modules = course.modules as CourseModule[];
      
      // Try previous content in same lesson
      if (startContentIndex > 0) {
        for (let i = startContentIndex - 1; i >= 0; i--) {
          const content = (selectedLesson.contents as Content[])?.[i];
          if (content && canAccessContent(accessControl, moduleId, selectedLesson._id || "", content._id || "")) {
            return { module: selectedModule, lesson: selectedLesson, content };
          }
        }
      }
      
      // Try last accessible content of previous lesson in same module
      if (startLessonIndex > 0) {
        for (let i = startLessonIndex - 1; i >= 0; i--) {
          const lesson = (selectedModule.lessons as CourseLesson[])?.[i];
          if (!lesson || !canAccessLesson(accessControl, moduleId, lesson._id || "")) continue;
          
          const contents = lesson.contents as Content[];
          for (let j = contents.length - 1; j >= 0; j--) {
            const content = contents[j];
            if (content && canAccessContent(accessControl, moduleId, lesson._id || "", content._id || "")) {
              return { module: selectedModule, lesson, content };
            }
          }
        }
      }
      
      // Try last accessible content of last accessible lesson in previous module
      if (moduleIndex !== undefined && moduleIndex > 0) {
        for (let i = moduleIndex - 1; i >= 0; i--) {
          const module = modules[i];
          if (!module || !canAccessModule(accessControl, module._id || "")) continue;
          
          const lessons = module.lessons as CourseLesson[];
          for (let j = lessons.length - 1; j >= 0; j--) {
            const lesson = lessons[j];
            if (!lesson || !canAccessLesson(accessControl, module._id || "", lesson._id || "")) continue;
            
            const contents = lesson.contents as Content[];
            for (let k = contents.length - 1; k >= 0; k--) {
              const content = contents[k];
              if (content && canAccessContent(accessControl, module._id || "", lesson._id || "", content._id || "")) {
                return { module, lesson, content };
              }
            }
          }
        }
      }
      
      return null;
    };

    const prev = findPreviousAccessibleContent(moduleIndex ?? 0, lessonIndex, contentIndex);
    if (prev) {
      setSelectedModule(prev.module);
      setSelectedLesson(prev.lesson);
      setSelectedContent(prev.content);
    }
  }, [selectedModule, selectedLesson, selectedContent, course.modules, accessControl]);

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