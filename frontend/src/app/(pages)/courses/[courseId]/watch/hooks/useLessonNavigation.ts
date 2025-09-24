import { useCallback, useEffect, useState } from "react";
import { Course, CourseLesson, CourseModule, Content } from "@/types";

export const useLessonNavigation = (course: Course) => {
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with first module, lesson, and content
  useEffect(() => {
    if (isInitialized || !course.modules?.[0]?.lessons?.[0]?.contents?.[0]) return;

    const firstModule = course.modules[0];
    const firstLesson = firstModule.lessons?.[0];
    const firstContent = firstLesson?.contents?.[0];

    if (firstModule && firstLesson && firstContent) {
      setSelectedModule(firstModule);
      setSelectedLesson(firstLesson);
      setSelectedContent(firstContent);
    }
    setIsInitialized(true);
  }, [course.modules, isInitialized]);

  // Preload next video content
  useEffect(() => {
    if (!selectedModule || !selectedLesson || !selectedContent) return;

    const moduleIndex = course.modules?.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = selectedModule.lessons?.findIndex((l) => l._id === selectedLesson._id) ?? -1;
    const contentIndex = selectedLesson.contents?.findIndex((c) => c._id === selectedContent._id) ?? -1;

    // Find next content
    let nextContent: Content | null = null;

    // Try next content in same lesson
    if (contentIndex < (selectedLesson.contents?.length ?? 0) - 1) {
      nextContent = selectedLesson.contents?.[contentIndex + 1] || null;
    }
    // Try first content of next lesson in same module
    else if (lessonIndex < (selectedModule.lessons?.length ?? 0) - 1) {
      nextContent = selectedModule.lessons?.[lessonIndex + 1]?.contents?.[0] || null;
    }
    // Try first content of first lesson in next module
    else if (moduleIndex !== undefined && moduleIndex < (course.modules?.length ?? 0) - 1) {
      nextContent = course.modules?.[moduleIndex + 1]?.lessons?.[0]?.contents?.[0] || null;
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
      
      for (const courseModule of course.modules) {
        if (!courseModule.lessons) continue;
        
        for (const lesson of courseModule.lessons) {
          if (!lesson.contents) continue;
          
          const content = lesson.contents.find((c) => c._id === contentId);
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

    const moduleIndex = course.modules?.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = selectedModule.lessons?.findIndex((l) => l._id === selectedLesson._id) ?? -1;
    const contentIndex = selectedLesson.contents?.findIndex((c) => c._id === selectedContent._id) ?? -1;

    // Try next content in same lesson
    if (contentIndex < (selectedLesson.contents?.length ?? 0) - 1) {
      const nextContent = selectedLesson.contents?.[contentIndex + 1];
      if (nextContent) {
        setSelectedContent(nextContent);
      }
    }
    // Try first content of next lesson in same module
    else if (lessonIndex < (selectedModule.lessons?.length ?? 0) - 1) {
      const nextLesson = selectedModule.lessons?.[lessonIndex + 1];
      if (nextLesson?.contents?.[0]) {
        setSelectedLesson(nextLesson);
        setSelectedContent(nextLesson.contents[0]);
      }
    }
    // Try first content of first lesson in next module
    else if (moduleIndex !== undefined && moduleIndex < (course.modules?.length ?? 0) - 1) {
      const nextModule = course.modules?.[moduleIndex + 1];
      const firstLesson = nextModule?.lessons?.[0];
      if (firstLesson?.contents?.[0] && nextModule) {
        setSelectedModule(nextModule);
        setSelectedLesson(firstLesson);
        setSelectedContent(firstLesson.contents[0]);
      }
    }
  }, [selectedModule, selectedLesson, selectedContent, course.modules]);

  // Navigate to previous content
  const navigateToPrevious = useCallback(() => {
    if (!selectedModule || !selectedLesson || !selectedContent) return;

    const moduleIndex = course.modules?.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = selectedModule.lessons?.findIndex((l) => l._id === selectedLesson._id) ?? -1;
    const contentIndex = selectedLesson.contents?.findIndex((c) => c._id === selectedContent._id) ?? -1;

    // Try previous content in same lesson
    if (contentIndex > 0) {
      const prevContent = selectedLesson.contents?.[contentIndex - 1];
      if (prevContent) {
        setSelectedContent(prevContent);
      }
    }
    // Try last content of previous lesson in same module
    else if (lessonIndex > 0) {
      const prevLesson = selectedModule.lessons?.[lessonIndex - 1];
      const lastContent = prevLesson?.contents?.[(prevLesson.contents?.length ?? 0) - 1];
      if (lastContent) {
        setSelectedLesson(prevLesson);
        setSelectedContent(lastContent);
      }
    }
    // Try last content of last lesson in previous module
    else if (moduleIndex !== undefined && moduleIndex > 0) {
      const prevModule = course.modules?.[moduleIndex - 1];
      const lastLesson = prevModule?.lessons?.[(prevModule.lessons?.length ?? 0) - 1];
      const lastContent = lastLesson?.contents?.[(lastLesson.contents?.length ?? 0) - 1];
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