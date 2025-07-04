"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { useParams } from "next/navigation";
import { useCourseFilter } from "@/contexts/CourseFilterProvider";
import CourseHeader from "./components/CourseHeader";
import { Course } from "@/types";
import ScholarshipBanner from "./components/ScholarshipBanner";
import TestimonialSection from "./components/TestimonialSection";

const CoursePage = () => {
  const params = useParams();
  const courseSlug = params.courseId as string;
  const { courses } = useCourseFilter();
  const course = courses.find((course) => course.slug === courseSlug) as Course;

  return (
    <div
      className={cn(
        `${courseSlug}-course-page w-full min-h-screen`,
        "flex flex-col items-center gap-6"
      )}
    >
      <div className="course-header w-full h-auto bg-white rounded-2xl py-4 px-4 lg:px-[13%] md:py-8 flex flex-col items-center">
        <div className="course-preview-video w-full mt-2 flex flex-col items-center">
          <video
            className="w-full max-h-[270px] rounded-xl object-cover"
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
    </div>
  );
};

export default CoursePage;
