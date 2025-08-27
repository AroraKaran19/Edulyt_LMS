"use client";
import { Course, CourseLesson, CourseModule, Content } from "@/types";
import React, { memo, useEffect, useMemo, useState } from "react";
import SectionContainer from "./components/SectionContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Clock3, Play, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { useLessonNavigation } from "./hooks/useLessonNavigation";
import { formatDuration } from "@/lib/formatDuration";
import {
  VideoTimeProvider,
  useVideoTimeContext,
} from "./context/VideoTimeContext";
import TabSwitcher from "@/components/ui/course/TabSwitcher";
import OverviewSection from "./components/OverviewSection";
import { VideoContent } from "@/types";
import { usePresignedVideoSources } from "@/hooks/usePresignedUrl";
import Reviews from "./components/Reviews";
import QASections from "./components/QASections";
import Notes from "./components/Notes";

// Sample Q&A data moved to PreviewCourse
const questionsData = [
  {
    id: 1,
    user: {
      name: "Archit Narang",
      avatar: "/user.svg",
      course: "Artificial Intelligence & Machine Learning"
    },
    question: "Lorem ipsum dolor sit amet consectetur. Orci at ultricies pellentesque egestas sollicitudin amet morbi tortor. Mattis odio sagittis ullamcorper maecenas viverra orci at. Pellentesque sed lacus felis consequat purus turpis purus ornare purus. At lacus sed elementum imperdiet. Faucibus sit massa duis arcu quis ultricies. Tellus aliquam enim commodo egestas rhoncus aliquet velit scelerisque amet. Commodo in eu mattis cras. Mus faucibus netus et aliquet. Pulvinar hendrerit tristique scelerisque sed eget in."
  },
  {
    id: 2,
    user: {
      name: "Sarah Johnson",
      avatar: "/user.svg",
      course: "Data Science & Analytics"
    },
    question: "What are the key differences between supervised and unsupervised learning algorithms? I'm having trouble understanding when to use each approach in real-world scenarios."
  },
  {
    id: 3,
    user: {
      name: "Mike Chen",
      avatar: "/user.svg",
      course: "Deep Learning Fundamentals"
    },
    question: "Can someone explain the concept of gradient descent and how it's used in neural network training? I'm particularly confused about the backpropagation process."
  },
  {
    id: 4,
    user: {
      name: "Emily Rodriguez",
      avatar: "/user.svg",
      course: "Computer Vision"
    },
    question: "How do convolutional neural networks handle image recognition tasks? What makes them more effective than traditional machine learning approaches for visual data?"
  }
];

const VideoPlayer = dynamic(() => import("./components/VideoPlayer"), {
  ssr: false,
});

const VideoSection = ({
  course,
  selectedContent,
}: {
  course: Course;
  selectedContent: Content | null;
}) => {
  const { connectToVideo } = useVideoTimeContext();

  const rawVideoSources = useMemo(() => {
    if (!selectedContent || selectedContent.type !== "video") return [];

    // Extract video sources from content
    const allVideoSources: Array<{ quality: string; src: string }> = [];

    if (selectedContent.sources) {
      selectedContent.sources.forEach((source: VideoContent["sources"][number]) => {
        allVideoSources.push({
          quality: source.quality,
          src: source.videoUrl,
        });
      });
    }

    return allVideoSources;
  }, [selectedContent]);

  // Convert S3 keys to presigned URLs for secure access
  const { sources: videoSources, isLoading: isUrlLoading, error: urlError } = usePresignedVideoSources(
    rawVideoSources,
    { expiresIn: 3600, autoRefresh: true, refreshThreshold: 300 }
  );

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
      <SectionContainer id="video-player" className="w-full aspect-video bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Play className="size-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select a video to start watching</p>
        </div>
      </SectionContainer>
    );
  }

  // Show loading state while generating presigned URLs
  if (isUrlLoading) {
    return (
      <SectionContainer id="video-player" className="w-full aspect-video bg-gray-100 flex items-center justify-center">
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
      <SectionContainer id="video-player" className="w-full aspect-video bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
}: {
  course: Course;
  selectedModule: CourseModule | null;
  selectedLesson: CourseLesson | null;
  selectedContent: Content | null;
  toggleModule: (module: CourseModule) => void;
  toggleLesson: (lesson: CourseLesson) => void;
  navigateToContent: (contentId: string) => void;
}) => {
  // Calculate total duration for a module
  const getModuleDuration = (module: CourseModule) => {
    return module.lessons.reduce(
      (moduleAcc, lesson) =>
        moduleAcc +
        lesson.contents.reduce((lessonAcc, content) => {
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
    return lesson.contents.reduce((lessonAcc, content) => {
      if (content.type === "video" && content.duration) {
        return lessonAcc + (content.duration || 0);
      }
      return lessonAcc;
    }, 0);
  };

  // Get content duration (only for videos)
  const getContentDuration = (content: Content) => {
    if (content.type === "video" && content.duration) {
      return content.duration || 0;
    }
    return 0;
  };

  return (
    <div className="w-full space-y-3">
      {course.modules.map((module, moduleIndex) => (
        <div
          className={`w-full border border-gray-200 rounded-lg ${moduleIndex !== course.modules.length - 1 ? "mb-3" : ""
            }`}
          key={module._id}
        >
          {/* Module Header */}
          <div
            className="w-full p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg"
            onClick={() => toggleModule(module)}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-normal text-gray-500">
                  Module {moduleIndex + 1}
                </span>
                <span className="text-base font-bold">{module.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {formatDuration(getModuleDuration(module))}
                </span>
                <span className="text-xs text-gray-500">
                  ({module.lessons.length} lessons)
                </span>
              </div>
            </div>
          </div>

          {/* Lessons: only shown if module is selected */}
          {selectedModule?._id === module._id && (
            <div className="border-t border-gray-200">
              {module.lessons.map((lesson, lessonIndex) => (
                <div key={lesson._id} className="border-b border-gray-100 last:border-b-0">
                  {/* Lesson Header */}
                  <div
                    className="w-full p-3 pl-8 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                    onClick={() => toggleLesson(lesson)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {lessonIndex + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {lesson.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDuration(getLessonDuration(lesson))}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({lesson.contents.length} items)
                      </span>
                    </div>
                  </div>

                  {/* Content: only shown if lesson is selected */}
                  {selectedLesson?._id === lesson._id && (
                    <div className="bg-gray-50">
                      {lesson.contents.map((content) => (
                        <div
                          key={content._id}
                          onClick={() => navigateToContent(content._id || "")}
                          className={`w-full p-3 pl-16 cursor-pointer transition-all duration-200 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 ${selectedContent?._id === content._id
                            ? "bg-orange-50 border-orange-200"
                            : ""
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {content.type === "video" ? (
                                  <Play className="size-4 text-orange-500" />
                                ) : (
                                  <FileText className="size-4 text-blue-500" />
                                )}
                              </div>
                              <span
                                className={`text-sm font-medium truncate ${selectedContent?._id === content._id
                                  ? "text-orange-700"
                                  : "text-gray-700"
                                  }`}
                              >
                                {content.title}
                              </span>
                              <span className="text-xs text-gray-500 uppercase">
                                {content.type}
                              </span>
                            </div>
                            {content.type === "video" && (
                              <div className="flex items-center gap-1">
                                <Clock3 className="size-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {formatDuration(getContentDuration(content))}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const PreviewCourse = (props: { course: Course }) => {
  const course = useMemo(() => ({ ...props.course }), [props.course]);
  const [width, setWidth] = useState(0);
  const [search, setSearch] = useState('');

  // Filter questions based on search
  const filteredQuestions = questionsData.filter(item =>
    item.question.toLowerCase().includes(search.toLowerCase()) ||
    item.user.name.toLowerCase().includes(search.toLowerCase()) ||
    item.user.course.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    selectedModule,
    selectedLesson,
    selectedContent,
    navigateToContent,
    toggleModule,
    toggleLesson,
    isInitialized,
  } = useLessonNavigation(course);

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
          showCount: course.modules.length,
        },
      ]
      : []),
    {
      label: "Overview",
      component: <OverviewSection course={course} />,
    },
    {
      label: `Q&A (${filteredQuestions.length})`,
      component: <QASections questions={filteredQuestions} search={search} onSearchChange={setSearch} />,
    },
    {
      label: "Notes",
      component: <Notes />,
    },
    {
      label: "Reviews",
      component: <Reviews questions={filteredQuestions} search={search} onSearchChange={setSearch} />,
    },
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

  return (
    <VideoTimeProvider>
      <div className="w-full min-h-screen flex gap-4 lg:flex-row flex-col">
        <div className="left-side w-full lg:w-7/10 h-full rounded-xl flex flex-col gap-4">
          <VideoSection
            course={course}
            selectedContent={selectedContent}
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
                  {course.modules.length}
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
    </VideoTimeProvider>
  );
};

export default memo(PreviewCourse);
