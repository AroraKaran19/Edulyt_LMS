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
  ArrowLeft,
} from "lucide-react";
import Error from "@/components/ui/Error";
import Loader from "@/components/ui/Loader";
import Link from "next/link";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
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

const LiveClassesPage = () => {
  const { getStudentLiveClasses, isLoading, error } = useLiveClasses();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchLiveClasses = async () => {
      const result = await getStudentLiveClasses(currentPage, 10);
      if (result) {
        setLiveClasses(result.liveClasses);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      }
    };

    fetchLiveClasses();
  }, [getStudentLiveClasses, currentPage]);

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
    time: string,
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

  const course = (liveClass: LiveClass) =>
    typeof liveClass.course === "object" ? liveClass.course : null;
  const instructor = (liveClass: LiveClass) =>
    typeof liveClass.instructor === "object" ? liveClass.instructor : null;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader size="lg" variant="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Error
          icon={AlertCircle}
          iconSize="lg"
          iconColor="text-red-500"
          title="Error"
          description={error as string}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-gray-600 mt-2">
            View all scheduled and ongoing live classes for your enrolled
            courses
          </p>
        </div>

        {/* Live Classes List */}
        {visibleLiveClasses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Live Classes Available
            </h3>
            <p className="text-gray-600">
              You don't have any scheduled or ongoing live classes at the
              moment.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {visibleLiveClasses.map((liveClass) => {
                const status = getLiveClassStatus(liveClass);
                const startInfo = convertToUserTimezone(
                  liveClass.startDate,
                  liveClass.startTime,
                );
                const endInfo = convertToUserTimezone(
                  liveClass.endDate,
                  liveClass.endTime,
                );
                const courseData = course(liveClass);
                const instructorData = instructor(liveClass);

                return (
                  <div
                    key={liveClass._id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Video className="w-5 h-5 text-orange-600" />
                          <h3 className="text-xl font-semibold text-gray-900">
                            {liveClass.title}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        {liveClass.description && (
                          <p className="text-sm text-gray-600 mb-4">
                            {renderTextWithLinks(liveClass.description)}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {courseData && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <BookOpen className="w-4 h-4" />
                              <span className="font-medium">Course:</span>
                              <span>{courseData.title}</span>
                            </div>
                          )}

                          {instructorData && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span className="font-medium">Instructor:</span>
                              <span>
                                {instructorData.firstName}{" "}
                                {instructorData.lastName}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">Starts:</span>
                            <span>{startInfo.formatted}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">Ends:</span>
                            <span>{endInfo.formatted}</span>
                          </div>
                        </div>
                      </div>

                      {liveClass.imageUrl && (
                        <div className="w-32 h-32 rounded-lg overflow-hidden shrink-0">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <WhiteButton
                  glow={false}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </WhiteButton>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <OrangeButton
                  glow={false}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </OrangeButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LiveClassesPage;
