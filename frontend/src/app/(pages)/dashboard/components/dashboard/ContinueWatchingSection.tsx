"use client";
import FlexBox from "@/components/ui/FlexBox";
import { AlertCircle, ArrowRight } from "lucide-react";
import React from "react";
import CoursesCard1 from "./ui/CoursesCard1";
import useSWR from "swr";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { Course } from "@/types";
import { Error, Loader } from "@/components/ui";

const ContinueWatchingSection = () => {
  const {
    data: courses,
    isLoading,
    error,
  } = useSWR(ENDPOINTS.courses.enrolled, fetcher);

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
      <FlexBox className="w-full h-full justify-between items-center px-3 sm:px-4 md:px-6">
        <h2 className="text-sm sm:text-base font-bold">Continue Watching</h2>
        <FlexBox className="gap-1 sm:gap-2 items-center cursor-pointer select-none hover:opacity-80 transition-opacity">
          <span className="text-xs sm:text-sm font-semibold">View All</span>
          <ArrowRight className="size-3 sm:size-4" />
        </FlexBox>
      </FlexBox>
      <FlexBox className="w-full h-full flex-col gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6">
        {courses?.map((course: Course, index: number) => (
          <CoursesCard1 key={index} course={course} />
        ))}
      </FlexBox>
    </>
  );
};

export default ContinueWatchingSection;
