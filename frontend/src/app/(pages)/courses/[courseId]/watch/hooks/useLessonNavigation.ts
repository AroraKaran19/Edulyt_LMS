import { useCallback, useEffect, useState } from "react";
import { Course, CourseLesson, CourseModule } from "@/types";

export const useLessonNavigation = (course: Course) => {
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with first module and lesson
  useEffect(() => {
    if (isInitialized || !course.modules[0]?.lessons[0]) return;

    setSelectedModule(course.modules[0]);
    setSelectedLesson(course.modules[0].lessons[0]);
    setIsInitialized(true);
  }, [course.modules, isInitialized]);

  // Preload next lesson video
  useEffect(() => {
    if (!selectedModule || !selectedLesson) return;

    const moduleIndex = course.modules.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = selectedModule.lessons.findIndex((l) => l._id === selectedLesson._id);

    const nextLesson =
      lessonIndex < selectedModule.lessons.length - 1
        ? selectedModule.lessons[lessonIndex + 1]
        : moduleIndex < course.modules.length - 1
        ? course.modules[moduleIndex + 1].lessons[0] || null
        : null;

    // Extract first video URL from next lesson for preloading
    const videoContent = nextLesson?.content
      .find(content => content.type === 'video' && Array.isArray(content.content));
    
    const firstVideo = videoContent?.content
      .find(video => 'sources' in video) as { sources: { videoUrl: string }[] } | undefined;
    
    const nextVideoUrl = firstVideo?.sources?.[0]?.videoUrl;

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
  }, [selectedModule, selectedLesson, course.modules]);

  // Navigate to a specific lesson
  const navigateToLesson = useCallback(
    (lessonId: string) => {
      const courseModule = course.modules.find((m) => m.lessons.some((l) => l._id === lessonId));
      const lesson = courseModule?.lessons.find((l) => l._id === lessonId);

      if (courseModule && lesson) {
        setSelectedModule(courseModule);
        setSelectedLesson(lesson);
      }
    },
    [course.modules]
  );

  // Navigate to next lesson
  const navigateToNext = useCallback(() => {
    if (!selectedModule || !selectedLesson) return;

    const moduleIndex = course.modules.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = selectedModule.lessons.findIndex((l) => l._id === selectedLesson._id);

    if (lessonIndex < selectedModule.lessons.length - 1) {
      navigateToLesson(selectedModule.lessons[lessonIndex + 1]._id);
    } else if (moduleIndex < course.modules.length - 1) {
      const nextModule = course.modules[moduleIndex + 1];
      if (nextModule.lessons[0]) navigateToLesson(nextModule.lessons[0]._id);
    }
  }, [selectedModule, selectedLesson, course.modules, navigateToLesson]);

  // Navigate to previous lesson
  const navigateToPrevious = useCallback(() => {
    if (!selectedModule || !selectedLesson) return;

    const moduleIndex = course.modules.findIndex((m) => m._id === selectedModule._id);
    const lessonIndex = selectedModule.lessons.findIndex((l) => l._id === selectedLesson._id);

    if (lessonIndex > 0) {
      navigateToLesson(selectedModule.lessons[lessonIndex - 1]._id);
    } else if (moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1];
      const lastLesson = prevModule.lessons[prevModule.lessons.length - 1];
      if (lastLesson) navigateToLesson(lastLesson._id);
    }
  }, [selectedModule, selectedLesson, course.modules, navigateToLesson]);

  // Toggle module expansion
  const toggleModule = useCallback((courseModule: CourseModule) => {
    setSelectedModule((prev) => (prev?._id === courseModule._id ? prev : courseModule));
  }, []);

  return {
    selectedModule,
    selectedLesson,
    navigateToLesson,
    navigateToNext,
    navigateToPrevious,
    toggleModule,
    isInitialized,
  };
};