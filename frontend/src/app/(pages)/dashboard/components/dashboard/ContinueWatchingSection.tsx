"use client";
import { AlertCircle, ArrowRight } from "lucide-react";
import CoursesCard1 from "./ui/CoursesCard1";
import useUserEnrollments from "@/hooks/useUserEnrollments";
import { Enrollment } from "@/types/enrollment";
import { Course } from "@/types";
import Error from "@/components/ui/Error";
import Loader from "@/components/ui/Loader";
import { useEffect, useState } from "react";

const ContinueWatchingSection = () => {
  const { getUserEnrollments, isLoading, error, calculateProgress } =
    useUserEnrollments();
  const [continueWatchingCourses, setContinueWatchingCourses] = useState<
    Enrollment[]
  >([]);

  useEffect(() => {
    const fetchContinueWatching = async () => {
      const result = await getUserEnrollments({
        page: 1,
        limit: 10, // Fetch more to have better selection
        status: "active", // Only active enrollments for continue watching
        sortBy: "recent", // Most recently accessed
      });

      if (result) {
        // Filter courses that are in progress
        // A course is "in progress" if:
        // 1. Progress is < 100 (not completed), AND
        // 2. (Has completed contents OR has lastActivityAt OR progress > 0)
        const inProgressCourses = result.enrollments.filter((enrollment) => {
          // Skip deleted/unlinked courses — these belong only under My Programs,
          // not on the Home dashboard.
          if (!enrollment.courseId || typeof enrollment.courseId !== "object")
            return false;

          // Same for deactivated courses: there is nothing to continue, so they
          // stay under My Programs rather than taking a Continue Watching slot.
          if ((enrollment.courseId as Course).isActive === false) return false;

          // Check if enrollment has progress data
          const progress = calculateProgress(enrollment);
          
          // Exclude completed courses (progress >= 100)
          if (progress >= 100) return false;
          
          // Include if user has any activity:
          // - Has completed contents (user has started)
          // - Has lastActivityAt (user has accessed it)
          // - Progress > 0 (user has made progress)
          const hasCompletedContents = enrollment.completedContents && enrollment.completedContents.length > 0;
          const hasActivity = enrollment.lastActivityAt || enrollment.progress?.lastActivityAt;
          const hasProgress = progress > 0;
          
          return hasCompletedContents || hasActivity || hasProgress;
        });
        
        // Sort by most recent activity (lastActivityAt or progress.lastActivityAt) and take top 3
        const sortedCourses = inProgressCourses.sort((a, b) => {
          // Use lastActivityAt from enrollment or from progress object
          const dateA = a.lastActivityAt
            ? new Date(a.lastActivityAt).getTime()
            : a.progress?.lastActivityAt
            ? new Date(a.progress.lastActivityAt).getTime()
            : a.enrolledAt
            ? new Date(a.enrolledAt).getTime()
            : 0;
          const dateB = b.lastActivityAt
            ? new Date(b.lastActivityAt).getTime()
            : b.progress?.lastActivityAt
            ? new Date(b.progress.lastActivityAt).getTime()
            : b.enrolledAt
            ? new Date(b.enrolledAt).getTime()
            : 0;
          return dateB - dateA; // Most recent first
        });
        // Limit to top 3 courses
        setContinueWatchingCourses(sortedCourses.slice(0, 3));
      }
    };

    fetchContinueWatching();
  }, [getUserEnrollments, calculateProgress]);

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
        description="Error loading continue watching courses"
      />
    );
  }

  return (
    <>
      <div className="flex w-full justify-between items-center text-text-primary">
        <h2 className="text-sm sm:text-base font-bold">Continue Watching</h2>
        <a
          href="/dashboard/courses"
          className="flex gap-1 sm:gap-2 items-center cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          <span className="text-xs sm:text-sm font-semibold">View All</span>
          <ArrowRight className="size-3 sm:size-4" />
        </a>
      </div>
      <div className="flex w-full flex-col gap-2 sm:gap-3 md:gap-4">
        {continueWatchingCourses.length > 0 ? (
          continueWatchingCourses.map((enrollment, index) => (
            <CoursesCard1
              key={`${enrollment._id}-${index}`}
              course={enrollment.courseId as Course}
              enrollment={enrollment}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No courses in progress</p>
            <p className="text-xs mt-1">Start a course to see it here</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ContinueWatchingSection;
