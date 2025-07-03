"use client";
import React from "react";
import CoursesCarousel from "./CoursesCarousel";
import { useCourseFilter } from "@/contexts/CourseFilterProvider";
import { Loader2 } from "lucide-react";

const TopCoursesSection = () => {
  const { courses, isFetching } = useCourseFilter();

  return (
    <section className="top-courses-section w-full bg-white rounded-2xl py-10 flex flex-col items-center">
      <h1 className="text-lg font-normal text-[#2B1508]">Courses</h1>
      <h2 className="text-[44px] mt-3 text-[#2B1508] font-coolvetica leading-tight text-center text-wrap-balance">
        Our Best <span className="text-[#f77124]">Courses</span> <br />
        you can Enroll now!
      </h2>
      <div className="top-courses-carousel w-full mt-10">
        {isFetching ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <CoursesCarousel courses={courses} />
        )}
      </div>
    </section>
  );
};

export default TopCoursesSection;
