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
        limit: 5,
        status: "active", // Only active enrollments for continue watching
        sortBy: "recent", // Most recently accessed
      });

      if (result) {
        // Filter courses with progress > 0 and < 100 (in progress)
        const inProgressCourses = result.enrollments.filter((enrollment) => {
          const progress = calculateProgress(enrollment);
          return progress > 0 && progress < 100;
        });
        setContinueWatchingCourses(inProgressCourses);
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
        <div className="flex gap-1 sm:gap-2 items-center cursor-pointer select-none hover:opacity-80 transition-opacity">
          <span className="text-xs sm:text-sm font-semibold">View All</span>
          <ArrowRight className="size-3 sm:size-4" />
        </div>
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
