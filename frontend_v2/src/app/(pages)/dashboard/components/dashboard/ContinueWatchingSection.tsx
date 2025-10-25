"use client";
import { AlertCircle, ArrowRight } from "lucide-react";
import CoursesCard1 from "./ui/CoursesCard1";
import useSWR from "swr";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { Course } from "@/types";
import Error from "@/components/ui/Error";
import Loader from "@/components/ui/Loader";

const ContinueWatchingSection = () => {
  const {
    data: courses,
    isLoading,
    error,
  } = useSWR(ENDPOINTS.courses.all, fetcher);

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
        description="Error loading courses"
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
        {courses?.data?.data?.courses.map((course: Course, index: number) => (
          <CoursesCard1 key={index} course={course} />
        ))}
      </div>
    </>
  );
};

export default ContinueWatchingSection;
