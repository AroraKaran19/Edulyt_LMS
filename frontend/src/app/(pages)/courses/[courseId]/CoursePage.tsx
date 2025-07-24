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
import VideoPlayer from "./watch/components/VideoPlayer";

const CoursePage = ({ course }: { course: Course }) => {
  return (
    <div
      className={cn(
        `${course?.slug}-course-page w-full min-h-[calc(100dvh-78px)]`,
        "flex flex-col items-center gap-6"
      )}
    >
      <div className="course-header w-full h-auto bg-white rounded-2xl py-4 px-4 lg:px-[13%] md:py-8 flex flex-col items-center">
        <div className="course-preview-video w-full mt-2 flex flex-col items-center">
          <VideoPlayer
            sources={[
              {
                quality: "1080p",
                src: course?.previewVideoUrl || "/demoVideo.mp4",
              },
            ]}
            posterUrl={course?.previewVideoUrl || "/courseVideoDemoPoster.png"}
            className="w-full min-h-[200px] max-h-[270px] rounded-xl object-cover"
          />
        </div>
        <CourseHeader course={course} />
      </div>
      {course?.scholarship && <ScholarshipBanner />}
      <TestimonialSection testimonials={course?.featuredReviews || []} />
      <CourseOverviewSection course={course} />
      <CourseInstructorSection course={course} />
      <CertificateSection course={course} />
      <VerticalCarouselSection />
      <CurriculumSection course={course} />
      <FAQSection course={course} />
    </div>
  );
};

export default CoursePage;
