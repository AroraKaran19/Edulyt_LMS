"use client";
import { useState } from "react";
import { Course, Testimonial } from "@/types";
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
import VideoPlayer from "@/components/ui/VideoPlayer";
import EnquiryForm from "./components/EnquiryForm";

const CoursePage = ({ course }: { course: Course }) => {
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

  // Generate presigned URL for preview video if it's an S3 key
  // const previewVideoUrl = course?.previewVideoUrl;
  // const isS3Key = previewVideoUrl && !previewVideoUrl.startsWith("http");

  if (!course) return null;

  return (
    <div
      className={cn(
        `${course?.slug}-course-page w-full min-h-[calc(100dvh-78px)]`,
        "flex flex-col items-center gap-6"
      )}
    >
      <div className="course-header w-full h-auto bg-white rounded-2xl py-4 px-4 md:px-20 xl:px-[5%] md:py-8 flex flex-col items-center">
        <div className="course-media-container w-full flex flex-col lg:flex-row gap-4 md:gap-5 lg:gap-10 xl:gap-20 items-center justify-between">
          <div className="course-preview-video w-full lg:w-2/4 mt-2 flex flex-col items-center">
            {course.previewVideoUrl ? (
              <VideoPlayer
                sources={[
                  {
                    quality: "1080p",
                    src: course?.previewVideoUrl,
                  },
                ]}
                posterUrl={
                  course?.previewVideoUrl || "/courseVideoDemoPoster.png"
                }
                className="w-full min-h-[200px] max-h-[270px] rounded-xl object-cover"
              />
            ) : (
              <div className="w-full min-h-[200px] max-h-[370px] rounded-xl bg-gray-100 flex items-center justify-center relative overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover rounded-xl"
                  draggable={false}
                  loading="eager"
                />
              </div>
            )}
          </div>
          <div className="enquiry-form hidden lg:block w-full lg:w-2/4 self-end my-auto">
            <EnquiryForm course={course} />
          </div>
        </div>
        <CourseHeader
          course={course}
          isEnrollmentModalOpen={isEnrollmentModalOpen}
          setIsEnrollmentModalOpen={setIsEnrollmentModalOpen}
        />
      </div>
      {course?.scholarship && <ScholarshipBanner course={course} />}
      <TestimonialSection testimonials={course.testimonials as Testimonial[]} />
      <CourseOverviewSection course={course} />
      <CourseInstructorSection course={course} />
      <CertificateSection
        course={course}
        onEnrollClick={() => setIsEnrollmentModalOpen(true)}
      />
      <VerticalCarouselSection />
      <CurriculumSection course={course} />
      <FAQSection course={course} />
    </div>
  );
};

export default CoursePage;
