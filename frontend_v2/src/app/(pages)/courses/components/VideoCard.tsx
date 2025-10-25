import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Content, CourseLesson, CourseModule } from "@/types";
import Image from "next/image";
import React, { useState } from "react";
import { ChevronDown, ChevronUp, Play, Clock } from "lucide-react";

const VideoCard = ({
  module,
  index,
  ...props
}: {
  module: CourseModule;
  index: number;
} & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [showLessons, setShowLessons] = useState(false);

  const totalDuration =
    (module.lessons as CourseLesson[])?.reduce(
      (moduleAcc, lesson) =>
        moduleAcc +
        ((lesson.contents as Content[])?.reduce((lessonAcc, content) => {
          if (content.type === "video" && content.duration) {
            return lessonAcc + (content.duration || 0);
          }
          return lessonAcc;
        }, 0) || 0),
      0
    ) || 0;

  return (
    <div
      className={cn(
        "video-card w-full min-h-[150px] flex flex-col gap-4 p-3 rounded-2xl border border-gray-200",
        props.className
      )}
    >
      {/* Module Header */}
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <div className="video-thumbnail w-full max-h-[200px] md:max-h-auto md:w-1/3 rounded-2xl overflow-hidden relative aspect-video">
          <Image
            src={module.thumbnailUrl || "/CourseCardDemo.jpg"}
            alt={module.title}
            fill
            quality={100}
            className="w-full h-full object-cover select-none"
            draggable={false}
          />
          <div className="video-play-button absolute top-3 left-3 bg-white/80 rounded-lg p-1 flex items-center justify-center">
            <span className="text-sm md:text-base font-bold text-black">
              {module.lessons?.length ?? 0} Lessons
            </span>
          </div>
        </div>
        <div className="video-content w-full md:w-2/3 flex flex-col md:flex-row gap-2 shrink-0">
          <div className="text-content w-full md:w-2/3 flex flex-col gap-2">
            <p className="chapter-number text-base text-gray-500">
              Module {index + 1}
            </p>
            <p className="video-title text-lg font-bold wrap-break-words line-clamp-2">
              {module.title}
            </p>
            <p className="video-description text-sm text-gray-500 line-clamp-3">
              {module.description}
            </p>
            <p className="video-duration text-sm text-gray-500 mt-auto">
              {formatDuration(totalDuration)}
            </p>
          </div>
          <div className="video-purchase-button w-full md:w-1/3 flex flex-col gap-2 mt-auto">
            <OrangeButton
              className="w-full bg-orange-500/30 cursor-not-allowed"
              glow={false}
            >
              <span className="flex items-center justify-center gap-2">
                <Image
                  src="/Lock.svg"
                  alt="Lock Icon"
                  width={20}
                  height={20}
                  className="size-5 lg:size-6"
                />
                <p>Play</p>
              </span>
            </OrangeButton>
          </div>
        </div>
      </div>

      {/* Lessons Toggle Button */}
      <button
        onClick={() => setShowLessons(!showLessons)}
        className="flex items-center justify-between w-full p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">
          {showLessons ? "Hide" : "Show"} Lessons ({module.lessons?.length ?? 0}
          )
        </span>
        {showLessons ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Lessons List */}
      {showLessons && (
        <div className="lessons-list space-y-2 pl-4 border-l-2 border-orange-200">
          {(module.lessons as CourseLesson[])?.map((lesson, lessonIndex) => {
            const lessonDuration =
              (lesson.contents as Content[])?.reduce((acc, content) => {
                if (content.type === "video" && content.duration) {
                  return acc + content.duration;
                }
                return acc;
              }, 0) || 0;

            return (
              <div
                key={lesson._id || lessonIndex}
                className="lesson-item p-3 bg-white border border-gray-100 rounded-lg hover:border-orange-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Play className="w-4 h-4 text-orange-500" />
                      <h4 className="text-sm font-medium text-gray-800">
                        Lesson {lessonIndex + 1}: {lesson.title}
                      </h4>
                    </div>
                    {lesson.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {lessonDuration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(lessonDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Image
                      src="/Lock.svg"
                      alt="Locked"
                      width={12}
                      height={12}
                      className="opacity-50"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoCard;
