"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { colleges } from "@/constants/internshipData";

const CollegesSection = () => {
  const [studentScrollPositions, setStudentScrollPositions] = useState<{
    [key: string]: number;
  }>({});

  const scrollStudents = (collegeId: string, direction: "left" | "right") => {
    const currentPosition = studentScrollPositions[collegeId] || 0;
    const scrollAmount = 120; // Width of one profile bubble + gap
    const newPosition =
      direction === "left"
        ? currentPosition - scrollAmount
        : currentPosition + scrollAmount;

    setStudentScrollPositions({
      ...studentScrollPositions,
      [collegeId]: Math.max(0, newPosition),
    });
  };

  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24 bg-white py-12">
      {/* Title Section */}
      <div className="text-center mb-8 max-w-4xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-gray-900">Colleges</span>{" "}
          <span className="text-[#F77124]">our students</span>{" "}
          <span className="text-gray-900">comes from</span>
        </h2>
        <p className="text-gray-700 text-base lg:text-lg mt-4">
          Students from diverse academic backgrounds and leading colleges have
          joined our internship to gain real industry experience and practical
          skills. Here are some of the institutes our past interns come from.
        </p>
      </div>

      {/* College Cards Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colleges.map((college) => (
            <div
              key={college.id}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* College Logo */}
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24 rounded-full border-4 border-blue-500 overflow-hidden bg-white">
                  <Image
                    src={college.logo}
                    alt={college.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* College Name */}
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                {college.name}
              </h3>

              {/* Student Count */}
              <p className="text-sm text-gray-700 text-center mb-4">
                {college.studentCount}+ students joined our internship programs
              </p>

              {/* Student Profiles Carousel */}
              <div className="relative flex items-center gap-2">
                {/* Left Arrow */}
                <button
                  onClick={() => scrollStudents(college.id, "left")}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Student Profiles Container */}
                <div className="flex-1 overflow-hidden">
                  <div
                    className="flex gap-2 transition-transform duration-300 ease-in-out"
                    style={{
                      transform: `translateX(-${studentScrollPositions[college.id] || 0}px)`,
                    }}
                  >
                    {college.students.map((student, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 flex-shrink-0"
                      >
                        <div
                          className={`${student.color} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm`}
                        >
                          {student.initial}
                        </div>
                        <span className="text-xs text-gray-700 whitespace-nowrap">
                          {student.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => scrollStudents(college.id, "right")}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
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

