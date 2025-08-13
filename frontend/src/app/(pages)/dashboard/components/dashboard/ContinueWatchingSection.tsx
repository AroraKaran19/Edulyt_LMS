import FlexBox from "@/components/ui/FlexBox";
import { Course } from "@/types";
import { ArrowRight } from "lucide-react";
import React from "react";
import CoursesCard1 from "./ui/CoursesCard1";

const ContinueWatchingSection = () => {
  const courses: Course[] = [];

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
        {courses.slice(0, 3).map((course) => (
          <CoursesCard1 key={course._id} course={course} />
        ))}
      </FlexBox>
    </>
  );
};

export default ContinueWatchingSection;
