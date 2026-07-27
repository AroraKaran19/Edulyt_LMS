"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Video, Lock, AlertCircle } from "lucide-react";
import useStudentCourseLiveClasses from "@/hooks/useStudentCourseLiveClasses";
import LiveClassCardStudent from "@/app/(pages)/dashboard/components/dashboard/LiveClassCardStudent";
import Loader from "@/components/ui/Loader";

interface LiveClassesSectionProps {
  courseId: string;
}

/**
 * "Live Classes" tab in the course player — the per-course counterpart to the
 * internship program page's live-meeting feed.
 *
 * Newest-first with infinite scroll: the next page is requested when a sentinel
 * below the list scrolls into view, so past classes and their recordings stay
 * reachable without pagination controls.
 */
const LiveClassesSection: React.FC<LiveClassesSectionProps> = ({ courseId }) => {
  const {
    items,
    isLoading,
    isAppending,
    hasMore,
    total,
    hasAccess,
    error,
    loadMore,
  } = useStudentCourseLiveClasses(courseId, { limit: 10 });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) void loadMore();
    },
    [loadMore],
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleIntersect, hasMore]);

  if (!hasAccess) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Live classes are an Elite plan feature
        </h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          Upgrade your enrollment to join live sessions with your instructor and
          watch the recordings afterwards.
        </p>
      </div>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="py-16 flex justify-center">
        <Loader size="lg" variant="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          No live classes yet
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Sessions scheduled for this course will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-gray-500">
        {total} {total === 1 ? "session" : "sessions"} · times shown in IST
      </p>

      {items.map((liveClass) => (
        <LiveClassCardStudent key={liveClass._id} liveClass={liveClass} />
      ))}

      {/* Sentinel — crossing into view pulls the next page. */}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      {isAppending && (
        <div className="py-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="py-2 text-center text-xs text-gray-400">
          That&apos;s all the sessions for this course.
        </p>
      )}
    </div>
  );
};

export default LiveClassesSection;
