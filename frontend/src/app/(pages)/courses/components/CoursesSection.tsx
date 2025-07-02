"use client";
import { ChevronDown } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import CourseSearchBar from "./CourseSearchBar";
import { useCourseFilter } from "@/contexts/CourseFilterProvider";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "usehooks-ts";
import FilterContainer from "./FilterContainer";
import { CourseCardProps } from "@/types";
import CourseCard from "./CourseCard";

const CoursesSection = () => {
  const { search, filters, selectedFilter, handleFilterClick } =
    useCourseFilter();
  const [filterShown, setFilterShown] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1046px)");
  const [courses, setCourses] = useState<CourseCardProps[]>([]);

  useEffect(() => {
    setCourses([
      {
        title: "Data Science: Zero to Hundred",
        image: "/CourseCardDemo.jpg",
        bestSeller: true,
        enrollStudents: "100",
        rating: 4.5,
        totalRating: 100,
        mentors: [
          {
            name: "Dr. Sarah Johnson",
            image: "/CourseCardDemo.jpg",
          },
        ],
        startingPrice: 100,
        category: "Data Science",
        discount: 50,
      },
      {
        title: "Advanced Machine Learning Algorithms",
        image: "/CourseCardDemo.jpg",
        bestSeller: false,
        enrollStudents: "250",
        rating: 4.8,
        totalRating: 150,
        mentors: [
          {
            name: "Prof. Michael Chen",
            image: "/CourseCardDemo.jpg",
          },
        ],
        startingPrice: 120,
        category: "Machine Learning",
        discount: 30,
      },
      {
        title: "Artificial Intelligence Fundamentals",
        image: "/CourseCardDemo.jpg",
        bestSeller: true,
        enrollStudents: "180",
        rating: 4.7,
        totalRating: 95,
        mentors: [
          {
            name: "Dr. Alex Rodriguez",
            image: "/CourseCardDemo.jpg",
          },
        ],
        startingPrice: 150,
        category: "AI",
        discount: 40,
      },
      {
        title: "Full Stack Web Development Bootcamp",
        image: "/CourseCardDemo.jpg",
        bestSeller: true,
        enrollStudents: "300",
        rating: 4.6,
        totalRating: 200,
        mentors: [
          {
            name: "John Smith",
            image: "/CourseCardDemo.jpg",
          },
          {
            name: "Emma Wilson",
            image: "/CourseCardDemo.jpg",
          },
        ],
        startingPrice: 80,
        category: "Web Development",
        discount: 25,
      },
      {
        title: "React & Next.js Masterclass",
        image: "/CourseCardDemo.jpg",
        bestSeller: false,
        enrollStudents: "150",
        rating: 4.4,
        totalRating: 80,
        mentors: [
          {
            name: "Lisa Anderson",
            image: "/CourseCardDemo.jpg",
          },
        ],
        startingPrice: 90,
        category: "Web Development",
        discount: 20,
      },
      {
        title: "Deep Learning with Python",
        image: "/CourseCardDemo.jpg",
        bestSeller: false,
        enrollStudents: "120",
        rating: 4.9,
        totalRating: 110,
        mentors: [
          {
            name: "Dr. Kevin Park",
            image: "/CourseCardDemo.jpg",
          },
        ],
        startingPrice: 140,
        category: "Machine Learning",
        discount: 35,
      },
      {
        title: "Data Visualization with D3.js",
        image: "/CourseCardDemo.jpg",
        bestSeller: false,
        enrollStudents: "90",
        rating: 4.3,
        totalRating: 75,
        mentors: [
          {
            name: "Maria Garcia",
            image: "/CourseCardDemo.jpg",
          },
        ],
        startingPrice: 75,
        category: "Data Science",
        discount: 15,
      },
      {
        title: "Computer Vision with AI",
        image: "/CourseCardDemo.jpg",
        bestSeller: true,
        enrollStudents: "200",
        rating: 4.7,
        totalRating: 160,
        mentors: [
          {
            name: "Dr. James Liu",
            image: "/CourseCardDemo.jpg",
          },
        ],
        startingPrice: 160,
        category: "AI",
        discount: 45,
      },
    ]);
  }, []);

  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Apply category filters
    const isAllSelected = selectedFilter?.some((f) => f.value === "all");
    if (!isAllSelected && selectedFilter?.length > 0) {
      const selectedCategories = selectedFilter.map((f) => {
        // Map filter values to course categories
        switch (f.value) {
          case "data-science":
            return "Data Science";
          case "machine-learning":
            return "Machine Learning";
          case "ai":
            return "AI";
          case "web-development":
            return "Web Development";
          default:
            return f.label;
        }
      });

      filtered = filtered.filter((course) =>
        selectedCategories.includes(course.category)
      );
    }

    // Apply search filter
    if (search && search.trim().length > 0) {
      const searchTerm = search.toLowerCase().trim();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm) ||
          course.category.toLowerCase().includes(searchTerm) ||
          course.mentors.some((mentor) =>
            mentor.name.toLowerCase().includes(searchTerm)
          )
      );
    }

    return filtered;
  }, [courses, selectedFilter, search]);

  return (
    <section className="courses-section w-full bg-white rounded-2xl py-10 px-4 flex flex-col items-center sm:px-[15%]">
      <p
        className={cn(
          "courses-section-header w-full text-[44px] font-normal text-[#2B1508] font-coolvetica",
          isMobile ? "text-center" : "text-left"
        )}
      >
        Explore more <span className="text-[#f77124]">Courses</span>
      </p>
      <div className="search-container w-full mt-6 flex gap-6 items-stretch">
        <CourseSearchBar />
        <div
          className="courses-filter max-w-[190px] shrink-0 flex gap-2 items-center border border-black/10 rounded-xl p-2 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)] px-8 relative cursor-pointer"
          onClick={() => setFilterShown(!filterShown)}
        >
          <span className="text-[16px] font-bold text-[#2B1508] select-none">
            Filter{" "}
            {selectedFilter?.some((f) => f.value === "all")
              ? ""
              : selectedFilter?.length
              ? `(${selectedFilter.length})`
              : ""}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-[#2B1508] transition-transform duration-300 ease-in-out",
              filterShown ? "rotate-180" : ""
            )}
          />
        </div>
      </div>
      {filterShown && (
        <FilterContainer
          filters={filters}
          selectedFilter={selectedFilter}
          isMobile={isMobile}
          handleFilterClick={handleFilterClick}
        />
      )}
      <div className="courses-container w-full mt-13 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course, index) => (
            <CourseCard key={index} {...course} className="min-h-[220px]" />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <p className="text-2xl font-bold text-[#2B1508] font-coolvetica mb-2">
              No courses found
            </p>
            <p className="text-lg text-[#2B1508]/70 text-center break-words overflow-wrap-anywhere max-w-full">
              {search ? (
                <>
                  No results found for &quot;
                  <span className="font-medium break-all inline-block max-w-full">
                    {search.length > 50
                      ? `${search.substring(0, 50)}...`
                      : search}
                  </span>
                  &quot;
                </>
              ) : (
                "No courses match the selected filters"
              )}
            </p>
            <p className="text-sm text-[#2B1508]/50 text-center mt-2">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>
      {filteredCourses.length > 8 && (
        <div className="load-more-button w-full flex justify-center mt-5">
          <button className="w-full sm:w-1/3 font-bold text-sm px-8 py-4 bg-black text-white rounded-xl cursor-pointer">
            Load More
          </button>
        </div>
      )}
    </section>
  );
};

export default CoursesSection;
