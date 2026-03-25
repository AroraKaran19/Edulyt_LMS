"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import TimelineMarkerIcon from "./TimelineMarkerIcon";
import InternshipCard from "@/app/(pages)/internships/components/InternshipCard";
import {
  courseCategories,
  courses,
  type Course as InternshipItem,
  type CourseCategory,
} from "@/constants/internshipData";

export default function InternshipsSection() {
  const [activeCategory, setActiveCategory] = useState<string>(
    courseCategories.find((c) => c.isActive)?.name ?? courseCategories[0]?.name ?? ""
  );
  const [currentPage, setCurrentPage] = useState(0);
  const perPage = 6;
  const totalPages = Math.ceil(courses.length / perPage) || 1;
  const start = currentPage * perPage;
  const visible = courses.slice(start, start + perPage);

  return (
    <div className="relative px-40 mt-12 sm:py-10">
      {/* Marker Row */}
      <div className="flex items-center relative gap-4 -translate-x-12 sm:-translate-x-22">
        <TimelineMarkerIcon size="big">💼</TimelineMarkerIcon>
        <span className="text-xl sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
          We Have Two Powerful Paths for You
        </span>
      </div>

      <div className="mt-10 sm:mt-6 ">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-xl sm:text-lg lg:text-xl font-semibold leading-tight">
            Our <span className="text-[#F77124]">Internships Programs</span>
          </h2>
        </div>

        <div className="mt-6 flex gap-4 justify-between items-center h-12 rounded-full  overflow-x-auto bg-[#F66F221F] scrollbar-hide">
          {courseCategories.map((cat: CourseCategory) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                "shrink-0 inline-flex items-center h-full gap-2 rounded-full px-4 py-2.5 font-semibold transition",
                "text-xs sm:text-sm font-medium",
                activeCategory === cat.name
                  ? "bg-gradient-to-b from-[#F5891D] to-[#F5691D] text-white"
                  : "text-gray-700"
              )}
            >
              <span>{cat.name}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  activeCategory === cat.name
                    ? "bg-black/20 text-white"
                    : "bg-gray-200 text-gray-700"
                )}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 auto-rows-fr">
          {visible.map((internship: InternshipItem, i) => (
            <InternshipCard
              key={internship.id}
              internship={internship}
              className="opacity-0 animate-course-card-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentPage(i)}
              className={cn(
                "h-2 rounded-full transition-colors",
                i === currentPage ? "w-8 bg-[#F77124]" : "w-2 bg-gray-300"
              )}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
