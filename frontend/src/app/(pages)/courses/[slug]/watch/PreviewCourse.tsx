"use client";
import { Course, CourseLesson, CourseModule, Content } from "@/types";
import React, { memo, useEffect, useMemo, useState } from "react";
import SectionContainer from "./components/SectionContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Clock3, Play, FileText, Lock } from "lucide-react";
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
import { formatDuration } from "@/lib/utils";
import { usePresignedVideoSources } from "@/hooks/usePresignedUrl";
import useQnA from "@/hooks/useQnA";
import { QnA } from "@/types/qna";
import { useContentCompletion } from "./hooks/useContentCompletion";
import { useSession } from "next-auth/react";
import { useEnrollmentContext } from "@/components/EnrollmentGuard";
import {
  canAccessModule,
  canAccessLesson,
  canAccessContent,
} from "@/lib/accessControlUtils";

const VideoPlayer = dynamic(() => import("./components/VideoPlayer"), {
  ssr: false,
});

const VideoSection = ({
  course,
  selectedContent,
  onProgressUpdate,
  onVideoEnd,
}: {
  course: Course;
  selectedContent: Content | null;
  onProgressUpdate?: (progress: number) => void;
  onVideoEnd?: () => void;
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
          
          return canAccessContent(accessControl, moduleId, lessonId, contentId);
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

  const handleVideoReady = (video: HTMLVideoElement) => {
    connectToVideo(video);
    // Autoplay the video after it's ready
    video.play().catch((error) => {
      console.log("Autoplay failed:", error);
      // Autoplay might fail due to browser policies, expected
    });
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
            You don't have access to this content. Please contact your administrator
            to request access.
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
    <SectionContainer id="video-player" className="w-full aspect-video">
      <VideoPlayer
        key={selectedContent._id}
        sources={videoSources}
        posterUrl={course.thumbnail || ""}
        onVideoReady={handleVideoReady}
      />
    </SectionContainer>
  );
};

const CourseContentSection = ({
  course,
  selectedModule,
  selectedLesson,
  selectedContent,
  toggleModule,
  toggleLesson,
  navigateToContent,
  isContentCompleted,
}: {
  course: Course;
  selectedModule: CourseModule | null;
  selectedLesson: CourseLesson | null;
  selectedContent: Content | null;
  toggleModule: (module: CourseModule) => void;
  toggleLesson: (lesson: CourseLesson) => void;
  navigateToContent: (contentId: string) => void;
  isContentCompleted: (contentId: string) => boolean;
}) => {
  const { accessControl } = useEnrollmentContext() || { accessControl: null };
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
    <div className="w-full space-y-3">
      {(course.modules as CourseModule[])?.map((courseModule, moduleIndex) => {
        const moduleId = courseModule._id || "";
        const hasModuleAccess = canAccessModule(accessControl, moduleId);
        
        return (
          <div
            className={`w-full border border-gray-200 rounded-lg ${
              moduleIndex !== (course.modules?.length || 0) - 1 ? "mb-3" : ""
            } ${!hasModuleAccess ? "opacity-60" : ""}`}
            key={courseModule._id}
          >
            {/* Module Header */}
            <div
              className={`w-full p-4 rounded-t-lg ${
                hasModuleAccess
                  ? "cursor-pointer hover:bg-gray-50"
                  : "cursor-not-allowed"
              }`}
              onClick={() => hasModuleAccess && toggleModule(courseModule)}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-normal text-gray-500">
                    Module {moduleIndex + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">
                      {courseModule.title}
                    </span>
                    {!hasModuleAccess && (
                      <Lock className="size-4 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {formatDuration(getModuleDuration(courseModule) || 0)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({courseModule.lessons?.length || 0} lessons)
                  </span>
                </div>
              </div>
            </div>

            {/* Lessons: only shown if module is selected */}
            {selectedModule?._id === courseModule._id && hasModuleAccess && (
              <div className="border-t border-gray-200">
                {(courseModule.lessons as CourseLesson[])?.map(
                  (lesson, lessonIndex) => {
                    const lessonId = lesson._id || "";
                    const hasLessonAccess = canAccessLesson(
                      accessControl,
                      moduleId,
                      lessonId
                    );

                    return (
                      <div
                        key={lesson._id}
                        className={`border-b border-gray-100 last:border-b-0 ${
                          !hasLessonAccess ? "opacity-60" : ""
                        }`}
                      >
                        {/* Lesson Header */}
                        <div
                          className={`w-full p-3 pl-8 flex items-center justify-between ${
                            hasLessonAccess
                              ? "cursor-pointer hover:bg-gray-50"
                              : "cursor-not-allowed"
                          }`}
                          onClick={() => hasLessonAccess && toggleLesson(lesson)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                              {lessonIndex + 1}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                {lesson.title}
                              </span>
                              {!hasLessonAccess && (
                                <Lock className="size-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock3 className="size-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDuration(getLessonDuration(lesson) || 0)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({lesson.contents?.length || 0} items)
                            </span>
                          </div>
                        </div>

                        {/* Content: only shown if lesson is selected */}
                        {selectedLesson?._id === lesson._id && (
                          <div className="bg-gray-50">
                            {(lesson.contents as Content[])?.map((content) => {
                              if (!content?._id) return null;

                              const contentId = content._id;
                              const hasContentAccess = canAccessContent(
                                accessControl,
                                moduleId,
                                lessonId,
                                contentId
                              );

                              return (
                                <div
                                  key={content._id}
                                  onClick={() => {
                                    if (hasContentAccess) {
                                      navigateToContent(content._id!);
                                    }
                                  }}
                                  className={`w-full p-3 pl-16 transition-all duration-200 border-b border-gray-200 last:border-b-0 ${
                                    hasContentAccess
                                      ? `cursor-pointer hover:bg-gray-100 ${
                                          selectedContent?._id === content._id
                                            ? "bg-orange-50 border-orange-200"
                                            : ""
                                        }`
                                      : "cursor-not-allowed opacity-60"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="shrink-0 relative">
                                        {hasContentAccess ? (
                                          content?.type === "video" ? (
                                            <Play className="size-4 text-orange-500" />
                                          ) : (
                                            <FileText className="size-4 text-blue-500" />
                                          )
                                        ) : (
                                          <Lock className="size-4 text-gray-400" />
                                        )}
                                        {/* Completion indicator */}
                                        {hasContentAccess &&
                                          isContentCompleted(content._id!) && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                              <span className="text-white text-xs">
                                                ✓
                                              </span>
                                            </div>
                                          )}
                                      </div>
                                      <span
                                        className={`text-sm font-medium truncate ${
                                          !hasContentAccess
                                            ? "text-gray-400"
                                            : selectedContent?._id ===
                                              content._id
                                            ? "text-orange-700"
                                            : isContentCompleted(content._id!)
                                            ? "text-green-700"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {content?.title || "Untitled"}
                                      </span>
                                      {hasContentAccess && (
                                        <>
                                          <span className="text-xs text-gray-500 uppercase">
                                            {content?.type || "unknown"}
                                          </span>
                                          {isContentCompleted(content._id!) && (
                                            <span className="text-xs text-green-600 font-medium">
                                              ✓ Completed
                                            </span>
                                          )}
                                        </>
                                      )}
                                      {!hasContentAccess && (
                                        <span className="text-xs text-gray-400 italic">
                                          Locked
                                        </span>
                                      )}
                                    </div>
                                    {hasContentAccess &&
                                      content?.type === "video" && (
                                        <div className="flex items-center gap-1">
                                          <Clock3 className="size-3 text-gray-400" />
                                          <span className="text-xs text-gray-500">
                                            {formatDuration(
                                              getContentDuration(content)
                                            )}
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              );
                            })}
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

const CourseContentWithTracking = ({ 
  course, 
  selectedContent, 
  selectedLesson, 
  selectedModule, 
  navigateToContent, 
  toggleModule, 
  toggleLesson, 
  tabs 
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
  // Content completion tracking (now inside VideoTimeProvider)
  const { progress: videoProgress, isPlaying } = useVideoTimeContext();
  const {
    completedContents,
    isTracking,
    markContentAsCompleted,
    isContentCompleted,
    getOverallCompletion,
  } = useContentCompletion({
    courseId: course._id!,
    selectedContent,
    selectedLesson,
    selectedModule,
    videoProgress,
    isVideoPlaying: isPlaying,
  });

  // Handle video end with completion tracking
  const handleVideoEnd = () => {
    console.log("Video ended");
    if (selectedContent) {
      markContentAsCompleted(selectedContent._id!);
    }
  };

  return (
    <div className="w-full min-h-screen flex gap-4 lg:flex-row flex-col">
      <div className="left-side w-full lg:w-7/10 h-full rounded-xl flex flex-col gap-4">
        <VideoSection course={course} selectedContent={selectedContent} />
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
            isContentCompleted={isContentCompleted}
          />
        </SectionContainer>
      </div>
    </div>
  );
};

const PreviewCourse = ({ course }: { course: Course }) => {
  const { data: session } = useSession();
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
      (typeof qna.userId === 'object' && 
       `${qna.userId.firstName || ''} ${qna.userId.lastName || ''}`.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { accessControl } = useEnrollmentContext() || { accessControl: null };

  const {
    selectedModule,
    selectedLesson,
    selectedContent,
    navigateToContent,
    toggleModule,
    toggleLesson,
    isInitialized,
  } = useLessonNavigation(course, accessControl);

  // Handle progress updates
  const handleProgressUpdate = (progress: number) => {
    // This will be called by the VideoTimeContext
    console.log(`Video progress: ${progress}%`);
  };

  // Handle video end
  const handleVideoEnd = () => {
    console.log("Video ended");
  };

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
                isContentCompleted={() => false}
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
    <VideoTimeProvider onProgressUpdate={handleProgressUpdate}>
      <CourseContentWithTracking 
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
