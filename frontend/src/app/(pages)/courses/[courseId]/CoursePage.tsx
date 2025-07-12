"use client";
import React from "react";
import useSWR from "swr";
import CoursePageSkeleton from "./components/CoursePageSkeleton";
import { Course } from "@/types";
import { cn, fetcher } from "@/lib/utils";
import CourseHeader from "./components/CourseHeader";
import ScholarshipBanner from "./components/ScholarshipBanner";
import TestimonialSection from "./components/TestimonialSection";
import CourseOverviewSection from "./components/CourseOverviewSection";
import { ENDPOINTS } from "@/constants/endpoints";
import apiClient from "@/configs/apiConfig";
import Error from "@/components/ui/Error";
import { getErrorUIConfig } from "@/configs/errorUIConfig";

// Fetcher function for SWR


const CoursePage = ({ courseId }: { courseId: string }) => {
  // Use SWR to fetch course data by slug
  const { data, error, isLoading } = useSWR<Course>(
    `${ENDPOINTS.courses.slug}/${courseId}`,
    fetcher,
  );

  const { course } = data?.data || {};


  if (isLoading) {
    return <CoursePageSkeleton />;
  }

  if (error) {
    const errorConfig = getErrorUIConfig(error);
    return (
      <Error
        icon={errorConfig.icon}
        iconColor={errorConfig.iconColor}
        title={errorConfig.title}
        description={errorConfig.description}
        containerHeight="min-h-screen"
      />
    );
  }

  if (!course) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Course not found</h1>
          <p className="text-gray-600">The course you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
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
              src={`${course.previewVideoUrl}`}
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
