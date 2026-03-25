"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import InternshipCard from "./InternshipCard";
import {
  courseCategories,
  courses,
  type Course as InternshipListingItem,
  type CourseCategory,
} from "@/constants/internshipData";

const ExploreInternshipsSection = () => {
  const [activeCategory, setActiveCategory] = useState<string>(
    courseCategories.find((c) => c.isActive)?.name ?? courseCategories[0]?.name ?? ""
  );

  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-20 xl:px-12">
      {/* Title */}
      <div className="mb-6 sm:mb-12 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
          <span className="text-gray-900 font-extrabold">Explore more</span>{" "}
          <span className="text-[#F77124] font-extrabold">Internships</span>
        </h2>
      </div>

      {/* Category pills - horizontal scroll */}
      <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-orange-200">
          {courseCategories.map((cat: CourseCategory) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                activeCategory === cat.name
                  ? "bg-[#F77124] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <span>{cat.name}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  activeCategory === cat.name
                    ? "bg-gray-800/30 text-white"
                    : "bg-gray-200 text-gray-700"
                )}
              >
                {cat.count}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#F77124] text-white hover:opacity-90"
            aria-label="More categories"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Internship cards grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 auto-rows-fr">
          {courses.slice(0, 4).map((internship: InternshipListingItem, index: number) => (
            <InternshipCard
              key={internship.id}
              internship={internship}
              className="opacity-0 animate-course-card-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExploreInternshipsSection;
