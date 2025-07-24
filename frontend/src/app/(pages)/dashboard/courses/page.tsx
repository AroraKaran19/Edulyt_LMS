"use client";
import React, { useState } from "react";
import { Search, Filter, ChevronDown, Download } from "lucide-react";
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
    <div className="px-4 md:px-8 py-6">
      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 md:mb-0">
            My Courses
          </h1>
          <div className="flex gap-2 mt-2">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.label
                    ? "bg-orange-500 text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab(tab.label)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Search, Filter, Sort */}
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-end w-full md:w-auto">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1 w-full md:w-72">
            <input
              type="text"
              className="bg-transparent outline-none flex-1 text-sm py-1"
              placeholder="Search a course by its name, title or author name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="text-orange-500">
              <Search size={20} />
            </button>
          </div>
          <button className="flex items-center gap-1 bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            <Filter size={18} />
            Filter
          </button>
          <button className="flex items-center gap-1 bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Sort by <ChevronDown size={16} />
          </button>
        </div>
      </div>
      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
        {demoCourses.map((course, idx) => {
          // Mock progress and certificate for demo
          const progress = [0, 12, 100][idx % 3];
          const showCertificate = progress === 100;
          const extraInstructors = course.instructor.length - 2;
          // For demo, mock episodes as 5
          const episodes = 5;
          return (
            <div
              key={course._id}
              className="bg-white border border-gray-200 rounded-2xl flex flex-col justify-between p-4 w-full max-w-[370px] min-h-[340px] mx-auto shadow-none transition hover:shadow-md"
              style={{ boxSizing: "border-box" }}
            >
              <div>
                <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3">
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover rounded-xl"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority
                  />
                  <div className="absolute top-3 left-3 bg-black/80 text-white text-xs px-3 py-1 rounded-full flex gap-2 font-medium">
                    {episodes} Episodes <span className="mx-1">•</span>{" "}
                    {course.modules.length} Modules
                  </div>
                </div>
                <div className="font-bold text-lg mb-2 text-gray-900">
                  {course.title}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  {/* {instructors.map((inst, i) => (
                    <span key={inst} className="flex items-center gap-1">
                      <Image
                        src={inst.profileImage || "/user.png"}
                        alt={inst.name}
                        width={28}
                        height={28}
                        className="rounded-full border-2 border-white -ml-2 first:ml-0"
                      />
                      <span className="text-sm text-gray-800 font-medium">
                        {inst.name}
                      </span>
                    </span>
                  ))} */}
                  {extraInstructors > 0 && (
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-semibold">
                      +{extraInstructors}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-auto pt-2">
                {/* Circular progress bar */}
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 rotate-[-90deg]"
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
                  <span
                    className={`absolute inset-0 flex flex-col items-center justify-center text-base font-bold ${
                      progress === 100
                        ? "text-green-500"
                        : progress > 0
                        ? "text-purple-500"
                        : "text-gray-400"
                    }`}
                  >
                    {progress}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    Your progress
                  </span>
                </div>
                <div className="flex-1" />
                {progress === 100 && showCertificate ? (
                  <button className="flex items-center gap-2 bg-orange-500 text-white rounded-lg px-5 py-2 text-base font-semibold shadow-none hover:bg-orange-600 transition min-w-[180px] justify-center">
                    Download certificate <Download size={20} />
                  </button>
                ) : progress > 0 ? (
                  <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 rounded-lg px-5 py-2 text-base font-semibold shadow-none hover:bg-gray-100 transition min-w-[120px] justify-center">
                    Continue
                  </button>
                ) : (
                  <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 rounded-lg px-5 py-2 text-base font-semibold shadow-none hover:bg-gray-100 transition min-w-[120px] justify-center">
                    Start watching
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
