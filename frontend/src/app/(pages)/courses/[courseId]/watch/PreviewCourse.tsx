"use client";
import { Course, CourseLesson, CourseModule } from "@/types";
import React, { memo, useEffect, useMemo, useState } from "react";
import SectionContainer from "./components/SectionContainer";
import WhiteButton from "@/components/ui/WhiteButton";
import { Clock3 } from "lucide-react";
import dynamic from "next/dynamic";
import { useLessonNavigation } from "./hooks/useLessonNavigation";
import { formatDuration } from "@/lib/formatDuration";
import {
  VideoTimeProvider,
  useVideoTimeContext,
} from "./context/VideoTimeContext";
import TabSwitcher from "@/components/ui/course/TabSwitcher";
import OverviewSection from "./components/OverviewSection";

const VideoPlayer = dynamic(() => import("./components/VideoPlayer"), {
  ssr: false,
});

const VideoSection = ({
  course,
  selectedLesson,
}: {
  course: Course;
  selectedLesson: CourseLesson | null;
}) => {
  const { connectToVideo } = useVideoTimeContext();

  const videoSources = useMemo(() => {
    if (!selectedLesson?.content) return [];
    
    // Extract all video sources from lesson content
    const allVideoSources: Array<{ quality: string; src: string }> = [];
    
    selectedLesson.content.forEach(content => {
      if (content.type === 'video' && Array.isArray(content.content)) {
        content.content.forEach(video => {
          if ('sources' in video && Array.isArray(video.sources)) {
            video.sources.forEach(source => {
              allVideoSources.push({
                quality: source.quality,
                src: source.videoUrl
              });
            });
          }
        });
      }
    });
    
    return allVideoSources;
  }, [selectedLesson?.content]);

  const handleVideoReady = (video: HTMLVideoElement) => {
    connectToVideo(video);
    // Autoplay the video after it's ready
    video.play().catch((error) => {
      console.log("Autoplay failed:", error);
      // Autoplay might fail due to browser policies, expected
    });
  };

  return (
    <SectionContainer id="video-player" className="w-full aspect-video">
      <VideoPlayer
        key={selectedLesson?._id || "no-lesson"}
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
  toggleModule,
  navigateToLesson,
  selectedLesson,
}: {
  course: Course;
  selectedModule: CourseModule | null;
  toggleModule: (module: CourseModule) => void;
  navigateToLesson: (lessonId: string) => void;
  selectedLesson: CourseLesson | null;
}) => {
  return course.modules.map((module, index) => (
    <div
      className={`w-full h-full flex flex-col gap-3 ${
        index !== course.modules.length - 1
          ? "pb-3 border-b border-gray-200"
          : ""
      }`}
      key={index}
    >
      <div
        className="w-full h-full flex flex-col gap-2 relative cursor-pointer"
        onClick={() => toggleModule(module)}
      >
        <span className="text-xs font-normal text-gray-500">
          Module {index + 1}
        </span>
        <span className="text-base font-bold">{module.title}</span>
        <div className="absolute top-0 right-0 flex items-center gap-1 bg-black/8 rounded-md px-2 py-1">
          <Clock3 className="size-4 fill-black text-white" />
          <span className="text-xs font-normal text-gray-500">
            {formatDuration(module.lessons.reduce((acc, lesson) => acc + (lesson.content.reduce((contentAcc, content) => {
              if (content.type === 'video' && Array.isArray(content.content)) {
                return contentAcc + content.content.reduce((videoAcc, video) => videoAcc + ('duration' in video ? video.duration || 0 : 0), 0);
              }
              return contentAcc;
            }, 0) || 0), 0))}
          </span>
        </div>
      </div>
      {/* Lessons: only shown if module is selected */}
      {selectedModule?._id === module._id && (
        <div className="w-full mt-2 space-y-1">
          {module.lessons.map((lesson, lessonIndex) => (
            <div
              key={lesson._id}
              onClick={() => navigateToLesson(lesson._id)} // Lesson click triggers navigation
              className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100 border border-transparent hover:border-gray-200 ${
                selectedLesson?._id === lesson._id
                  ? "bg-orange-50 border-orange-200 shadow-sm"
                  : "bg-gray-50/50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      selectedLesson?._id === lesson._id
                        ? "bg-orange-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {lessonIndex + 1}
                  </div>
                  <span
                    className={`text-sm font-medium truncate ${
                      selectedLesson?._id === lesson._id
                        ? "text-orange-700"
                        : "text-gray-700"
                    }`}
                  >
                    {lesson.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Clock3 className="size-3 text-gray-400" />
                  <span className="text-xs font-normal text-gray-500">
                    {formatDuration(lesson.content.reduce((contentAcc, content) => {
                      if (content.type === 'video' && Array.isArray(content.content)) {
                        return contentAcc + content.content.reduce((videoAcc, video) => videoAcc + ('duration' in video ? video.duration || 0 : 0), 0);
                      }
                      return contentAcc;
                    }, 0) || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ));
};

const PreviewCourse = (props: { course: Course }) => {
  const course = useMemo(() => ({ ...props.course }), [props.course]);
  const [width, setWidth] = useState(0);

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
    navigateToLesson,
    toggleModule,
    isInitialized,
  } = useLessonNavigation(course);

	const tabs = [
    ...(width < 1024
      ? [
          {
            label: "Course Content",
            component: <CourseContentSection
              course={course}
              selectedModule={selectedModule}
              toggleModule={toggleModule}
              navigateToLesson={navigateToLesson}
              selectedLesson={selectedLesson}
            />,
            showCount: course.modules.length,
          },
        ]
      : []),
    {
      label: "Overview",
      component: <OverviewSection course={course} />,
    },
    {
      label: "Q&A",
      component: <div>Q&A</div>,
    },
    {
      label: "Notes",
      component: <div>Notes</div>,
    },
    {
      label: "Reviews",
      component: <div>Reviews</div>,
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
          <VideoSection course={course} selectedLesson={selectedLesson || null} />
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
              toggleModule={toggleModule}
              navigateToLesson={navigateToLesson}
              selectedLesson={selectedLesson}
            />
          </SectionContainer>
        </div>
      </div>
    </VideoTimeProvider>
  );
};

export default memo(PreviewCourse);
