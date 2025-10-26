import { useCallback, useEffect, useState } from "react";
import { Course, CourseLesson, CourseModule, Content } from "@/types";

export const useLessonNavigation = (course: Course) => {
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with first module, lesson, and content
  useEffect(() => {
    if (isInitialized) return;

    // Always initialize, even if there's no content
    if (course.modules && course.modules.length > 0) {
      const modules = course.modules as CourseModule[];
      const firstModule = modules[0];
      const firstLesson = (firstModule?.lessons as CourseLesson[])?.[0];
      const firstContent = (firstLesson?.contents as Content[])?.[0];

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
  }, [course.modules, isInitialized]);

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

  // Navigate to a specific content
  const navigateToContent = useCallback(
    (contentId: string) => {
      if (!course.modules) return;
      
      const modules = course.modules as CourseModule[];
      for (const courseModule of modules) {
        if (!courseModule.lessons) continue;
        
        const lessons = courseModule.lessons as CourseLesson[];
        for (const lesson of lessons) {
          if (!lesson.contents) continue;
          
          const contents = lesson.contents as Content[];
          const content = contents.find((c) => c._id === contentId);
          if (content) {
            setSelectedModule(courseModule);
            setSelectedLesson(lesson);
            setSelectedContent(content);
            return;
          }
        }
      }
    },
    [course.modules]
  );

  // Navigate to next content
  const navigateToNext = useCallback(() => {
    if (!selectedModule || !selectedLesson || !selectedContent) return;

    const modules = course.modules as CourseModule[];
    const moduleIndex = modules?.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = (selectedModule.lessons as CourseLesson[])?.findIndex((l) => l._id === selectedLesson._id) ?? -1;
    const contentIndex = (selectedLesson.contents as Content[])?.findIndex((c) => c._id === selectedContent._id) ?? -1;

    // Try next content in same lesson
    if (contentIndex < ((selectedLesson.contents as Content[])?.length ?? 0) - 1) {
      const nextContent = (selectedLesson.contents as Content[])?.[contentIndex + 1];
      if (nextContent) {
        setSelectedContent(nextContent);
      }
    }
    // Try first content of next lesson in same module
    else if (lessonIndex < ((selectedModule.lessons as CourseLesson[])?.length ?? 0) - 1) {
      const nextLesson = (selectedModule.lessons as CourseLesson[])?.[lessonIndex + 1];
      const firstContent = (nextLesson?.contents as Content[])?.[0];
      if (firstContent) {
        setSelectedLesson(nextLesson);
        setSelectedContent(firstContent);
      }
    }
    // Try first content of first lesson in next module
    else if (moduleIndex !== undefined && moduleIndex < (modules?.length ?? 0) - 1) {
      const nextModule = modules?.[moduleIndex + 1];
      const firstLesson = (nextModule?.lessons as CourseLesson[])?.[0];
      const firstContent = (firstLesson?.contents as Content[])?.[0];
      if (firstContent && nextModule && firstLesson) {
        setSelectedModule(nextModule);
        setSelectedLesson(firstLesson);
        setSelectedContent(firstContent);
      }
    }
  }, [selectedModule, selectedLesson, selectedContent, course.modules]);

  // Navigate to previous content
  const navigateToPrevious = useCallback(() => {
    if (!selectedModule || !selectedLesson || !selectedContent) return;

    const modules = course.modules as CourseModule[];
    const moduleIndex = modules?.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = (selectedModule.lessons as CourseLesson[])?.findIndex((l) => l._id === selectedLesson._id) ?? -1;
    const contentIndex = (selectedLesson.contents as Content[])?.findIndex((c) => c._id === selectedContent._id) ?? -1;

    // Try previous content in same lesson
    if (contentIndex > 0) {
      const prevContent = (selectedLesson.contents as Content[])?.[contentIndex - 1];
      if (prevContent) {
        setSelectedContent(prevContent);
      }
    }
    // Try last content of previous lesson in same module
    else if (lessonIndex > 0) {
      const prevLesson = (selectedModule.lessons as CourseLesson[])?.[lessonIndex - 1];
      const lastContent = (prevLesson?.contents as Content[])?.[((prevLesson?.contents as Content[])?.length ?? 0) - 1];
      if (lastContent) {
        setSelectedLesson(prevLesson);
        setSelectedContent(lastContent);
      }
    }
    // Try last content of last lesson in previous module
    else if (moduleIndex !== undefined && moduleIndex > 0) {
      const prevModule = modules?.[moduleIndex - 1];
      const lastLesson = (prevModule?.lessons as CourseLesson[])?.[((prevModule?.lessons as CourseLesson[])?.length ?? 0) - 1];
      const lastContent = (lastLesson?.contents as Content[])?.[((lastLesson?.contents as Content[])?.length ?? 0) - 1];
      if (lastContent && prevModule && lastLesson) {
        setSelectedModule(prevModule);
        setSelectedLesson(lastLesson);
        setSelectedContent(lastContent);
      }
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