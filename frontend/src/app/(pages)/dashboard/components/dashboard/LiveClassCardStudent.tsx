"use client";

import React from "react";
import type { StudentLiveClassItem } from "@/types/live-classes";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  PlayCircle,
  User,
  Video,
} from "lucide-react";
import { formatIstDateTime } from "@/lib/ist";
import { useNow } from "@/hooks/useNow";

/** Renders plain text, turning bare URLs into links. */
export const renderTextWithLinks = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 underline font-medium"
          >
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
};

const STATUS_STYLES = {
  upcoming: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
  live: { label: "Live Now", className: "bg-green-100 text-green-800" },
  ended: { label: "Ended", className: "bg-gray-100 text-gray-700" },
} as const;

type TimingStatus = keyof typeof STATUS_STYLES;

/** Schedule status as of `now`, so the chip stays truthful on its own. */
export function timingStatus(
  startIso: string,
  endIso: string,
  now: number,
): TimingStatus {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isFinite(start) && now < start) return "upcoming";
  if (Number.isFinite(end) && now > end) return "ended";
  return "live";
}

/**
 * Learner-facing summary of one live class: when it runs, how to join, the
 * recording once it exists, and their own attendance state.
 *
 * The attendance links themselves are never shown here — the instructor drops
 * them into the call, and opening one lands on /live-class/attend/[token].
 * This card only reflects which of the two have been registered.
 */
const LiveClassCardStudent: React.FC<{
  liveClass: StudentLiveClassItem;
  compact?: boolean;
}> = ({ liveClass, compact = false }) => {
  const now = useNow();
  const status =
    STATUS_STYLES[
      timingStatus(liveClass.startDateTime, liveClass.endDateTime, now)
    ];

  const bothClicked = liveClass.link1Clicked && liveClass.link2Clicked;
  const anyActivated = liveClass.phase !== "not-activated";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Video className="w-5 h-5 text-orange-600 shrink-0" />
            <h3
              className={`font-semibold text-gray-900 ${compact ? "text-lg" : "text-xl"}`}
            >
              {liveClass.title}
            </h3>
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          {liveClass.description && (
            <p
              className={`text-sm text-gray-600 mb-3 ${compact ? "line-clamp-2" : ""}`}
            >
              {renderTextWithLinks(liveClass.description)}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
            {liveClass.course?.title && (
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="truncate">{liveClass.course.title}</span>
              </div>
            )}
            {liveClass.instructor && (
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {`${liveClass.instructor.firstName ?? ""} ${liveClass.instructor.lastName ?? ""}`.trim() ||
                    liveClass.instructor.email}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 sm:col-span-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {formatIstDateTime(liveClass.startDateTime)} –{" "}
                {formatIstDateTime(liveClass.endDateTime)} IST
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {liveClass.meetingLink && (
              <a
                href={liveClass.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                <Video className="w-4 h-4" />
                Join class
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {liveClass.recordingLink && (
              <a
                href={liveClass.recordingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                <PlayCircle className="w-4 h-4" />
                Watch recording
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {anyActivated && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {bothClicked ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Attendance complete — both links registered
                </span>
              ) : (
                <>
                  <span
                    className={
                      liveClass.link1Clicked
                        ? "text-green-700 font-medium"
                        : "text-gray-500"
                    }
                  >
                    Attendance 1: {liveClass.link1Clicked ? "done" : "not yet"}
                  </span>
                  <span
                    className={
                      liveClass.link2Clicked
                        ? "text-green-700 font-medium"
                        : "text-gray-500"
                    }
                  >
                    Attendance 2: {liveClass.link2Clicked ? "done" : "not yet"}
                  </span>
                  <span className="text-gray-400">
                    Open both links shared during the class to be marked present.
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {liveClass.imageUrl && (
          <div
            className={`rounded-lg overflow-hidden shrink-0 hidden sm:block ${
              compact ? "w-24 h-24" : "w-32 h-32"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={liveClass.imageUrl}
              alt={liveClass.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClassCardStudent;
