"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search, ChevronDown, Star } from "lucide-react";
import { courseCategories, courses } from "@/constants/internshipData";
import { cn } from "@/lib/utils";

const ExploreCoursesSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Data Science");

  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24 bg-white py-12">
      {/* Title Section */}
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-gray-900">Explore more</span>{" "}
          <span className="text-[#F77124]">Courses</span>
        </h2>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search course name by title or type"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent"
            />
          </div>

          {/* Filter Button */}
          <button className="px-6 py-3 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors">
            <span>Filter</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-3">
          {courseCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer flex items-center gap-2",
                activeCategory === category.name
                  ? "bg-[#F77124] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <span>{category.name}</span>
              {category.count && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    activeCategory === category.name
                      ? "bg-white/20 text-white"
                      : "bg-white text-gray-700"
                  )}
                >
                  {category.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg border-2 border-[#F77124]/30 p-4 hover:shadow-lg transition-shadow flex flex-col md:flex-row gap-4"
            >
              {/* Left Section - Course Image */}
              <div className="relative w-full md:w-1/2 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover min-h-[200px]"
                />
                {/* Discount Badge */}
                <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-lg text-sm font-bold">
                  {course.discount}% off
                </div>
              </div>

              {/* Right Section - Course Information */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Best Seller Badge */}
                  {course.isBestSeller && (
                    <div className="mb-3 bg-[#FED7AA] flex items-center gap-2 flex-wrap rounded-lg">
                      <span className="bg-[#C2410C] text-[#fde8d1] px-3 py-1 rounded-lg text-sm font-semibold">
                        Best seller
                      </span>
                      <span className="text-xs leading-none bg-[#FED7AA] text-[#C2410C] font-medium">
                        (enrolled by {(course.enrolledStudents / 1000).toFixed(0)}k students)
                      </span>
                    </div>
                  )}

                  {/* Course Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {course.title}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-[#F77124]">
                      {course.rating} Rating
                    </span>
                    <span className="text-xs text-gray-600">
                      (more than {course.reviewCount.toLocaleString()} reviews)
                    </span>
                  </div>

                  {/* Instructors */}
                  <div className="flex items-center gap-2 mb-4">
                    {course.instructors.slice(0, 2).map((instructor, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#EEEEEE] pr-2 pl-0.5 py-0.5 rounded-full">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden">
                          <Image
                            src={instructor.image}
                            alt={instructor.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-xs text-gray-700">
                          {instructor.name}
                        </span>
                      </div>
                    ))}
                    {course.instructors.length > 2 && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-[#F77124] flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">
                            +{course.instructors.length - 2}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Enroll Button */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${course.currentPrice}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ${course.originalPrice}
                    </span>
                  </div>
                  <button className="bg-[#F77124] cursor-pointer text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExploreCoursesSection;

