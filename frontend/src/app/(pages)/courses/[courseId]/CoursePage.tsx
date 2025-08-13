"use client";
import React from "react";
import { Course } from "@/types";
import { cn } from "@/lib/utils";
import CourseHeader from "./components/CourseHeader";
import ScholarshipBanner from "./components/ScholarshipBanner";
import TestimonialSection from "./components/TestimonialSection";
import CourseOverviewSection from "./components/CourseOverviewSection";
// import CourseInstructorSection from "./components/CourseInstructorSection";
import CertificateSection from "./components/CertificateSection";
import VerticalCarouselSection from "./components/VerticalCarouselSection";
import CurriculumSection from "./components/CurriculumSection";
import FAQSection from "./components/FAQSection";
import VideoPlayer from "./watch/components/VideoPlayer";
import { usePresignedUrl } from "@/hooks/usePresignedUrl";

const CoursePage = ({ course }: { course: Course }) => {
  console.log(course);

  // Generate presigned URL for preview video if it's an S3 key
  const previewVideoUrl = course?.previewVideoUrl;
  const isS3Key = previewVideoUrl && !previewVideoUrl.startsWith('http');
  
  const { url: securePreviewUrl, isLoading: isUrlLoading } = usePresignedUrl(
    isS3Key ? previewVideoUrl : null,
    { expiresIn: 3600, autoRefresh: true }
  );

  if (!course) return null;
  return (
    <div
      className={cn(
        `${course?.slug}-course-page w-full min-h-[calc(100dvh-78px)]`,
        "flex flex-col items-center gap-6"
      )}
    >
      <div className="course-header w-full h-auto bg-white rounded-2xl py-4 px-4 lg:px-[13%] md:py-8 flex flex-col items-center">
        <div className="course-preview-video w-full mt-2 flex flex-col items-center">
          {isS3Key && isUrlLoading ? (
            <div className="w-full min-h-[200px] max-h-[270px] rounded-xl bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#F77124] mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading secure video...</p>
              </div>
            </div>
          ) : (
            <VideoPlayer
              sources={[
                {
                  quality: "1080p",
                  src: isS3Key ? (securePreviewUrl || "/demoVideo.mp4") : (course?.previewVideoUrl || "/demoVideo.mp4"),
                },
              ]}
              posterUrl={course?.previewVideoUrl || "/courseVideoDemoPoster.png"}
              className="w-full min-h-[200px] max-h-[270px] rounded-xl object-cover"
            />
          )}
        </div>
        <CourseHeader course={course} />
      </div>
      {course?.scholarship && <ScholarshipBanner course={course} />}
      <TestimonialSection testimonials={course?.testimonials || []} />
      <CourseOverviewSection course={course} />
      {/* <CourseInstructorSection course={course} /> */}
      <CertificateSection course={course} />
      <VerticalCarouselSection />
      <CurriculumSection course={course} />
      <FAQSection course={course} />
    </div>
  );
};

export default CoursePage;
