"use client";
import React, { useState } from "react";
import Image from "next/image";
import DropDown from "@/components/ui/dropdown/DropDown";
import NewSignupusersGraph from "../dashboard/NewSignupusersGraph";
import { Clock, Search } from "lucide-react";

const InternshipsAnalytics = () => {
  const [selectedFilter, setSelectedFilter] = useState("Yearly");
  const [selectedInternship, setSelectedInternship] = useState<number | null>(
    0
  );
  //   const [selectedPopularInternship, setSelectedPopularInternship] = useState<
  //     number | null
  //   >(0);

  const handleInternshipSelect = (index: number) => {
    setSelectedInternship(index);
  };

  return (
    <div className="p-2 sm:px-4 sm:pb-2 flex flex-col gap-4 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full bg-white pr-2 sm:pr-6 gap-2 sm:gap-0">
        {/* Title */}
        <h1 className="text-black font-bold text-xl sm:text-2xl font-coolvetica">
          Internship Analytics
        </h1>

        {/* User Profile Section */}
        <div className="flex items-center gap-4 sm:gap-8">
          <span className="text-[#475467] font-medium font-coolvetica text-xs sm:text-sm">
            Internship / Analytics
          </span>
        </div>
      </div>

      {/* graphs and internships */}
      <div className="space-y-4 sm:space-y-6 sm:pr-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6">
          {/* new signups graph */}
          <div className="lg:col-span-5 bg-white rounded-xl px-4 pt-4 shadow-sm border border-[#EAECF0]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-0">
              <div className="">
                <h3 className="text-[#475467] font-medium text-sm sm:text-base">
                  Total Students Applied
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                  <span className="text-xl sm:text-3xl font-extrabold text-black">
                    1200
                  </span>
                </div>
              </div>
              <div className="cursor-pointer">
                <DropDown
                  options={["Monthly", "Yearly"]}
                  defaultValue={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full sm:w-28 font-bold text-base text-black"
                />
              </div>
            </div>
            <div>
              <NewSignupusersGraph />
            </div>
          </div>

          {/* Top Selling Internships */}
          <div className="lg:col-span-5 bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-0">
              <div className="">
                <h3 className="text-[#475467] font-medium text-sm sm:text-base">
                  Top Selling Internships
                </h3>
              </div>
              <div className="cursor-pointer">
                <DropDown
                  options={["Monthly", "Yearly"]}
                  defaultValue={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full sm:w-28 font-bold text-base text-black"
                />
              </div>
            </div>
            <div>
              <div className="mt-4 space-y-3">
                {/* First Internship Card */}
                <div
                  className={`cursor-pointer flex items-center justify-between py-3 px-4 bg-white rounded-2xl border-2 transition-colors ${
                    selectedInternship === 0
                      ? "border-[#F7AD24]"
                      : "border-[#00000026]"
                  }`}
                  onClick={() => handleInternshipSelect(0)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h4 className="font-normal text-xl text-black font-coolvetica">
                        Product Designer
                      </h4>
                      <p className="text-[#575757] font-plus-jakarta font-normal text-xs">
                        Google
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 bg-[#00000078] px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3 text-white" color="white" />
                        <span className="text-white font-semibold font-plus-jakarta text-xs">
                          Posted 5 minutes ago
                        </span>
                      </div>
                      {selectedInternship === 0 && (
                        <Image
                          src="/LeaderboardMedal.svg"
                          alt="medal"
                          width={16}
                          height={16}
                        />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Reply"
                    className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-[10px] px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                  >
                    <span className="text-xs font-bold font-plus-jakarta text-[#656565]">
                      View Internship
                    </span>
                  </button>
                </div>

                {/* Second Internship Card */}
                <div
                  className={`cursor-pointer flex items-center justify-between py-3 px-4 bg-white rounded-2xl border-2 transition-colors ${
                    selectedInternship === 1
                      ? "border-[#F7AD24]"
                      : "border-[#00000026]"
                  }`}
                  onClick={() => handleInternshipSelect(1)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h4 className="font-normal text-xl text-black font-coolvetica">
                        Product Designer
                      </h4>
                      <p className="text-[#575757] font-plus-jakarta font-normal text-xs">
                        Google
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 bg-[#00000078] px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3 text-white" color="white" />
                        <span className="text-white font-semibold font-plus-jakarta text-xs">
                          Posted 5 minutes ago
                        </span>
                      </div>
                      {selectedInternship === 1 && (
                        <Image
                          src="/LeaderboardMedal.svg"
                          alt="medal"
                          width={16}
                          height={16}
                        />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Reply"
                    className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-[10px] px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                  >
                    <span className="text-xs font-bold font-plus-jakarta text-[#656565]">
                      View Internship
                    </span>
                  </button>
                </div>

                {/* Third Internship Card */}
                <div
                  className={`cursor-pointer flex items-center justify-between py-3 px-4 bg-white rounded-2xl border-2 transition-colors ${
                    selectedInternship === 2
                      ? "border-[#F7AD24]"
                      : "border-[#00000026]"
                  }`}
                  onClick={() => handleInternshipSelect(2)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h4 className="font-normal text-xl text-black font-coolvetica">
                        Product Designer
                      </h4>
                      <p className="text-[#575757] font-plus-jakarta font-normal text-xs">
                        Google
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 bg-[#00000078] px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3 text-white" color="white" />
                        <span className="text-white font-semibold font-plus-jakarta text-xs">
                          Posted 5 minutes ago
                        </span>
                      </div>
                      {selectedInternship === 2 && (
                        <Image
                          src="/LeaderboardMedal.svg"
                          alt="medal"
                          width={16}
                          height={16}
                        />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Reply"
                    className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-[10px] px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                  >
                    <span className="text-xs font-bold font-plus-jakarta text-[#656565]">
                      View Internship
                    </span>
                  </button>
                </div>

                {/* Fourth Internship Card */}
                <div
                  className={`cursor-pointer flex items-center justify-between py-3 px-4 bg-white rounded-2xl border-2 transition-colors ${
                    selectedInternship === 3
                      ? "border-[#F7AD24]"
                      : "border-[#00000026]"
                  }`}
                  onClick={() => handleInternshipSelect(3)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h4 className="font-normal text-xl text-black font-coolvetica">
                        Product Designer
                      </h4>
                      <p className="text-[#575757] font-plus-jakarta font-normal text-xs">
                        Google
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 bg-[#00000078] px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3 text-white" color="white" />
                        <span className="text-white font-semibold font-plus-jakarta text-xs">
                          Posted 5 minutes ago
                        </span>
                      </div>
                      {selectedInternship === 3 && (
                        <Image
                          src="/LeaderboardMedal.svg"
                          alt="medal"
                          width={16}
                          height={16}
                        />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Reply"
                    className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-[10px] px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                  >
                    <span className="text-xs font-bold font-plus-jakarta text-[#656565]">
                      View Internship
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Most popular courses */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0] sm:pr-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-[#475467] font-medium text-sm sm:text-base">
            Most Popular Courses
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              type="button"
              title="All Internship"
              className="cursor-pointer bg-white text-[#475467] px-4 py-2 rounded-lg font-medium text-sm shadow-[0px_-3px_4px_0px_#0000001F_inset] w-full sm:w-auto"
            >
              All Internship
            </button>
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search for internship"
                className="pl-4 pr-14 py-2 border border-[#EAECF0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Internship Cards */}
        <div className="space-y-3">
          {/* First Internship Card - Highlighted */}
          <div
            className={`flex flex-col lg:flex-row lg:items-center justify-between py-3 px-4 bg-white rounded-2xl border border-[#00000026] transition-colors gap-4 lg:gap-6`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h4 className="font-normal text-lg sm:text-xl text-black font-coolvetica">
                  Product Designer
                </h4>
                <p className="text-[#575757] font-plus-jakarta font-normal text-xs">
                  Google
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 bg-[#00000078] px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-white" color="white" />
                  <span className="text-white font-semibold font-plus-jakarta text-xs hidden sm:inline">
                    Posted 5 minutes ago
                  </span>
                  <span className="text-white font-semibold font-plus-jakarta text-xs sm:hidden">
                    5 min ago
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[#475467] text-xs mb-1 font-medium">
                    Price
                  </p>
                  <p className="font-bold text-black text-sm">$10,000</p>
                </div>
                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[#475467] text-xs mb-1 font-medium">
                    Created On
                  </p>
                  <p className="font-bold text-black text-sm">25 Jul&apos; 23</p>
                </div>
                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[#475467] text-xs mb-1 font-medium">
                    Number Of Applicants
                  </p>
                  <p className="font-bold text-black text-sm">1000</p>
                </div>
              </div>
              <button
                type="button"
                title="Reply"
                className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-[10px] px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset] w-full sm:w-auto justify-center"
              >
                <span className="text-xs font-bold font-plus-jakarta text-[#656565] cursor-pointer">
                  View Internship
                </span>
              </button>
            </div>
          </div>

          {/* Second Internship Card */}
          <div
            className={`flex flex-col lg:flex-row lg:items-center justify-between py-3 px-4 bg-white rounded-2xl border border-[#00000026] transition-colors gap-4 lg:gap-6`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h4 className="font-normal text-lg sm:text-xl text-black font-coolvetica">
                  Product Designer
                </h4>
                <p className="text-[#575757] font-plus-jakarta font-normal text-xs">
                  Google
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 bg-[#00000078] px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-white" color="white" />
                  <span className="text-white font-semibold font-plus-jakarta text-xs hidden sm:inline">
                    Posted 5 minutes ago
                  </span>
                  <span className="text-white font-semibold font-plus-jakarta text-xs sm:hidden">
                    5 min ago
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[#475467] text-xs mb-1 font-medium">
                    Price
                  </p>
                  <p className="font-bold text-black text-sm">$10,000</p>
                </div>
                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[#475467] text-xs mb-1 font-medium">
                    Created On
                  </p>
                  <p className="font-bold text-black text-sm">25 Jul&apos; 23</p>
                </div>
                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[#475467] text-xs mb-1 font-medium">
                    Number Of Applicants
                  </p>
                  <p className="font-bold text-black text-sm">1000</p>
                </div>
              </div>
              <button
                type="button"
                title="Reply"
                className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-[10px] px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset] w-full sm:w-auto justify-center"
              >
                <span className="text-xs font-bold font-plus-jakarta text-[#656565] cursor-pointer">
                  View Internship
                </span>
              </button>
            </div>
          </div>

          {/* Third Internship Card */}
          <div
            className={`flex flex-col lg:flex-row lg:items-center justify-between py-3 px-4 bg-white rounded-2xl border border-[#00000026] transition-colors gap-4 lg:gap-6`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h4 className="font-normal text-lg sm:text-xl text-black font-coolvetica">
                  Product Designer
                </h4>
                <p className="text-[#575757] font-plus-jakarta font-normal text-xs">
                  Google
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 bg-[#00000078] px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-white" color="white" />
                  <span className="text-white font-semibold font-plus-jakarta text-xs hidden sm:inline">
                    Posted 5 minutes ago
                  </span>
                  <span className="text-white font-semibold font-plus-jakarta text-xs sm:hidden">
                    5 min ago
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[#475467] text-xs mb-1 font-medium">
                    Price
                  </p>
                  <p className="font-bold text-black text-sm">$10,000</p>
                </div>
                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[#475467] text-xs mb-1 font-medium">
                    Created On
                  </p>
                  <p className="font-bold text-black text-sm">25 Jul&apos; 23</p>
                </div>
                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[#475467] text-xs mb-1 font-medium">
                    Number Of Applicants
                  </p>
                  <p className="font-bold text-black text-sm">1000</p>
                </div>
              </div>
              <button
                type="button"
                title="Reply"
                className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-[10px] px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset] w-full sm:w-auto justify-center"
              >
                <span className="text-xs font-bold font-plus-jakarta text-[#656565] cursor-pointer">
                  View Internship
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipsAnalytics;
