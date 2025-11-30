"use client";
import { Course, CourseLesson, CourseModule, Content } from "@/types";
import React, {
  memo,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import SectionContainer from "./components/SectionContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Clock3, Play, FileText, Lock, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useLessonNavigation } from "./hooks/useLessonNavigation";
import {
  VideoTimeProvider,
  useVideoTimeContext,
} from "./context/VideoTimeContext";
import TabSwitcher from "@/components/ui/course/TabSwitcher";
import OverviewSection from "./components/OverviewSection";
import { VideoContent } from "@/types";
import Reviews from "./components/Reviews";
import QASections from "./components/QASections";
import Notes from "./components/Notes";
import { formatDuration, cn } from "@/lib/utils";
import { usePresignedVideoSources } from "@/hooks/usePresignedUrl";
import useQnA from "@/hooks/useQnA";
import { QnA } from "@/types/qna";
import { useEnrollmentContext } from "@/components/EnrollmentGuard";
import {
  canAccessModule,
  canAccessLesson,
  canAccessContent,
} from "@/lib/accessControlUtils";
import { useCompletedContents } from "./hooks/useCompletedContents";

const VideoPlayer = dynamic(() => import("./components/VideoPlayer"), {
  ssr: false,
});

const VideoSection = memo(
  ({
    course,
    selectedContent,
    selectedModule,
    selectedLesson,
  }: {
    course: Course;
    selectedContent: Content | null;
    selectedModule: CourseModule | null;
    selectedLesson: CourseLesson | null;
  }) => {
    const { connectToVideo } = useVideoTimeContext();
    const { accessControl } = useEnrollmentContext() || { accessControl: null };

    // Check if user has access to the selected content
    const hasContentAccess = useMemo(() => {
      if (!selectedContent?._id) return false;

      // Find the module and lesson for this content
      if (!course.modules) return false;

      const modules = course.modules as CourseModule[];
      for (const module of modules) {
        if (!module.lessons) continue;

        const lessons = module.lessons as CourseLesson[];
        for (const lesson of lessons) {
          if (!lesson.contents) continue;

          const contents = lesson.contents as Content[];
          if (contents.some((c) => c._id === selectedContent._id)) {
            const moduleId = module._id || "";
            const lessonId = lesson._id || "";
            const contentId = selectedContent._id;

            return canAccessContent(
              accessControl,
              moduleId,
              lessonId,
              contentId
            );
          }
        }
      }

      return false;
    }, [selectedContent, course.modules, accessControl]);

    const rawVideoSources = useMemo(() => {
      if (!selectedContent || selectedContent.type !== "video") return [];

      // Extract video sources from content
      const allVideoSources: Array<{ quality: string; src: string }> = [];

      if (selectedContent.sources && Array.isArray(selectedContent.sources)) {
        selectedContent.sources.forEach(
          (source: VideoContent["sources"][number]) => {
            if (source?.quality && source?.videoUrl) {
              allVideoSources.push({
                quality: source.quality,
                src: source.videoUrl,
              });
            }
          }
        );
      }

      return allVideoSources;
    }, [selectedContent]);

    // Convert S3 keys to presigned URLs for secure access
    const {
      sources: videoSources,
      isLoading: isUrlLoading,
      error: urlError,
    } = usePresignedVideoSources(rawVideoSources, {
      expiresIn: 3600,
      autoRefresh: true,
      refreshThreshold: 300,
    });

    // Track previous content to disconnect old video
    const prevContentRef = useRef<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Detect content changes and show transition
    useEffect(() => {
      if (
        selectedContent?._id &&
        prevContentRef.current &&
        prevContentRef.current !== selectedContent._id
      ) {
        setIsTransitioning(true);
        // Hide transition after a short delay
        const timer = setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
        return () => clearTimeout(timer);
      }
      if (selectedContent?._id) {
        prevContentRef.current = selectedContent._id;
      }
    }, [selectedContent?._id]);

    const handleVideoReady = (video: HTMLVideoElement) => {
      if (!selectedContent?._id) return;

      connectToVideo(video);
      // Don't autoplay on content change - let user control playback
      // video.play().catch((error) => {
      //   console.log("Autoplay failed:", error);
      // });
    };

    // Show placeholder if no video content is selected
    if (!selectedContent || selectedContent.type !== "video") {
      return (
        <SectionContainer
          id="video-player"
          className="w-full aspect-video bg-gray-100 flex items-center justify-center"
        >
          <div className="text-center">
            <Play className="size-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a video to start watching</p>
          </div>
        </SectionContainer>
      );
    }

    // Show locked content message if user doesn't have access
    if (!hasContentAccess) {
      return (
        <SectionContainer
          id="video-player"
          className="w-full aspect-video bg-gray-100 flex items-center justify-center"
        >
          <div className="text-center max-w-md mx-auto p-8">
            <Lock className="size-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Content Locked
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have access to this content. Please contact your
              administrator to request access.
            </p>
            <p className="text-sm text-gray-500">
              Content: {selectedContent.title}
            </p>
          </div>
        </SectionContainer>
      );
    }

    // Show loading state while generating presigned URLs
    if (isUrlLoading) {
      return (
        <SectionContainer
          id="video-player"
          className="w-full aspect-video bg-gray-100 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#F77124] mx-auto mb-4"></div>
            <p className="text-gray-600">Preparing secure video access...</p>
          </div>
        </SectionContainer>
      );
    }

    // Show error state if presigned URL generation failed
    if (urlError) {
      return (
        <SectionContainer
          id="video-player"
          className="w-full aspect-video bg-gray-100 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">Failed to load video securely</p>
            <p className="text-sm text-gray-500">{urlError}</p>
          </div>
        </SectionContainer>
      );
    }

    return (
      <SectionContainer
        id="video-player"
        className="w-full aspect-video relative"
      >
        {/* Smooth transition overlay during content change */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-gray-900/50 z-10 flex items-center justify-center transition-opacity duration-300">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#F77124] mx-auto mb-4"></div>
              <p className="text-white text-sm">Loading video...</p>
            </div>
          </div>
        )}
        <div
          className={cn(
            "w-full h-full transition-opacity duration-300",
            isTransitioning ? "opacity-0" : "opacity-100"
          )}
        >
          <VideoPlayer
            key={selectedContent._id} // Key is needed for AWS presigned URLs - ensures proper cleanup and re-initialization
            sources={videoSources}
            posterUrl={course.thumbnail || ""}
            onVideoReady={handleVideoReady}
            contentId={selectedContent._id} // Track content changes for smooth transitions
            moduleId={selectedModule?._id} // For progress tracking
            lessonId={selectedLesson?._id} // For progress tracking
            contentType={selectedContent.type as "video" | "quiz" | "document"} // For progress tracking
          />
        </div>
      </SectionContainer>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if selectedContent, selectedModule, selectedLesson, or course actually changed
    // Return true if props are equal (skip re-render), false if different (re-render)
    const contentChanged =
      prevProps.selectedContent?._id !== nextProps.selectedContent?._id;
    const moduleChanged =
      prevProps.selectedModule?._id !== nextProps.selectedModule?._id;
    const lessonChanged =
      prevProps.selectedLesson?._id !== nextProps.selectedLesson?._id;
    const courseChanged = prevProps.course._id !== nextProps.course._id;

    // Re-render if content, module, lesson, or course changed
    return !contentChanged && !moduleChanged && !lessonChanged && !courseChanged;
  }
);

VideoSection.displayName = "VideoSection";

const CourseContentSection = ({
  course,
  selectedModule,
  selectedLesson,
  selectedContent,
  toggleModule,
  toggleLesson,
  navigateToContent,
}: {
  course: Course;
  selectedModule: CourseModule | null;
  selectedLesson: CourseLesson | null;
  selectedContent: Content | null;
  toggleModule: (module: CourseModule) => void;
  toggleLesson: (lesson: CourseLesson) => void;
  navigateToContent: (contentId: string) => void;
}) => {
  const { accessControl } = useEnrollmentContext() || { accessControl: null };
  const { isContentCompleted } = useCompletedContents();
  
  // Calculate total duration for a module
  const getModuleDuration = (module: CourseModule) => {
    return (module.lessons as CourseLesson[])?.reduce(
      (moduleAcc, lesson) =>
        moduleAcc +
        ((lesson.contents as Content[]) || []).reduce((lessonAcc, content) => {
          if (content.type === "video" && content.duration) {
            return lessonAcc + (content.duration || 0);
          }
          return lessonAcc;
        }, 0),
      0
    );
  };

  // Calculate total duration for a lesson
  const getLessonDuration = (lesson: CourseLesson) => {
    return (lesson.contents as Content[])?.reduce((lessonAcc, content) => {
      if (content.type === "video" && content.duration) {
        return lessonAcc + (content.duration || 0);
      }
      return lessonAcc;
    }, 0);
  };

  // Get content duration (only for videos)
  const getContentDuration = (content: Content) => {
    if (content?.type === "video" && content?.duration) {
      return content.duration || 0;
    }
    return 0;
  };

  return (
    <div className="w-full space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
      {(course.modules as CourseModule[])?.map((courseModule, moduleIndex) => {
        const moduleId = courseModule._id || "";
        const hasModuleAccess = canAccessModule(accessControl, moduleId);
        const isModuleSelected = selectedModule?._id === courseModule._id;

        return (
          <div
            className={`w-full border rounded-lg transition-all duration-200 ${
              isModuleSelected
                ? "border-orange-300 bg-orange-50/30 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            } ${!hasModuleAccess ? "opacity-60" : ""}`}
            key={courseModule._id}
          >
            {/* Module Header */}
            <div
              className={`w-full p-4 rounded-t-lg transition-colors ${
                hasModuleAccess
                  ? "cursor-pointer hover:bg-gray-50/50"
                  : "cursor-not-allowed"
              }`}
              onClick={() => hasModuleAccess && toggleModule(courseModule)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Module {moduleIndex + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2">
                      {courseModule.title}
                    </h3>
                    {!hasModuleAccess && (
                      <Lock className="size-4 text-gray-400 shrink-0" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Clock3 className="size-3.5" />
                    <span className="font-medium">
                      {formatDuration(getModuleDuration(courseModule) || 0)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    ({courseModule.lessons?.length || 0})
                  </span>
                </div>
              </div>
            </div>

            {/* Lessons: only shown if module is selected */}
            {isModuleSelected && hasModuleAccess && (
              <div className="border-t border-gray-200 bg-gray-50/50">
                {(courseModule.lessons as CourseLesson[])?.map(
                  (lesson, lessonIndex) => {
                    const lessonId = lesson._id || "";
                    const hasLessonAccess = canAccessLesson(
                      accessControl,
                      moduleId,
                      lessonId
                    );
                    const isLessonSelected = selectedLesson?._id === lesson._id;

                    return (
                      <div
                        key={lesson._id}
                        className={`border-b border-gray-200/50 last:border-b-0 transition-colors ${
                          isLessonSelected ? "bg-white" : ""
                        } ${!hasLessonAccess ? "opacity-60" : ""}`}
                      >
                        {/* Lesson Header */}
                        <div
                          className={`w-full p-3.5 pl-6 flex items-center justify-between transition-colors ${
                            hasLessonAccess
                              ? `cursor-pointer ${
                                  isLessonSelected
                                    ? "bg-orange-50/50 hover:bg-orange-50"
                                    : "hover:bg-gray-100/50"
                                }`
                              : "cursor-not-allowed"
                          }`}
                          onClick={() =>
                            hasLessonAccess && toggleLesson(lesson)
                          }
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                                isLessonSelected
                                  ? "bg-orange-500 text-white"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {lessonIndex + 1}
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span
                                className={`text-sm font-semibold truncate ${
                                  isLessonSelected
                                    ? "text-orange-700"
                                    : "text-gray-800"
                                }`}
                              >
                                {lesson.title}
                              </span>
                              {!hasLessonAccess && (
                                <Lock className="size-3.5 text-gray-400 shrink-0" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0 ml-2">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Clock3 className="size-3.5" />
                              <span className="font-medium">
                                {formatDuration(getLessonDuration(lesson) || 0)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium px-1.5 py-0.5 bg-gray-200 rounded">
                              {lesson.contents?.length || 0}
                            </span>
                          </div>
                        </div>

                        {/* Content: only shown if lesson is selected */}
                        {isLessonSelected && (
                          <div className="bg-white/80 border-t border-gray-200/50">
                            {(lesson.contents as Content[])?.map(
                              (content, contentIndex) => {
                                if (!content?._id) return null;

                                const contentId = content._id;
                                const hasContentAccess = canAccessContent(
                                  accessControl,
                                  moduleId,
                                  lessonId,
                                  contentId
                                );
                                const isContentSelected =
                                  selectedContent?._id === content._id;
                                const isCompleted = isContentCompleted(contentId);

                                return (
                                  <div
                                    key={content._id}
                                    onClick={() => {
                                      if (hasContentAccess) {
                                        navigateToContent(content._id!);
                                      }
                                    }}
                                    className={cn(
                                      "w-full p-3 pl-12 pr-4 transition-all duration-200 border-b border-gray-100 last:border-b-0",
                                      hasContentAccess
                                        ? `cursor-pointer ${
                                            isContentSelected
                                              ? "bg-orange-100 border-l-4 border-l-orange-500"
                                              : isCompleted
                                              ? "bg-green-50/50 border-l-4 border-l-green-400 hover:bg-green-50"
                                              : "hover:bg-orange-50/50 border-l-4 border-l-transparent hover:border-l-orange-300"
                                          }`
                                        : "cursor-not-allowed opacity-60 border-l-4 border-l-gray-200"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="shrink-0 relative transition-transform hover:scale-105">
                                          {hasContentAccess ? (
                                            isCompleted ? (
                                              <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center">
                                                <CheckCircle2 className="size-4 text-green-600 fill-green-600" />
                                              </div>
                                            ) : content?.type === "video" ? (
                                              <div className="w-8 h-8 rounded-md bg-orange-100 flex items-center justify-center">
                                                <Play className="size-4 text-orange-600 fill-orange-600" />
                                              </div>
                                            ) : (
                                              <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center">
                                                <FileText className="size-4 text-blue-600" />
                                              </div>
                                            )
                                          ) : (
                                            <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                                              <Lock className="size-4 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                          <span
                                            className={cn(
                                              "text-sm font-medium truncate",
                                              !hasContentAccess
                                                ? "text-gray-400"
                                                : isContentSelected
                                                ? "text-orange-900 font-semibold"
                                                : isCompleted
                                                ? "text-green-700 font-medium"
                                                : "text-gray-800"
                                            )}
                                          >
                                            {content?.title || "Untitled"}
                                          </span>
                                          {hasContentAccess && (
                                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                              {content?.type || "unknown"}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {hasContentAccess &&
                                        content?.type === "video" && (
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <Clock3 className="size-3.5 text-gray-400" />
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                                              {formatDuration(
                                                getContentDuration(content)
                                              )}
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CourseContentLayout = ({
  course,
  selectedContent,
  selectedLesson,
  selectedModule,
  navigateToContent,
  toggleModule,
  toggleLesson,
  tabs,
}: {
  course: Course;
  selectedContent: Content | null;
  selectedLesson: CourseLesson | null;
  selectedModule: CourseModule | null;
  navigateToContent: (contentId: string) => void;
  toggleModule: (module: CourseModule) => void;
  toggleLesson: (lesson: CourseLesson) => void;
  tabs: any[];
}) => {
  return (
    <div className="w-full min-h-screen flex gap-4 lg:flex-row flex-col">
      <div className="left-side w-full lg:w-7/10 h-full rounded-xl flex flex-col gap-4">
        <VideoSection 
          course={course} 
          selectedContent={selectedContent}
          selectedModule={selectedModule}
          selectedLesson={selectedLesson}
        />
        <SectionContainer className="p-8">
          <TabSwitcher tabs={tabs} className="w-full" />
        </SectionContainer>
      </div>
      <div className="right-side hidden lg:block w-3/10 h-full rounded-xl relative">
        <SectionContainer className="flex flex-col gap-4 transition-all duration-300 ease-in-out">
          <WhiteButton className="w-full cursor-auto select-auto flex items-center justify-between gap-2 rounded-xl font-bold shadow-[inset_0_-3px_4px_0_rgba(1,70,231,0.13)]">
            <span className="flex items-center gap-2">
              <span className="text-base font-bold">Course Content</span>
              <span className="bg-black font-semibold text-[10px] text-white px-2 py-0.5 rounded-full">
                {course.modules?.length || 0}
              </span>
            </span>
          </WhiteButton>
          <CourseContentSection
            course={course}
            selectedModule={selectedModule}
            selectedLesson={selectedLesson}
            selectedContent={selectedContent}
            toggleModule={toggleModule}
            toggleLesson={toggleLesson}
            navigateToContent={navigateToContent}
          />
        </SectionContainer>
      </div>
    </div>
  );
};

const PreviewCourse = ({ course }: { course: Course }) => {
  const [width, setWidth] = useState(0);
  const [search, setSearch] = useState("");
  const [qnas, setQnas] = useState<QnA[]>([]);
  const [isLoadingQnas, setIsLoadingQnas] = useState(false);

  const { getQnAs } = useQnA();

  // Fetch Q&As for this course
  const fetchQnas = async () => {
    if (!course._id) return;

    setIsLoadingQnas(true);
    try {
      const result = await getQnAs({
        courseId: course._id,
        page: 1,
        limit: 50, // Get more Q&As for better UX
      });

      if (result) {
        setQnas(result.qnas);
      }
    } catch (error) {
      console.error("Failed to fetch Q&As:", error);
    } finally {
      setIsLoadingQnas(false);
    }
  };

  useEffect(() => {
    fetchQnas();
  }, [course._id, getQnAs]);

  // Filter questions based on search
  const filteredQuestions = qnas?.filter(
    (qna) =>
      qna.message.toLowerCase().includes(search.toLowerCase()) ||
      (typeof qna.userId === "object" &&
        `${qna.userId.firstName || ""} ${qna.userId.lastName || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()))
  );

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { accessControl, enrollment } = useEnrollmentContext() || { 
    accessControl: null, 
    enrollment: null 
  };

  const {
    selectedModule,
    selectedLesson,
    selectedContent,
    navigateToContent,
    toggleModule,
    toggleLesson,
    isInitialized,
  } = useLessonNavigation(course, accessControl, enrollment?.lastContentAccessed);

  const tabs = [
    ...(width < 1024
      ? [
          {
            label: "Course Content",
            component: (
              <CourseContentSection
                course={course}
                selectedModule={selectedModule}
                selectedLesson={selectedLesson}
                selectedContent={selectedContent}
                toggleModule={toggleModule}
                toggleLesson={toggleLesson}
                navigateToContent={navigateToContent}
              />
            ),
            showCount: course.modules?.length || 0,
          },
        ]
      : []),
    {
      label: "Overview",
      component: <OverviewSection course={course} />,
    },
    {
      label: `Q&A (${filteredQuestions?.length || 0})`,
      component: (
        <QASections
          questions={filteredQuestions}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoadingQnas}
          courseId={course._id}
          lessonId={selectedLesson?._id || ""}
          contentId={selectedContent?._id || ""}
          onRefresh={fetchQnas}
        />
      ),
    },
    {
      label: `Reviews`,
      component: (
        <Reviews
          courseId={course._id}
          isLoading={false}
          onRefresh={() => {
            // Reviews will refresh automatically when onRefresh is called
          }}
        />
      ),
    },
    // {
    //   label: "Notes",
    //   component: <Notes />,
    // },
  ];

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no modules exist
  if (!course.modules || course.modules.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <Play className="size-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Content Available
          </h2>
          <p className="text-gray-600">
            This course doesn't have any modules or lessons yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <VideoTimeProvider>
      <CourseContentLayout
        course={course}
        selectedContent={selectedContent}
        selectedLesson={selectedLesson}
        selectedModule={selectedModule}
        navigateToContent={navigateToContent}
        toggleModule={toggleModule}
        toggleLesson={toggleLesson}
        tabs={tabs}
      />
    </VideoTimeProvider>
  );
};

export default memo(PreviewCourse);
