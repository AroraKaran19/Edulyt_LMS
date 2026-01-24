"use client";

import React from "react";
import { cn } from "@/lib/utils";
import CourseCard from "@/app/(pages)/courses/components/CourseCard";
import { Course } from "@/types";

export type MentorCoursesSectionProps = {
  title?: string;
  courses: Course[];
  className?: string;
};

const MentorCoursesSection = ({
  title = "Courses By Them",
  courses,
  className,
}: MentorCoursesSectionProps) => {
  return (
    <section
      className={cn(
        "bg-white rounded-2xl p-4 sm:p-6",
        className
      )}
    >
      <p className="text-xl sm:text-2xl font-bold text-text-primary">
        {title}
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
        {courses.map((course, idx) => (
          <CourseCard
            key={`${course.slug}-${idx}`}
            course={course}
            className="h-full"
          />
        ))}
      </div>
    </section>
  );
};

export default MentorCoursesSection;
