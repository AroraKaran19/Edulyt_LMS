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

    const moduleIndex = course.modules.findIndex((m) => m.id === selectedModule.id);
    const lessonIndex = selectedModule.lessons.findIndex((l) => l.id === selectedLesson.id);

    const nextLesson =
      lessonIndex < selectedModule.lessons.length - 1
        ? selectedModule.lessons[lessonIndex + 1]
        : moduleIndex < course.modules.length - 1
        ? course.modules[moduleIndex + 1].lessons[0] || null
        : null;

    if (nextLesson?.videoUrl) {
      const preloadLink = document.createElement("link");
      preloadLink.href = nextLesson.videoUrl;
      preloadLink.rel = "preload";
      preloadLink.as = "video";
      document.head.appendChild(preloadLink);

      return () => {
        document.head.removeChild(preloadLink); // Execute without returning
      };
    }
  }, [selectedModule, selectedLesson, course.modules]);

  // Navigate to a specific lesson
  const navigateToLesson = useCallback(
    (lessonId: string) => {
      const courseModule = course.modules.find((m) => m.lessons.some((l) => l.id === lessonId));
      const lesson = courseModule?.lessons.find((l) => l.id === lessonId);

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

    const moduleIndex = course.modules.findIndex((m) => m.id === selectedModule.id);
    const lessonIndex = selectedModule.lessons.findIndex((l) => l.id === selectedLesson.id);

    if (lessonIndex < selectedModule.lessons.length - 1) {
      navigateToLesson(selectedModule.lessons[lessonIndex + 1].id);
    } else if (moduleIndex < course.modules.length - 1) {
      const nextModule = course.modules[moduleIndex + 1];
      if (nextModule.lessons[0]) navigateToLesson(nextModule.lessons[0].id);
    }
  }, [selectedModule, selectedLesson, course.modules, navigateToLesson]);

  // Navigate to previous lesson
  const navigateToPrevious = useCallback(() => {
    if (!selectedModule || !selectedLesson) return;

    const moduleIndex = course.modules.findIndex((m) => m.id === selectedModule.id);
    const lessonIndex = selectedModule.lessons.findIndex((l) => l.id === selectedLesson.id);

    if (lessonIndex > 0) {
      navigateToLesson(selectedModule.lessons[lessonIndex - 1].id);
    } else if (moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1];
      const lastLesson = prevModule.lessons[prevModule.lessons.length - 1];
      if (lastLesson) navigateToLesson(lastLesson.id);
    }
  }, [selectedModule, selectedLesson, course.modules, navigateToLesson]);

  // Toggle module expansion
  const toggleModule = useCallback((courseModule: CourseModule) => {
    setSelectedModule((prev) => (prev?.id === courseModule.id ? prev : courseModule as CourseModule));
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