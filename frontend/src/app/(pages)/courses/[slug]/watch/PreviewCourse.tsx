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
import { Clock3, Play, FileText, Lock, CheckCircle2, HelpCircle } from "lucide-react";
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
import { formatDuration, cn } from "@/lib/utils";
import { usePresignedVideoSources } from "@/hooks/usePresignedUrl";
import useQnA from "@/hooks/useQnA";
import useReview from "@/hooks/useReview";
import { QnA } from "@/types/qna";
import { Review } from "@/types/review";
import { useEnrollmentContext } from "@/components/EnrollmentGuard";
import {
  canAccessModule,
  canAccessLesson,
  canAccessContent,
} from "@/lib/accessControlUtils";
import { useCompletedContents } from "./hooks/useCompletedContents";
import { useCourseCompletion } from "./hooks/useCourseCompletion";
import { FullScreenLoader } from "@/components/ui/Loader";
import QuizSection from "./components/QuizSection";

const VideoPlayer = dynamic(() => import("@/components/video/VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#F77124] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading video player...</p>
      </div>
    </div>
  ),
});

const VideoSection = memo(
  ({
    course,
    selectedContent,
    selectedModule,
    selectedLesson,
    onVideoComplete,
    shouldAutoPlay,
  }: {
    course: Course;
    selectedContent: Content | null;
    selectedModule: CourseModule | null;
    selectedLesson: CourseLesson | null;
    onVideoComplete?: () => void;
    shouldAutoPlay?: boolean;
  }) => {
    const { connectToVideo } = useVideoTimeContext();
    const { accessControl } = useEnrollmentContext() || { accessControl: null };
    const { isContentCompleted } = useCompletedContents();

    // Use ref to track accessControl to prevent unnecessary recalculations
    const accessControlRef = useRef(accessControl);
    useEffect(() => {
      accessControlRef.current = accessControl;
    }, [accessControl]);

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
              accessControlRef.current,
              moduleId,
              lessonId,
              contentId
            );
          }
        }
      }

      return false;
    }, [selectedContent?._id, course.modules]);

    // Extract raw video sources - memoize based on specific properties
    const rawVideoSources = useMemo(() => {
      if (!selectedContent || selectedContent.type !== "video") return [];

      const videoContent = selectedContent as VideoContent;
      const allVideoSources: Array<{ quality: string; src: string }> = [];

      if (videoContent.sources && Array.isArray(videoContent.sources)) {
        videoContent.sources.forEach(
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
    }, [selectedContent?._id, selectedContent?.type]);

    // Convert S3 keys to presigned URLs for secure access
    const presignedUrlOptions = useMemo(
      () => ({
        expiresIn: 3600,
        autoRefresh: true,
        refreshThreshold: 300,
      }),
      []
    );

    const {
      sources: presignedSources,
      isLoading: isUrlLoading,
      error: urlError,
    } = usePresignedVideoSources(rawVideoSources, presignedUrlOptions);

    // Convert presigned sources back to videoUrl format for new VideoPlayer
    const videoSources = useMemo(() => {
      return presignedSources.map((source) => ({
        quality: source.quality,
        videoUrl: source.src,
      }));
    }, [presignedSources]);

    // Track previous content to detect changes
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
        const timer = setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
        return () => clearTimeout(timer);
      }
      if (selectedContent?._id) {
        prevContentRef.current = selectedContent._id;
      }
    }, [selectedContent?._id]);

    const handleVideoReady = useCallback(
      (video: HTMLVideoElement) => {
        if (!selectedContent?._id) return;
        connectToVideo(video);
      },
      [selectedContent?._id, connectToVideo]
    );

    // No content selected
    if (!selectedContent) {
      return (
        <SectionContainer
          id="video-player"
          className="w-full aspect-video bg-gray-100 flex items-center justify-center"
        >
          <div className="text-center">
            <Play className="size-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select content to start</p>
          </div>
        </SectionContainer>
      );
    }

    // Quiz content
    if (selectedContent.type === "quiz") {
      return (
        <QuizSection
          quizContent={selectedContent}
          moduleId={selectedModule?._id}
          lessonId={selectedLesson?._id}
          hasContentAccess={hasContentAccess}
          isAlreadyCompleted={!!(selectedContent._id && isContentCompleted(selectedContent._id))}
          onQuizComplete={onVideoComplete}
        />
      );
    }

    // Document content - placeholder for now
    if (selectedContent.type === "document") {
      return (
        <SectionContainer
          id="video-player"
          className="w-full aspect-video bg-gray-100 flex items-center justify-center"
        >
          <div className="text-center">
            <FileText className="size-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Document content - coming soon</p>
          </div>
        </SectionContainer>
      );
    }

    // Show locked content message if user doesn't have access (video)
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
            key={selectedContent._id}
            sources={videoSources}
            posterUrl={course.thumbnail || ""}
            onVideoReady={handleVideoReady}
            onVideoComplete={onVideoComplete}
            autoPlay={shouldAutoPlay}
            contentId={selectedContent._id}
            moduleId={selectedModule?._id}
            lessonId={selectedLesson?._id}
            contentType={selectedContent.type as "video" | "quiz" | "document"}
          />
        </div>
      </SectionContainer>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if selectedContent ID changed
    // Also check if course ID changed (shouldn't happen, but safety check)
    return (
      prevProps.selectedContent?._id === nextProps.selectedContent?._id &&
      prevProps.selectedModule?._id === nextProps.selectedModule?._id &&
      prevProps.selectedLesson?._id === nextProps.selectedLesson?._id &&
      prevProps.course._id === nextProps.course._id &&
      prevProps.onVideoComplete === nextProps.onVideoComplete &&
      prevProps.shouldAutoPlay === nextProps.shouldAutoPlay
    );
  }
);

VideoSection.displayName = "VideoSection";

// Memoize CourseContentSection to prevent unnecessary re-renders
const CourseContentSection = memo(
  ({
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

    // Memoize duration calculation functions
    const getModuleDuration = useCallback((module: CourseModule) => {
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
    }, []);

    const getLessonDuration = useCallback((lesson: CourseLesson) => {
      return (lesson.contents as Content[])?.reduce((lessonAcc, content) => {
        if (content.type === "video" && content.duration) {
          return lessonAcc + (content.duration || 0);
        }
        return lessonAcc;
      }, 0);
    }, []);

    const getContentDuration = useCallback((content: Content) => {
      if (content?.type === "video" && content?.duration) {
        return content.duration || 0;
      }
      return 0;
    }, []);

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

              {/* Lessons */}
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

                          {/* Content */}
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
                                              ) : content?.type === "quiz" ? (
                                                <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center">
                                                  <HelpCircle className="size-4 text-purple-600" />
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
  },
  (prevProps, nextProps) => {
    // Only re-render if selected IDs change
    return (
      prevProps.selectedModule?._id === nextProps.selectedModule?._id &&
      prevProps.selectedLesson?._id === nextProps.selectedLesson?._id &&
      prevProps.selectedContent?._id === nextProps.selectedContent?._id
    );
  }
);

CourseContentSection.displayName = "CourseContentSection";

// Memoize CourseContentLayout with proper comparison
const CourseContentLayout = memo(
  ({
    course,
    selectedContent,
    selectedLesson,
    selectedModule,
    navigateToContent,
    navigateToNext,
    toggleModule,
    toggleLesson,
    tabs,
    shouldAutoPlay,
  }: {
    course: Course;
    selectedContent: Content | null;
    selectedLesson: CourseLesson | null;
    selectedModule: CourseModule | null;
    navigateToContent: (contentId: string) => void;
    navigateToNext: () => void;
    toggleModule: (module: CourseModule) => void;
    toggleLesson: (lesson: CourseLesson) => void;
    tabs: any[];
    shouldAutoPlay?: boolean;
  }) => {
    return (
      <div className="w-full min-h-screen flex gap-4 lg:flex-row flex-col">
        <div className="left-side w-full lg:w-7/10 h-full rounded-xl flex flex-col gap-4">
          <VideoSection
            course={course}
            selectedContent={selectedContent}
            selectedModule={selectedModule}
            selectedLesson={selectedLesson}
            onVideoComplete={navigateToNext}
            shouldAutoPlay={shouldAutoPlay}
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.selectedContent?._id === nextProps.selectedContent?._id &&
      prevProps.selectedLesson?._id === nextProps.selectedLesson?._id &&
      prevProps.selectedModule?._id === nextProps.selectedModule?._id &&
      prevProps.course._id === nextProps.course._id &&
      prevProps.navigateToNext === nextProps.navigateToNext &&
      prevProps.shouldAutoPlay === nextProps.shouldAutoPlay &&
      prevProps.tabs === nextProps.tabs
    );
  }
);

CourseContentLayout.displayName = "CourseContentLayout";

const PreviewCourse = ({ course }: { course: Course }) => {
  const [width, setWidth] = useState(0);
  const [search, setSearch] = useState("");
  const [qnas, setQnas] = useState<QnA[]>([]);
  const [isLoadingQnas, setIsLoadingQnas] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  // Filter course to show only active content for this specific course
  const filteredCourse = useMemo(() => {
    const deactivatedModules = course.deactivatedModules || [];
    const deactivatedLessons = course.deactivatedLessons || [];
    const deactivatedContents = course.deactivatedContents || [];

    // Filter modules
    const activeModules = (course.modules as CourseModule[] || [])
      .filter((module) => !deactivatedModules.includes(module._id || ""))
      .map((module) => {
        // Filter lessons within this module
        const activeLessons = (module.lessons as CourseLesson[] || [])
          .filter((lesson) => !deactivatedLessons.includes(lesson._id || ""))
          .map((lesson) => {
            // Filter contents within this lesson
            const activeContents = (lesson.contents as Content[] || [])
              .filter((content) => !deactivatedContents.includes(content._id || ""));

            return {
              ...lesson,
              contents: activeContents,
            };
          });

        return {
          ...module,
          lessons: activeLessons,
        };
      });

    return {
      ...course,
      modules: activeModules,
    };
  }, [course]);

  const { getQnAs, getQnAReplies } = useQnA();
  const { getReviewsByReviewable } = useReview();

  const [qnasPage, setQnasPage] = useState(1);
  const [qnasTotal, setQnasTotal] = useState(0);
  const [isLoadingMoreQnAs, setIsLoadingMoreQnAs] = useState(false);
  const [loadingRepliesForId, setLoadingRepliesForId] = useState<string | null>(null);

  const getQnAsRef = useRef(getQnAs);
  const getQnARepliesRef = useRef(getQnAReplies);
  useEffect(() => {
    getQnAsRef.current = getQnAs;
    getQnARepliesRef.current = getQnAReplies;
  }, [getQnAs, getQnAReplies]);

  // Store getReviewsByReviewable in ref to prevent dependency changes
  const getReviewsByReviewableRef = useRef(getReviewsByReviewable);
  useEffect(() => {
    getReviewsByReviewableRef.current = getReviewsByReviewable;
  }, [getReviewsByReviewable]);

  // Fetch Q&As for this course (initial load)
  const fetchQnas = useCallback(async () => {
    if (!course._id) return;

    setIsLoadingQnas(true);
    setQnasPage(1);
    try {
      const result = await getQnAsRef.current({
        courseId: course._id,
        page: 1,
        limit: 5,
        repliesLimit: 5,
        search: search.trim() || undefined,
      });

      setQnas(result?.qnas ?? []);
      setQnasTotal(result?.total ?? 0);
    } catch (error) {
      console.error("Failed to fetch Q&As:", error);
    } finally {
      setIsLoadingQnas(false);
    }
  }, [course._id]);

  // Load 5 more Q&As
  const loadMoreQnAs = useCallback(async () => {
    if (!course._id || isLoadingMoreQnAs) return;

    setIsLoadingMoreQnAs(true);
    const nextPage = qnasPage + 1;
    try {
      const result = await getQnAsRef.current({
        courseId: course._id,
        page: nextPage,
        limit: 5,
        repliesLimit: 5,
        search: search.trim() || undefined,
      });

      setQnas((prev) => [...prev, ...(result?.qnas ?? [])]);
      setQnasTotal((prev) => result?.total ?? prev);
      setQnasPage(nextPage);
    } catch (error) {
      console.error("Failed to load more Q&As:", error);
    } finally {
      setIsLoadingMoreQnAs(false);
    }
  }, [course._id, qnasPage, isLoadingMoreQnAs]);

  // Load 5 more replies for a QnA
  const loadMoreReplies = useCallback(async (qnaId: string) => {
    if (loadingRepliesForId) return;

    const qna = qnas.find((q) => q._id === qnaId);
    if (!qna) return;

    const loadedCount = qna.replies?.length ?? 0;
    const nextPage = Math.floor(loadedCount / 5) + 1;

    setLoadingRepliesForId(qnaId);
    try {
      const result = await getQnARepliesRef.current({
        qnaId,
        page: nextPage,
        limit: 5,
      });

      if (result?.replies?.length) {
        setQnas((prev) =>
          prev.map((q) =>
            q._id === qnaId
              ? { ...q, replies: [...(q.replies ?? []), ...result.replies] }
              : q
          )
        );
      }
    } catch (error) {
      console.error("Failed to load more replies:", error);
    } finally {
      setLoadingRepliesForId(null);
    }
  }, [qnas, loadingRepliesForId]);

  useEffect(() => {
    fetchQnas();
  }, [fetchQnas]);

  // Refetch when search changes (debounced elsewhere)
  const debouncedSearchRef = useRef(search);
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearchRef.current = search;
      fetchQnas();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Reviews for this course - stable callback (same pattern as QnA)
  const fetchReviews = useCallback(async () => {
    if (!course._id) return;

    setIsLoadingReviews(true);
    try {
      const result = await getReviewsByReviewableRef.current("Course", course._id, {
        page: 1,
        limit: 50,
      });
      setReviews(result?.reviews ?? []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [course._id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Filter questions based on search - memoized with stable dependencies
  const filteredQuestions = useMemo(() => {
    if (!qnas || qnas.length === 0) return [];
    if (!search.trim()) return qnas;
    
    const searchLower = search.toLowerCase();
    return qnas.filter(
      (qna) =>
        qna.message.toLowerCase().includes(searchLower) ||
        (typeof qna.userId === "object" &&
          `${qna.userId.firstName || ""} ${qna.userId.lastName || ""}`
            .toLowerCase()
            .includes(searchLower))
    );
  }, [qnas, search]);

  // Stable search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

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
    enrollment: null,
  };

  // Monitor course completion and certificate generation
  const { isGeneratingCertificate } = useCourseCompletion(course);

  const {
    selectedModule,
    selectedLesson,
    selectedContent,
    navigateToContent,
    navigateToNext,
    toggleModule,
    toggleLesson,
    isInitialized,
  } = useLessonNavigation(filteredCourse, accessControl, enrollment?.lastContentAccessed);

  // Wrapper for navigateToNext that enables autoplay
  const handleNavigateToNext = useCallback(() => {
    setShouldAutoPlay(true);
    navigateToNext();
  }, [navigateToNext]);

  // Reset autoplay flag when content changes
  useEffect(() => {
    if (selectedContent?._id) {
      // Reset autoplay after a short delay to allow video to load
      const timer = setTimeout(() => {
        setShouldAutoPlay(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedContent?._id]);

  // Memoize stable IDs to prevent unnecessary tab recreation
  const selectedModuleId = selectedModule?._id || "";
  const selectedLessonId = selectedLesson?._id || "";
  const selectedContentId = selectedContent?._id || "";
  const courseId = course._id || "";
  const modulesCount = filteredCourse.modules?.length || 0;
  const isMobile = width < 1024;

  // Memoize tab components separately to prevent recreation
  const mobileContentTabComponent = useMemo(
    () => (
      <CourseContentSection
        course={filteredCourse}
        selectedModule={selectedModule}
        selectedLesson={selectedLesson}
        selectedContent={selectedContent}
        toggleModule={toggleModule}
        toggleLesson={toggleLesson}
        navigateToContent={navigateToContent}
      />
    ),
    [
      filteredCourse,
      selectedModuleId,
      selectedLessonId,
      selectedContentId,
      toggleModule,
      toggleLesson,
      navigateToContent,
    ]
  );

  const overviewTabComponent = useMemo(
    () => <OverviewSection course={course} />,
    [course]
  );

  const qaTabComponent = useMemo(
    () => (
      <QASections
        questions={filteredQuestions}
        search={search}
        onSearchChange={handleSearchChange}
        isLoading={isLoadingQnas}
        courseId={courseId}
        lessonId={selectedLessonId}
        contentId={selectedContentId}
        onRefresh={fetchQnas}
        onLoadMoreReplies={loadMoreReplies}
        loadingRepliesForId={loadingRepliesForId}
      />
    ),
    [
      filteredQuestions,
      search,
      handleSearchChange,
      isLoadingQnas,
      courseId,
      selectedLessonId,
      selectedContentId,
      fetchQnas,
      loadMoreReplies,
      loadingRepliesForId,
    ]
  );

  const reviewsTabComponent = useMemo(
    () => (
      <Reviews
        courseId={courseId}
        reviews={reviews}
        isLoading={isLoadingReviews}
        onRefresh={fetchReviews}
      />
    ),
    [courseId, reviews, isLoadingReviews, fetchReviews]
  );

  // Memoize tabs array - only recreate when structure actually changes
  const tabs = useMemo(() => {
    const mobileContentTab = isMobile
      ? [
          {
            label: "Course Content",
            component: mobileContentTabComponent,
            showCount: modulesCount,
          },
        ]
      : [];

    return [
      ...mobileContentTab,
      {
        label: "Overview",
        component: overviewTabComponent,
      },
      {
        label: `Q&A (${filteredQuestions.length})`,
        component: qaTabComponent,
      },
      {
        label: `Reviews`,
        component: reviewsTabComponent,
      },
    ];
  }, [
    isMobile,
    mobileContentTabComponent,
    overviewTabComponent,
    qaTabComponent,
    reviewsTabComponent,
    filteredQuestions.length,
    modulesCount,
  ]);

  // Show loading screen when certificate is being generated
  if (isGeneratingCertificate) {
    return (
      <FullScreenLoader
        text="Generating your certificate..."
        size="xl"
        variant="spinner"
      />
    );
  }

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
  if (!filteredCourse.modules || filteredCourse.modules.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <Play className="size-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Content Available
          </h2>
          <p className="text-gray-600">
            This course doesn't have any active modules or lessons yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <VideoTimeProvider>
      <CourseContentLayout
        course={filteredCourse}
        selectedContent={selectedContent}
        selectedLesson={selectedLesson}
        selectedModule={selectedModule}
        navigateToContent={navigateToContent}
        navigateToNext={handleNavigateToNext}
        toggleModule={toggleModule}
        toggleLesson={toggleLesson}
        tabs={tabs}
        shouldAutoPlay={shouldAutoPlay}
      />
    </VideoTimeProvider>
  );
};

export default memo(PreviewCourse);
