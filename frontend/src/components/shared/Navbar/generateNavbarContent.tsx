"use client";
import { cn } from "@/lib/utils";
import { Course, NavItem } from "@/types";
import { ChevronRight, Crown } from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useGetCoursesByAudienceQuery } from "@/store/coursesApi"; 

const GenerateNavbarContent = ({
  navLink,
  closeHoverContainer,
}: {
  navLink: NavItem;
  closeHoverContainer: () => void;
}) => {
  // Move hooks outside the switch to ensure they always run
  const categories = [
    {
      label: "College Students",
      value: "college-students",
    },
    {
      label: "Professionals",
      value: "professionals",
    },
  ];
  const [selectedAudience, setSelectedAudience] = useState<string>(
    categories[0].value
  );

  const { data, isLoading, error } = useGetCoursesByAudienceQuery(selectedAudience);

  const filteredCourses = useMemo(
    () =>
      data?.data?.courses.filter(
        (course: Course) => course.audience === selectedAudience
      ),
    [data, selectedAudience]
  );

  switch (navLink.label) {
    case "Courses":
      return (
        <div className="h-full w-full p-5 flex gap-10">
          <div className="categories w-1/5 flex flex-col items-end gap-6 my-2">
            <h1 className="text-2xl font-bold text-black/60">Categories</h1>
            <div
              className="categories max-h-[200px] w-full flex flex-col gap-3 text-sm md:text-lg font-normal overflow-y-auto overflow-x-visible scroll-smooth"
              style={{ scrollbarWidth: "thin" }}
            >
              {categories.map((category, index) => (
                <div
                  key={index}
                  className={cn(
                    "category w-full px-8 py-4 flex items-center justify-between hover:bg-gray-200 transition-all duration-300 cursor-pointer rounded-xl flex-shrink-0",
                    selectedAudience === category.value && "bg-gray-200"
                  )}
                  onClick={() => setSelectedAudience(category.value)}
                >
                  <span className="text-base lg:text-lg font-normal">
                    {category.label}
                  </span>
                  <ChevronRight className="size-4 md:size-6 stroke-2 shrink-0" />
                </div>
              ))}
            </div>
          </div>
          <div
            className="courses w-4/5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-6 overflow-y-auto scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            {isLoading ? (
              <div>Loading...</div>
            ) : error ? (
              <div>Error loading courses</div>
            ) : (
              filteredCourses?.map((course: Course, index: number) => (
                <Link
                  key={index}
                  href={`/courses/${course.slug}`}
                  onClick={() => {
                    closeHoverContainer();
                  }}
                  className="w-full flex flex-row max-h-[100px] xl:max-h-[80px] items-center hover:bg-gradient-to-tr from-orange-500/10 to-white gap-3 hover:bg-gray-100 transition-all duration-300 cursor-pointer rounded-xl"
                  draggable={false}
                >
                  <div className="w-1/3 h-full shrink-0 relative">
                    {course.isFeatured && (
                      <div className="absolute top-1 left-1 flex flex-row items-center gap-1 bg-gradient-to-tr from-black to-white/50 rounded-lg px-2 py-1">
                        <Crown className="size-3 text-yellow-500" />
                        <span className="text-xs text-white font-bold text-nowrap">
                          Featured
                        </span>
                      </div>
                    )}
                    <Image
                      src={course.thumbnail || "/CourseCardDemo.jpg"}
                      alt={course.title || "Course Thumbnail"}
                      width={100}
                      height={100}
                      className="w-full h-full rounded-xl"
                      draggable={false}
                    />
                  </div>
                  <div className="w-2/3 h-full flex flex-col gap-1 py-2">
                    <div className="w-full h-full flex flex-col gap-1 justify-between">
                      <h3 className="text-sm font-bold">{course.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      );
    default:
      return (
        <div className="h-full w-full p-5 flex gap-10">
          <div className="w-full flex flex-col gap-3">
            <h1 className="text-2xl font-bold text-black/60">
              {navLink.label}
            </h1>
          </div>
        </div>
      );
  }
};

export default GenerateNavbarContent;
