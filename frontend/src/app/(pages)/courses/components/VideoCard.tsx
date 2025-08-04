import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { formatDuration } from "@/lib/formatDuration";
import { cn } from "@/lib/utils";
import { CourseModule } from "@/types";
import Image from "next/image";
import React from "react";

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
  return (
    <div
      className={cn(
        "video-card w-full min-h-[150px] flex flex-col md:flex-row items-stretch gap-4 p-3 rounded-2xl border border-gray-200",
        props.className
      )}
    >
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
            {module.lessons.length} Lessons
          </span>
        </div>
      </div>
      <div className="video-content w-full md:w-2/3 flex flex-col md:flex-row gap-2 shrink-0">
        <div className="text-content w-full md:w-2/3 flex flex-col gap-2">
          <p className="chapter-number text-base text-gray-500">
            Module {index + 1}
          </p>
          <p className="video-title text-lg font-bold break-words line-clamp-2">
            {module.title}
          </p>
          <p className="video-description text-sm text-gray-500 line-clamp-3">
            {module.description}
          </p>
          <p className="video-duration text-sm text-gray-500 mt-auto">
            {formatDuration(
              module.lessons.reduce(
                (moduleAcc, lesson) =>
                  moduleAcc +
                  lesson.content.reduce((lessonAcc, content) => {
                    if (
                      content.type === "video" &&
                      content.content &&
                      "duration" in content.content
                    ) {
                      return lessonAcc + (content.content.duration || 0);
                    }
                    return lessonAcc;
                  }, 0),
                0
              )
            )}
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
  );
};

export default VideoCard;
