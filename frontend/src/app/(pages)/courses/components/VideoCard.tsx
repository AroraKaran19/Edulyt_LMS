"use client";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Content, CourseLesson, VideoContent } from "@/types";
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Play,
  Clock,
  HelpCircle,
  FileText,
} from "lucide-react";
import { LockIcon } from "../../../../../public/icons";
import ImageComponent from "@/components/ui/ImageComponent";
import { useRouter } from "next/navigation";

const VideoCard = ({
  lesson,
  index,
  currentModuleImage,
  isEnrolled = false,
  courseSlug,
  ...props
}: {
  lesson: CourseLesson;
  currentModuleImage: string;
  index: number;
  isEnrolled?: boolean;
  courseSlug?: string;
} & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const router = useRouter();
  const totalDuration =
    lesson.contents?.reduce((acc, content) => {
      if (
        (content as VideoContent).type === "video" &&
        (content as VideoContent).duration
      ) {
        return acc + ((content as VideoContent).duration || 0);
      }
      return acc;
    }, 0) || 0;

  return (
    <div
      className={cn(
        "video-card w-full min-h-[150px] flex flex-col gap-4 p-3 rounded-2xl border border-gray-200",
        props.className
      )}
    >
      {/* Lesson Header */}
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <div className="video-thumbnail w-full max-h-[200px] md:max-h-auto md:w-1/3 rounded-2xl overflow-hidden relative aspect-video">
          <ImageComponent
            src={currentModuleImage || "/CourseCardDemo.jpg"}
            alt={`${lesson.title} Image`}
            fill
            quality={100}
            className="w-full h-full object-cover select-none"
            draggable={false}
          />
          <div className="video-play-button absolute top-3 left-3 bg-white/80 rounded-lg p-1 flex items-center justify-center">
            <span className="text-sm md:text-base font-bold text-black">
              {lesson.contents?.length ?? 0} Content
              {lesson.contents?.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="video-content w-full md:w-2/3 flex flex-col md:flex-row gap-2 shrink-0">
          <div className="text-content w-full md:w-2/3 flex flex-col gap-2">
            <p className="chapter-number text-base text-gray-500">
              Lesson {index + 1}
            </p>
            <p className="video-title text-lg font-bold wrap-break-words line-clamp-2">
              {lesson.title}
            </p>
            <p className="video-description text-sm text-gray-500 line-clamp-3">
              {lesson.description}
            </p>
            <p className="video-duration text-sm text-gray-500 mt-auto">
              {formatDuration(totalDuration)}
            </p>
          </div>
          <div className="video-purchase-button w-full md:w-1/3 flex flex-col gap-2 mt-auto">
            {isEnrolled && courseSlug ? (
              <OrangeButton
                className="w-full"
                glow={false}
                onClick={() => router.push(`/courses/${courseSlug}/watch`)}
              >
                <span className="flex items-center justify-center gap-2">
                  <Play className="size-5" />
                  <p>Play</p>
                </span>
              </OrangeButton>
            ) : (
              <OrangeButton
                className="w-full bg-orange-500/30 cursor-not-allowed"
                glow={false}
              >
                <span className="flex items-center justify-center gap-2">
                  <LockIcon className="size-5" />
                  <p>Play</p>
                </span>
              </OrangeButton>
            )}
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="lessons-list space-y-2 pl-4 border-l-2 border-orange-200">
        {(lesson.contents as Content[])?.map((content, contentIndex) => {
          const contentDuration = (content as VideoContent).duration || 0;

          return (
            <div
              key={contentIndex}
              className="content-item p-3 bg-white border border-gray-100 rounded-lg hover:border-orange-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {content.type === "video" ? (
                      <Play className="w-4 h-4 text-orange-500" />
                    ) : content.type === "quiz" ? (
                      <HelpCircle className="w-4 h-4 text-orange-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-orange-500" />
                    )}
                    <h4 className="text-sm font-medium text-gray-800">
                      {content.title}
                    </h4>
                  </div>
                  {content.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {content.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {contentDuration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(contentDuration)}
                      </span>
                    )}
                  </div>
                </div>
                {!isEnrolled && (
                  <div className="flex items-center gap-1 text-xs">
                    <LockIcon className="size-5 text-black" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoCard;
