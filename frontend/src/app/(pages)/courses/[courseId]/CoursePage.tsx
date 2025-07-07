"use client";
import React from "react";
import CoursePageSkeleton from "./components/CoursePageSkeleton";
import { Head } from "next/document";
import { useCourseFilter } from "@/contexts/CourseFilterProvider";
import { Course } from "@/types";
import { cn } from "@/lib/utils";
import CourseHeader from "./components/CourseHeader";
import ScholarshipBanner from "./components/ScholarshipBanner";
import TestimonialSection from "./components/TestimonialSection";
import CourseOverviewSection from "./components/CourseOverviewSection";

const CoursePage = ({ courseId }: { courseId: string }) => {
  const { courses, isFetching } = useCourseFilter();
  const course = courses.find((course) => course.slug === courseId) as Course;

  if (isFetching) {
    return <CoursePageSkeleton />;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div
      className={cn(
        `${course.slug}-course-page w-full min-h-screen`,
        "flex flex-col items-center gap-6"
      )}
    >
      <div className="course-header w-full h-auto bg-white rounded-2xl py-4 px-4 lg:px-[13%] md:py-8 flex flex-col items-center">
        <div className="course-preview-video w-full mt-2 flex flex-col items-center">
          <video
            className="w-full min-h-[200px] max-h-[270px] rounded-xl object-cover"
            controls
            poster={`/courseVideoDemoPoster.png`}
            preload="metadata"
          >
            <source
              src={`https://media.w3.org/2010/05/sintel/trailer_hd.mp4`}
              type="video/mp4"
            />
          </video>
        </div>
        <CourseHeader course={course} />
      </div>
      {course?.scholarship && <ScholarshipBanner />}
      <TestimonialSection />
      <CourseOverviewSection />
    </div>
  );
};

export default CoursePage;
