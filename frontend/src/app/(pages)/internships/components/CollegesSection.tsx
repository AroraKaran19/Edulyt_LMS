"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { colleges } from "@/constants/internshipData";
import { cn } from "@/lib/utils";

const CollegesSection = () => {
  const [studentScrollPositions, setStudentScrollPositions] = useState<{
    [key: string]: number;
  }>({});
  const [maxScrollPositions, setMaxScrollPositions] = useState<{
    [key: string]: number;
  }>({});
  const containerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const contentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Calculate max scroll position for each college
  const calculateMaxScroll = React.useCallback(() => {
    const newMaxPositions: { [key: string]: number } = {};
    
    colleges.forEach((college) => {
      const container = containerRefs.current[college.id];
      const content = contentRefs.current[college.id];
      
      if (container && content) {
        const containerWidth = container.offsetWidth;
        const contentWidth = content.scrollWidth;
        const maxScroll = Math.max(0, contentWidth - containerWidth);
        newMaxPositions[college.id] = maxScroll;
      }
    });
    
    setMaxScrollPositions((prev) => {
      // Only update if values actually changed
      const hasChanged = colleges.some(
        (college) => prev[college.id] !== newMaxPositions[college.id]
      );
      return hasChanged ? newMaxPositions : prev;
    });
  }, []);

  useEffect(() => {
    // Calculate after DOM is ready
    const timeoutId = setTimeout(() => {
      calculateMaxScroll();
    }, 100);

    // Also calculate on window resize
    window.addEventListener("resize", calculateMaxScroll);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateMaxScroll);
    };
  }, [calculateMaxScroll]);

  const scrollStudents = (collegeId: string, direction: "left" | "right") => {
    const currentPosition = studentScrollPositions[collegeId] || 0;
    const maxScroll = maxScrollPositions[collegeId] || 0;
    const scrollAmount = 120; // Width of one profile bubble + gap
    
    let newPosition: number;
    if (direction === "left") {
      newPosition = Math.max(0, currentPosition - scrollAmount);
    } else {
      newPosition = Math.min(maxScroll, currentPosition + scrollAmount);
    }

    setStudentScrollPositions({
      ...studentScrollPositions,
      [collegeId]: newPosition,
    });
  };

  const canScrollLeft = (collegeId: string) => {
    return (studentScrollPositions[collegeId] || 0) > 0;
  };

  const canScrollRight = (collegeId: string) => {
    const currentPosition = studentScrollPositions[collegeId] || 0;
    const maxScroll = maxScrollPositions[collegeId];
    
    // If maxScroll is not calculated yet, allow scrolling (will be calculated on next render)
    if (maxScroll === undefined) {
      return true;
    }
    
    // Only disable if we've reached the end (with a small threshold for rounding)
    return currentPosition < maxScroll - 1;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 mt-12 sm:mt-16 lg:pt-12 bg-white py-8 sm:py-12">
      {/* Title Section */}
      <div className="text-center mb-6 sm:mb-8 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 max-w-sm text-center mx-auto">
          <span className="text-[#F77124] font-extrabold">Colleges our</span>{" "}
          <span className="text-gray-900 font-extrabold">students</span>{" "}
          <span className="text-gray-900 font-extrabold">comes from</span>
        </h2>
        <p className="text-black text-sm sm:text-base lg:text-lg mt-3 sm:mt-4 px-2">
          Students from diverse academic backgrounds and leading colleges have
          joined our internship to gain real industry experience and practical
          skills. Here are some of the institutes our past interns come from.
        </p>
      </div>

      {/* College Cards Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {colleges.map((college) => (
            <div
              key={college.id}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* College Logo */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-white">
                  <Image
                    src={college.logo}
                    alt={college.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* College Name */}
              <h3 className="text-base sm:text-lg font-bold text-black text-center mb-2">
                {college.name}
              </h3>

              {/* Student Count */}
              <p className="text-xs sm:text-sm text-black text-center mb-3 sm:mb-4">
                {college.studentCount}+ students joined our internship programs
              </p>

              {/* Student Profiles Carousel */}
              <div className="relative flex items-center gap-1 sm:gap-2">
                {/* Left Arrow */}
                <button
                  onClick={() => scrollStudents(college.id, "left")}
                  disabled={!canScrollLeft(college.id)}
                  className={cn(
                    "shrink-0 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center transition-colors",
                    canScrollLeft(college.id)
                      ? "text-gray-600 hover:text-gray-900 cursor-pointer"
                      : "text-gray-300 cursor-not-allowed"
                  )}
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Student Profiles Container */}
                <div
                  ref={(el) => {
                    containerRefs.current[college.id] = el;
                    // Recalculate when ref is set
                    if (el) {
                      setTimeout(() => calculateMaxScroll(), 0);
                    }
                  }}
                  className="flex-1 overflow-hidden"
                >
                  <div
                    ref={(el) => {
                      contentRefs.current[college.id] = el;
                      // Recalculate when ref is set
                      if (el) {
                        setTimeout(() => calculateMaxScroll(), 0);
                      }
                    }}
                    className="flex gap-2 transition-transform duration-300 ease-in-out"
                    style={{
                      transform: `translateX(-${studentScrollPositions[college.id] || 0}px)`,
                    }}
                  >
                    {college.students.map((student, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 sm:gap-2 shrink-0 bg-[#E9EEF3] text-black rounded-full pr-1.5 sm:pr-2"
                      >
                        <div
                          className={`${student.color} w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm`}
                        >
                          {student.initial}
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-700 font-semibold whitespace-nowrap">
                          {student.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => scrollStudents(college.id, "right")}
                  disabled={!canScrollRight(college.id)}
                  className={cn(
                    "shrink-0 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center transition-colors",
                    canScrollRight(college.id)
                      ? "text-gray-600 hover:text-gray-900 cursor-pointer"
                      : "text-gray-300 cursor-not-allowed"
                  )}
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollegesSection;

