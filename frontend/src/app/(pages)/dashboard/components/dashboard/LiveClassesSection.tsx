"use client";
import { useState, useEffect, useMemo } from "react";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { LiveClass } from "@/types";
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  Video,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Error from "@/components/ui/Error";
import Loader from "@/components/ui/Loader";
import Link from "next/link";
import { ymdIst, istWallClockToUtc, formatIst } from "@/lib/ist";

// Function to detect and highlight links in text
const renderTextWithLinks = (text: string) => {
  if (!text) return null;

  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        // Check if part is a URL
        if (part.match(/^https?:\/\//)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 underline font-medium"
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

const LiveClassesSection = () => {
  const { getStudentLiveClasses, isLoading, error } = useLiveClasses();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);

  useEffect(() => {
    const fetchLiveClasses = async () => {
      const result = await getStudentLiveClasses(1, 10);
      if (result) {
        setLiveClasses(result.liveClasses);
      }
    };

    fetchLiveClasses();
  }, [getStudentLiveClasses]);

  // A class is on IST calendar day `date` at IST time `time` (HH:mm). Resolve to
  // the true UTC instant so comparisons/display are correct in any timezone.
  const liveClassInstant = (
    date: Date | string,
    time: string,
  ): Date | null => {
    const ymd = ymdIst(date);
    if (!ymd) return null;
    const [y, m, d] = ymd.split("-").map(Number);
    const [hh, mm] = (time ?? "").split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return istWallClockToUtc(y, m, d, hh, mm);
  };

  const convertToUserTimezone = (
    date: Date | string,
    time: string
  ): { dateTime: Date; formatted: string } => {
    const dt = liveClassInstant(date, time);
    if (!dt) return { dateTime: new Date(NaN), formatted: "" };
    const formatted = formatIst(dt, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    })
      .replace(/GMT[+-]\d{1,2}:\d{2}/g, "IST")
      .replace(/GMT/g, "IST");
    return { dateTime: dt, formatted };
  };

  const getLiveClassStatus = (liveClass: LiveClass) => {
    const now = Date.now();
    const start = liveClassInstant(liveClass.startDate, liveClass.startTime);
    const end = liveClassInstant(liveClass.endDate, liveClass.endTime);

    if (start && end && start.getTime() <= now && end.getTime() >= now) {
      return {
        status: "ongoing",
        label: "Live Now",
        color: "bg-green-100 text-green-800",
      };
    } else if (start && start.getTime() > now) {
      return {
        status: "scheduled",
        label: "Scheduled",
        color: "bg-blue-100 text-blue-800",
      };
    } else {
      return {
        status: "completed",
        label: "Completed",
        color: "bg-gray-100 text-gray-800",
      };
    }
  };

  // Filter to show only scheduled and ongoing classes
  const visibleLiveClasses = useMemo(() => {
    return liveClasses.filter((liveClass) => {
      const status = getLiveClassStatus(liveClass);
      return status.status === "scheduled" || status.status === "ongoing";
    });
  }, [liveClasses]);

  // Show only the first class on dashboard
  const displayedClasses = visibleLiveClasses.slice(0, 1);
  const hasMoreClasses = visibleLiveClasses.length > 1;

  if (isLoading) {
    return <Loader size="lg" variant="spinner" />;
  }

  if (error) {
    return (
      <Error
        icon={AlertCircle}
        iconSize="lg"
        iconColor="text-red-500"
        title="Error"
        description={error as string || "Something went wrong"}
      />
    );
  }

  if (visibleLiveClasses.length === 0) {
    return null; // Don't show section if no live classes
  }

  const course = (liveClass: LiveClass) =>
    typeof liveClass.course === "object" ? liveClass.course : null;
  const instructor = (liveClass: LiveClass) =>
    typeof liveClass.instructor === "object" ? liveClass.instructor : null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Live Classes</h2>
        {hasMoreClasses && (
          <Link
            href="/dashboard/live-classes"
            className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <span>See All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {displayedClasses.map((liveClass) => {
          const status = getLiveClassStatus(liveClass);
          const startInfo = convertToUserTimezone(
            liveClass.startDate,
            liveClass.startTime
          );
          const endInfo = convertToUserTimezone(
            liveClass.endDate,
            liveClass.endTime
          );
          const courseData = course(liveClass);
          const instructorData = instructor(liveClass);

          return (
            <div
              key={liveClass._id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {liveClass.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {liveClass.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {renderTextWithLinks(liveClass.description)}
                    </p>
                  )}

                  <div className="space-y-2">
                    {courseData && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span>{courseData.title}</span>
                      </div>
                    )}

                    {instructorData && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          {instructorData.firstName} {instructorData.lastName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Starts: {startInfo.formatted}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Ends: {endInfo.formatted}</span>
                    </div>
                  </div>
                </div>

                {liveClass.imageUrl && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
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
        })}
      </div>
    </div>
  );
};

export default LiveClassesSection;
