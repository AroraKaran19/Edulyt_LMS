"use client";

import { useState, useEffect, useMemo } from "react";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import type { StudentLiveClassItem } from "@/types/live-classes";
import { Video, AlertCircle, ArrowLeft, Lock } from "lucide-react";
import Error from "@/components/ui/Error";
import Loader from "@/components/ui/Loader";
import Link from "next/link";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import LiveClassCardStudent, {
  timingStatus,
} from "../components/dashboard/LiveClassCardStudent";
import { useNow } from "@/hooks/useNow";

type Tab = "upcoming" | "past";

const PAGE_SIZE = 10;

const LiveClassesPage = () => {
  const { getStudentLiveClasses, isLoading, error } = useLiveClasses();
  const [liveClasses, setLiveClasses] = useState<StudentLiveClassItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState<Tab>("upcoming");
  /** Null until the first response, so we don't flash the upsell while loading. */
  const [hasEliteAccess, setHasEliteAccess] = useState<boolean | null>(null);
  const now = useNow();

  useEffect(() => {
    const fetchLiveClasses = async () => {
      const result = await getStudentLiveClasses(currentPage, PAGE_SIZE);
      if (result) {
        setLiveClasses(result.liveClasses);
        setTotalPages(result.totalPages);
        setHasEliteAccess(result.hasEliteAccess);
      }
    };
    fetchLiveClasses();
  }, [getStudentLiveClasses, currentPage]);

  /**
   * Split the current page by schedule. Past classes stay reachable — that's
   * where recordings and the learner's own attendance record live.
   */
  const { upcoming, past } = useMemo(() => {
    const up: StudentLiveClassItem[] = [];
    const done: StudentLiveClassItem[] = [];
    for (const lc of liveClasses) {
      if (timingStatus(lc.startDateTime, lc.endDateTime, now) === "ended") {
        done.push(lc);
      } else {
        up.push(lc);
      }
    }
    up.sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    );
    return { upcoming: up, past: done };
  }, [liveClasses, now]);

  const visible = tab === "upcoming" ? upcoming : past;

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
          description={error}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Join your sessions, catch up on recordings, and track your
            attendance. All times are shown in IST.
          </p>
        </div>

        {hasEliteAccess === false ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Lock className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Live classes aren&apos;t part of your plan
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Live classes are an Elite-plan feature. Upgrade an enrollment to
              join live sessions with your instructor, mark attendance, and
              watch the recordings afterwards.
            </p>
          </div>
        ) : (
          <>
        <div className="flex gap-2 mb-6">
          {(
            [
              ["upcoming", `Upcoming & Live (${upcoming.length})`],
              ["past", `Past (${past.length})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tab === value
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tab === "upcoming"
                ? "No upcoming live classes"
                : "No past live classes"}
            </h3>
            <p className="text-gray-600">
              {tab === "upcoming"
                ? "Nothing scheduled right now. Check back soon."
                : "Classes you've attended will appear here with their recordings."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((liveClass) => (
              <LiveClassCardStudent key={liveClass._id} liveClass={liveClass} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <WhiteButton
              glow={false}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
