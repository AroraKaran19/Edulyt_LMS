"use client";
import { Course } from "@/types";
import React, { useState } from "react";
import CourseCard from "./CourseCard";

const VerticalCarousel = ({ course }: { course: Course }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const demoCourses = [
		course,
		course,
		course,
		course,
	]

  return (
    <div className="h-[300px] w-full overflow-hidden px-4 bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div 
        className={`flex flex-col ${isHovered ? 'animate-marquee-vertical-paused' : 'animate-marquee-vertical'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {demoCourses.map((course, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full rounded-xl my-2 flex flex-col relative overflow-hidden"
          >
            <CourseCard course={course} className="h-max md:h-[250px]" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerticalCarousel;