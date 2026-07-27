"use client";

import { useState, useEffect, useMemo } from "react";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import type { StudentLiveClassItem } from "@/types/live-classes";
import { AlertCircle, ArrowRight } from "lucide-react";
import Error from "@/components/ui/Error";
import Loader from "@/components/ui/Loader";
import Link from "next/link";
import LiveClassCardStudent, { timingStatus } from "./LiveClassCardStudent";
import { useNow } from "@/hooks/useNow";

const LiveClassesSection = () => {
  const { getStudentLiveClasses, isLoading, error } = useLiveClasses();
  const [liveClasses, setLiveClasses] = useState<StudentLiveClassItem[]>([]);
  const now = useNow();

  useEffect(() => {
    const fetchLiveClasses = async () => {
      const result = await getStudentLiveClasses(1, 20);
      if (result) setLiveClasses(result.liveClasses);
    };
    fetchLiveClasses();
  }, [getStudentLiveClasses]);

  /**
   * The dashboard teaser only surfaces what a learner can still act on —
   * running now first, then the soonest upcoming one. Ended classes still
   * exist (with recordings) on the full Live Classes page.
   */
  const actionable = useMemo(() => {
    const live: StudentLiveClassItem[] = [];
    const upcoming: StudentLiveClassItem[] = [];

    for (const lc of liveClasses) {
      const status = timingStatus(lc.startDateTime, lc.endDateTime, now);
      if (status === "live") live.push(lc);
      else if (status === "upcoming") upcoming.push(lc);
    }

    // The API sorts newest-first; upcoming reads better soonest-first.
    upcoming.sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    );

    return [...live, ...upcoming];
  }, [liveClasses, now]);

  if (isLoading) return <Loader size="lg" variant="spinner" />;

  if (error) {
    return (
      <Error
        icon={AlertCircle}
        iconSize="lg"
        iconColor="text-red-500"
        title="Error"
        description={error || "Something went wrong"}
      />
    );
  }

  if (actionable.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Live Classes</h2>
        <Link
          href="/dashboard/live-classes"
          className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
        >
          <span>See All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {actionable.slice(0, 1).map((liveClass) => (
          <LiveClassCardStudent
            key={liveClass._id}
            liveClass={liveClass}
            compact
          />
        ))}
      </div>
    </div>
  );
};

export default LiveClassesSection;
