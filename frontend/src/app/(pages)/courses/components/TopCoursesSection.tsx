"use client";
import React from "react";
import CoursesCarousel from "./CoursesCarousel";
import { Loader2 } from "lucide-react";
import { getErrorUIConfig } from '@/configs/errorUIConfig';
import Error from "@/components/ui/Error";
import { Course } from "@/types";
import { useGetFeaturedCoursesQuery } from "@/store/coursesApi";

const TopCoursesSection = () => {
  const { data, error, isLoading } = useGetFeaturedCoursesQuery();
  const courses: Course[] = data?.data?.courses || [];
  console.log("courses calling one", courses);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#f77124]" />
            <p className="text-gray-600">Loading courses...</p>
          </div>
        </div>
      );
    }

    if (error) {
      const errorConfig = getErrorUIConfig(error);
      return (
        <Error
          icon={errorConfig.icon}
          iconSize="lg"
          iconColor={errorConfig.iconColor}
          title={errorConfig.title}
          description={errorConfig.description}
          containerHeight="h-64"
        />
      );
    }

    if (!courses || courses.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-gray-600">No courses available at the moment.</p>
          </div>
        </div>
      );
    }

    return <CoursesCarousel courses={courses} />;
  };

  return (
    <section className="top-courses-section w-full bg-white rounded-2xl py-10 flex flex-col items-center">
      <h1 className="text-lg font-normal text-text-primary">Courses</h1>
      <h2 className="text-[44px] mt-3 text-text-primary font-coolvetica leading-tight text-center text-wrap-balance">
        Our Best <span className="text-[#f77124]">Courses</span> <br />
        you can Enroll now!
      </h2>
      <div className="top-courses-carousel w-full mt-10 relative">
        <div className="absolute w-full h-full bg-gradient-to-r from-white/40 via-transparent to-white/40 z-10 pointer-events-none" />
        {renderContent()}
      </div>
    </section>
  );
};

export default TopCoursesSection;
