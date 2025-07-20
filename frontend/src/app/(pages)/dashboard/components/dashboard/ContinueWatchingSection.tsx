import FlexBox from "@/components/ui/FlexBox";
import { demoCourses } from "@/data/demoCourses";
import { Course } from "@/types";
import { ArrowRight } from "lucide-react";
import React from "react";
import CoursesCard1 from "./ui/CoursesCard1";

const ContinueWatchingSection = () => {
  const courses: Course[] = demoCourses;

  return (
    <>
      <FlexBox className="w-full h-full justify-between items-center">
        <h2 className="text-base font-bold">Continue Watching</h2>
        <FlexBox className="gap-2 items-center cursor-pointer select-none">
          <span className="text-sm font-semibold">View All</span>
          <ArrowRight className="size-4" />
        </FlexBox>
      </FlexBox>
      <FlexBox className="w-full h-full flex-col gap-4">
        {courses.map((course) => (
          <CoursesCard1 key={course._id} course={course} />
        ))}
      </FlexBox>
    </>
  );
};

export default ContinueWatchingSection;
