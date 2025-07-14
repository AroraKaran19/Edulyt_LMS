import CourseTitle from "@/components/ui/course/CourseTitle";
import SectionContainer from "@/components/ui/course/SectionContainer";
import { Course } from "@/types";
import React from "react";
import InstructorCarousel from "../../components/InstructorCarousel";

const CourseInstructorSection = ({ course }: { course: Course }) => {
  return (
    <SectionContainer id="course-instructor">
      <div className="course-instructor-header w-full flex flex-col items-center gap-4">
        <CourseTitle
          title="Get Access to industry top leader"
          className="text-2xl md:text-4xl text-[#2B1508] text-center text-balance"
        />
        <h3 className="text-base text-black text-center">
          {course.shortDescription}
        </h3>
      </div>
      <div className="instructor-carousel w-full">
        <InstructorCarousel instructors={course?.instructor || []} />
      </div>
    </SectionContainer>
  );
};

export default CourseInstructorSection;
