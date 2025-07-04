"use client";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCourseFilter } from "@/contexts/CourseFilterProvider";
import CourseHeader from "./components/CourseHeader";
import { Course } from "@/types";

const CoursePage = () => {
  const params = useParams();
  const encodedCourseId = params.courseId as string;
  const courseId = decodeURIComponent(encodedCourseId);
  const { courses } = useCourseFilter();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
    const interval = 500; // Check every 500ms

    const findCourse = () => {
      const foundCourse = courses.find(
        (course) =>
          course.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-&]/g, "") === courseId
      );

      if (foundCourse) {
        setCourse(foundCourse);
        setIsLoading(false);
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setTimeoutReached(true);
        setIsLoading(false);
        return;
      }

      // Try again after interval
      setTimeout(findCourse, interval);
    };

    findCourse();

    // Cleanup function
    return () => {
      attempts = maxAttempts; // Stop the retry loop
    };
  }, [courses, courseId]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course || timeoutReached) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Course not found</h2>
          <p className="text-gray-600">The course you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        `${courseId}-course-page w-full min-h-screen`,
        "flex flex-col items-center"
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
    </div>
  );
};

export default CoursePage;
