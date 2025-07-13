"use client";
import { cn } from "@/lib/utils";
import { Course, NavItem } from "@/types";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { demoCourses } from "./fakedata";
import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import Link from "next/link";

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
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0].value
  );

  // TODO: Add Endpoint to get courses by category
  // const { data, isLoading, error } = useSWR(
  // 	`${ENDPOINTS.courses.all}?category=${selectedCategory}`,
  // 	fetcher
  // );
  const error = null;
  const isLoading = false;

  const courses: Course[] = useMemo(
    () => [
      ...demoCourses.map((course) => ({
        ...course,
        category: "college-students",
      })),
      ...demoCourses.map((course) => ({
        ...course,
        category: "college-students",
      })),
      ...demoCourses.map((course) => ({
        ...course,
        category: "college-students",
      })),
      ...demoCourses.map((course) => ({
        ...course,
        category: "college-students",
      })),
      ...demoCourses.map((course) => ({
        ...course,
        category: "college-students",
      })),
      ...demoCourses.map((course) => ({
        ...course,
        category: "college-students",
      })),
      ...demoCourses,
      ...demoCourses,
      ...demoCourses,
      ...demoCourses,
      ...demoCourses,
      ...demoCourses,
      ...demoCourses,
      ...demoCourses,
      ...demoCourses,
      ...demoCourses,
    ],
    []
  );

  const filteredCourses = useMemo(
    () => courses.filter((course) => course.category === selectedCategory),
    [courses, selectedCategory]
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
                    selectedCategory === category.value && "bg-gray-200"
                  )}
                  onClick={() => setSelectedCategory(category.value)}
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
              filteredCourses.map((course: Course, index) => (
                <Link
                  key={index}
                  href={`/courses/${course.slug}`}
                  onClick={() => {
                    closeHoverContainer();
                  }}
                  className="w-full flex flex-row items-center hover:bg-gradient-to-tr from-orange-500/10 to-white gap-3 hover:bg-gray-100 transition-all duration-300 cursor-pointer rounded-xl"
                  draggable={false}
                >
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    width={100}
                    height={100}
                    className="w-1/3 shrink-0 h-full rounded-xl"
                    draggable={false}
                  />
                  <div className="w-2/3 h-full flex flex-col gap-1 py-2">
                    {course.isFeatured && (
                      <BestsellerBadge
                        enrollStudents={course.enrolledCount}
                        className="!gap-2"
                        text1ClassName="!text-xs !leading-none"
                        text2ClassName="!text-xs !leading-none"
                      />
                    )}
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
