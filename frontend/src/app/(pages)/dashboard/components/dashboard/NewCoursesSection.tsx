import FlexBox from "@/components/ui/FlexBox";
import { demoCourses } from "@/data/demoCourses";
import { Course } from "@/types";
import { ArrowRight } from "lucide-react";
import React from "react";
import CoursesCard2 from "./ui/CourseCard2";

const NewCoursesSection = () => {

	const courses: Course[] = demoCourses;

  return (
    <FlexBox className="w-full h-full flex-col gap-4">
      <FlexBox className="w-full h-full justify-between items-center">
        <h2 className="text-base font-bold">New Courses</h2>
        <FlexBox className="gap-2 items-center cursor-pointer select-none">
          <span className="text-sm font-semibold">View All</span>
          <ArrowRight className="size-4" />
        </FlexBox>
      </FlexBox>
			<div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{[...courses, ...courses].map((course, index) => (
					<CoursesCard2 key={index} course={course} />
				))}
			</div>
    </FlexBox>
  );
};

export default NewCoursesSection;
