"use client";
import React, { useState, useMemo } from "react";
import CourseCard from "./CourseCard";
import useSWR from "swr";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import { Course } from "@/types";

const VerticalCarousel = () => {
  const [isHovered, setIsHovered] = useState(false);

  const { data, isLoading, error } = useSWR(ENDPOINTS.courses.all, fetcher)
  const courses: Course[] = data?.data?.courses || [];

  // Calculate animation speed based on course count
  const animationClass = useMemo(() => {
    const courseCount = courses.length;
    
    if (courseCount <= 2) {
      return isHovered ? "animate-marquee-vertical-fast-paused" : "animate-marquee-vertical-fast";
    } else if (courseCount <= 4) {
      return isHovered ? "animate-marquee-vertical-medium-paused" : "animate-marquee-vertical-medium";
    } else {
      return isHovered ? "animate-marquee-vertical-paused" : "animate-marquee-vertical";
    }
  }, [courses.length, isHovered]);

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

  return (
    <div className="h-[300px] w-full overflow-hidden px-4 bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div
        className={`flex flex-col ${animationClass}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {courses.map((course, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full rounded-xl my-2 flex flex-col relative overflow-hidden"
          >
            <CourseCard course={course} className="h-max md:h-[350px] xl:h-[250px]" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerticalCarousel;
