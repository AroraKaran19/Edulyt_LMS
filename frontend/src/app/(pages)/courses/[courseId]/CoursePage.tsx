"use client";
import React from "react";
import { Course } from "@/types";
import { cn } from "@/lib/utils";
import CourseHeader from "./components/CourseHeader";
import ScholarshipBanner from "./components/ScholarshipBanner";
import TestimonialSection from "./components/TestimonialSection";
import CourseOverviewSection from "./components/CourseOverviewSection";
import CourseInstructorSection from "./components/CourseInstructorSection";
import CertificateSection from "./components/CertificateSection";
import VerticalCarouselSection from "./components/VerticalCarouselSection";
import CurriculumSection from "./components/CurriculumSection";
import FAQSection from "./components/FAQSection";

const CoursePage = ({ course }: { course: Course }) => {

  return (
    <div
      className={cn(
        `${course?.slug}-course-page w-full min-h-[calc(100vh-78px)]`,
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
            <source src={`${course?.previewVideoUrl}`} type="video/mp4" />
          </video>
        </div>
        <CourseHeader course={course as Course} />
      </div>
      {course?.scholarship && <ScholarshipBanner />}
      <TestimonialSection />
      <CourseOverviewSection />
      <CourseInstructorSection course={course as Course} />
      <CertificateSection />
      <VerticalCarouselSection course={course} />
      <CurriculumSection course={course} />
      <FAQSection course={course} />
    </div>
  );
};

export default CoursePage;
