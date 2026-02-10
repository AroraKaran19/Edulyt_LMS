"use client";
import { useState, useEffect, useMemo } from "react";
import { Course, Testimonial, CourseModule, CourseLesson, Content } from "@/types";
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
import { useSession } from "next-auth/react";
import useEnrollment from "@/hooks/useEnrollment";

const CoursePage = ({ course }: { course: Course }) => {
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);

  const { data: session, status } = useSession();
  const { checkEnrollment } = useEnrollment();

  // Filter course to show only active content for this specific course
  const filteredCourse = useMemo(() => {
    const deactivatedModules = course.deactivatedModules || [];
    const deactivatedLessons = course.deactivatedLessons || [];
    const deactivatedContents = course.deactivatedContents || [];

    // Filter modules
    const activeModules = (course.modules as CourseModule[] || [])
      .filter((module) => !deactivatedModules.includes(module._id || ""))
      .map((module) => {
        // Filter lessons within this module
        const activeLessons = (module.lessons as CourseLesson[] || [])
          .filter((lesson) => !deactivatedLessons.includes(lesson._id || ""))
          .map((lesson) => {
            // Filter contents within this lesson
            const activeContents = (lesson.contents as Content[] || [])
              .filter((content) => !deactivatedContents.includes(content._id || ""));

            return {
              ...lesson,
              contents: activeContents,
            };
          });

        return {
          ...module,
          lessons: activeLessons,
        };
      });

    return {
      ...course,
      modules: activeModules,
    };
  }, [course]);

  // Check enrollment status when user is authenticated
  useEffect(() => {
    const checkUserEnrollment = async () => {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        setIsEnrolled(false);
        setIsCheckingEnrollment(false);
        return;
      }

      if (!course._id) {
        setIsEnrolled(false);
        setIsCheckingEnrollment(false);
        return;
      }

      try {
        const result = await checkEnrollment({ courseId: course._id });
        if (result) {
          setIsEnrolled(result.isEnrolled);
        }
      } catch (error) {
        console.error("Failed to check enrollment:", error);
        setIsEnrolled(false);
      } finally {
        setIsCheckingEnrollment(false);
      }
    };

    checkUserEnrollment();
  }, [session, status, course._id, checkEnrollment]);

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
          isEnrolled={isEnrolled}
          isCheckingEnrollment={isCheckingEnrollment}
        />
      </div>
      {filteredCourse?.scholarship && <ScholarshipBanner course={filteredCourse} />}
      <TestimonialSection testimonials={filteredCourse.testimonials as Testimonial[]} />
      <CourseOverviewSection course={filteredCourse} />
      <CourseInstructorSection course={filteredCourse} />
      <CertificateSection
        course={filteredCourse}
        onEnrollClick={() => setIsEnrollmentModalOpen(true)}
      />
      <VerticalCarouselSection />
      <CurriculumSection course={filteredCourse} />
      <FAQSection course={filteredCourse} />
    </div>
  );
};

export default CoursePage;
