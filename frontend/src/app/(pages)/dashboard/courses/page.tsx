"use client";
import React, { useState } from "react";
import { Search, Filter, Download } from "lucide-react";
import Image from "next/image";
import { demoCourses } from "@/data/demoCourses";

const tabs = [
  { label: "All" },
  { label: "In Progress" },
  { label: "Completed" },
  { label: "Newly bought" },
];


const CoursesPage = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  return (
    <div className="px-3 sm:px-4 md:px-8 lg:px-20 pb-4">
      {/* Header and Tabs */}
      <div className="flex flex-col mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
            My Courses
          </h1>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="flex gap-1 sm:gap-2 rounded-xl border border-[#F66F221F] bg-[#FFF6F2] p-1 sm:p-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.label
                    ? "bg-orange-500 text-white shadow"
                    : "text-black hover:bg-gray-200"
                    }`}
                  onClick={() => setActiveTab(tab.label)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search, Filter, Sort */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full lg:w-auto">
              <div className="relative order-1 sm:order-none">
                <input
                  type="text"
                  placeholder="Search a course by its name, title or author name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="placeholder:text-[#0000003D] placeholder:text-xs w-full sm:w-[280px] md:w-[349px] h-10 sm:h-12 px-3 sm:px-4 pr-10 sm:pr-12 bg-[#F5F5F5] rounded-xl border border-[#00000026] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-[0px_4px_4px_0px_#00000012_inset]"
                />
                <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 p-1.5 sm:p-2 rounded-lg hover:bg-orange-600 transition" title="Search">
                  <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </button>
              </div>
              <div className="flex gap-2 order-2 sm:order-none">
                <button type="button" className="flex items-center gap-1 border border-[#00000026] rounded-xl px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold text-[#2B1508] hover:bg-gray-200 cursor-pointer">
                  <span className="hidden sm:inline">Filter</span>
                  <span className="sm:hidden">Filter</span>
                  <Filter size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
                <button type="button" className="flex items-center gap-1 border border-[#00000026] rounded-xl px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold text-[#2B1508] hover:bg-gray-200 cursor-pointer">
                  <span className="hidden sm:inline">Sort by</span>
                  <span className="sm:hidden">Sort</span>
                  <Image src="/sort.svg" alt="sort" width={16} height={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 8 }, (_, idx) => {
          const courseIndex = idx % demoCourses.length;
          const course = demoCourses[courseIndex];
          // Mock progress and certificate for demo - cycling through 0%, 12%, 100%
          const progress = [0, 12, 100][idx % 3];
          const showCertificate = progress === 100;

          return (
            <div
              key={`${course._id}-${idx}`}
              className="bg-white border border-[#0000001F] rounded-xl flex flex-col justify-between p-3 sm:p-4 w-full shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="relative w-full h-28 sm:h-32 md:h-36 rounded-xl overflow-hidden mb-2 sm:mb-3">
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover rounded-sm"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    priority
                  />
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-[#00000078] text-white text-xs px-2 sm:px-3 py-1 rounded-full flex gap-1 font-medium">
                    <span className="hidden sm:inline">5 Episodes</span>
                    <span className="sm:hidden">5 Ep</span>
                    <span>•</span>
                    <span className="hidden sm:inline">4 Modules</span>
                    <span className="sm:hidden">4 Mod</span>
                  </div>
                </div>
                <div className="font-extrabold text-xs sm:text-sm mb-2 text-black line-clamp-2">
                  Data Science: Zero to Hundred
                </div>
                <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                  <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Image src="/user.svg" alt="user" width={20} height={20} className="sm:w-6 sm:h-6 rounded-full border border-white" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium hidden sm:inline">John Doe</span>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium sm:hidden">JD</span>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Image src="/user.svg" alt="user" width={20} height={20} className="sm:w-6 sm:h-6 rounded-full border border-white" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium hidden sm:inline">John Doe</span>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium sm:hidden">JD</span>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-gray-700 font-medium m-[2px]">+1</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-3">
                {/* Circular progress bar */}
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 rotate-[-90deg]"
                    viewBox="0 0 40 40"
                  >
                    <circle
                      cx="20"
                      cy="20"
                      r="18"
                      fill="none"
                      stroke="#F3F4F6"
                      strokeWidth="4"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="18"
                      fill="none"
                      stroke={
                        progress === 100
                          ? "#22C55E"
                          : progress > 0
                            ? "#A259FF"
                            : "#E5E7EB"
                      }
                      strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 18}
                      strokeDashoffset={2 * Math.PI * 18 * (1 - progress / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-bold text-black">
                    {progress}%
                  </span>
                  <span className="text-[8px] sm:text-[10px] font-medium text-[#00000080]">
                    Your progress
                  </span>
                </div>

                <div className="flex-1" />

                {progress === 100 && showCertificate ? (
                  <button type="button" className="flex items-center gap-1 sm:gap-2 bg-gradient-to-b from-[#F5691D] to-[#F9792A] text-white rounded-lg px-2 sm:px-2 py-1.5 sm:py-2 text-[10px] font-semibold hover:from-[#F5691D] hover:to-[#F9792A] transition cursor-pointer border border-[#00000021] shadow-[0px_0px_0px_4px_rgba(246,140,34,0.22),0px_0px_0px_2px_rgba(246,140,34,0.22)]">
                    <Download size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Download certificate</span>
                    <span className="sm:hidden">Download</span>
                  </button>
                ) : progress > 0 ? (
                  <button type="button" className="flex items-center gap-1 sm:gap-2 bg-white border border-[#00000021] text-[#656565] rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-bold hover:bg-gray-100 transition cursor-pointer shadow-[0px_-3px_3.7px_0px_#0146E721_inset]">
                    Continue
                  </button>
                ) : (
                  <button type="button" className="flex items-center gap-1 sm:gap-2 bg-white border border-[#00000021] text-[#656565] rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-bold hover:bg-gray-100 transition cursor-pointer shadow-[0px_-3px_3.7px_0px_#0146E721_inset]">
                    <span className="hidden sm:inline">Start watching</span>
                    <span className="sm:hidden">Start</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoursesPage;