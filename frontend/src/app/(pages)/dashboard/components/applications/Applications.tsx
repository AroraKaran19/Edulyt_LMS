"use client";
import React, { useState } from "react";
import { Search, Filter, Clock } from "lucide-react";
import Image from "next/image";
import ReviewApplicationModal from "./ReviewApplicationModal";
import EmptyState from "./EmptyState";

const internships = [
  {
    title: "Product Designer",
    company: "Google",
    postedTime: "5 minutes ago",
    application_status: "Applied",
    applied_on: "25 Jul' 23",
    applicants: "1000",
  },
  {
    title: "Product Designer",
    company: "Google",
    postedTime: "5 minutes ago",
    application_status: "Applied",
    applied_on: "25 Jul' 23",
    applicants: "1000",
  },
  {
    title: "Product Designer",
    company: "Google",
    postedTime: "5 minutes ago",
    application_status: "Applied",
    applied_on: "25 Jul' 23",
    applicants: "1000",
  },
  {
    title: "Product Designer",
    company: "Google",
    postedTime: "5 minutes ago",
    application_status: "Applied",
    applied_on: "25 Jul' 23",
    applicants: "1000",
  },
];

// const internships: any[] = [];

const InternshipCard = ({
  title,
  company,
  postedTime,
  application_status,
  applied_on,
  applicants,
  onReviewClick,
}: any) => (
  <div
    className={`flex flex-col lg:flex-row lg:items-center justify-between py-3 px-4 bg-white rounded-2xl border border-[#00000026] transition-colors gap-4 lg:gap-6`}
  >
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <h4 className="font-normal text-lg sm:text-xl text-black font-coolvetica">
          {title}
        </h4>
        <p className="text-[#575757] font-plus-jakarta font-normal text-xs">
          {company}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1 bg-[#00000078] px-2 py-1 rounded-full">
          <Clock className="w-3 h-3 text-white" color="white" />
          <span className="text-white font-semibold font-plus-jakarta text-xs hidden sm:inline">
            Posted {postedTime}
          </span>
          <span className="text-white font-semibold font-plus-jakarta text-xs sm:hidden">
            {postedTime}
          </span>
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
        <div className="text-left flex-1 sm:flex-none">
          <p className="text-[#475467] text-xs mb-1 font-medium">
            Application Status
          </p>
          <p className="flex flex-row justify-start items-center gap-2">
            <span className="text-[#5D00FF] text-lg">•</span>
            <span className="font-bold text-black text-sm font-plus-jakarta">
              {application_status}
            </span>
          </p>
        </div>
        <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
        <div className="text-left flex-1 sm:flex-none">
          <p className="text-[#475467] text-xs mb-1 font-medium">Applied On</p>
          <p className="font-bold text-black text-sm">{applied_on}</p>
        </div>
        <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
        <div className="text-left flex-1 sm:flex-none">
          <p className="text-[#475467] text-xs mb-1 font-medium">
            Number Of Applicants
          </p>
          <p className="font-bold text-black text-sm">{applicants}</p>
        </div>
      </div>
      <button
        type="button"
        title="Reply"
        className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-[10px] px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset] w-full sm:w-auto justify-center"
        onClick={onReviewClick}
      >
        <span className="text-xs font-bold font-plus-jakarta text-[#656565] cursor-pointer">
          Review Application
        </span>
      </button>
    </div>
  </div>
);

const Applications = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const handleReviewClick = (application: any) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
  };

  const tabs = [{ label: "All" }, { label: "Recent" }];

  return (
    <div className="px-3 sm:px-4 md:px-8 lg:px-20 pb-4">
      {/* Conditional Rendering */}
      {internships.length === 0 ? (
        <EmptyState title="Applications" />
      ) : (
        <>
          {/* Header and Tabs */}
          <div className="flex flex-col mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                My Applications
              </h1>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                <div className="flex gap-1 sm:gap-2 rounded-xl border border-[#F66F221F] bg-[#FFF6F2] p-1 sm:px-2 sm:py-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      type="button"
                      title={tab.label}
                      key={tab.label}
                      className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.label
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
                      placeholder="Search a application by its name or company name"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="placeholder:text-[#0000003D] placeholder:text-xs w-full sm:w-[280px] md:w-[380px] h-10 sm:h-12 px-3 sm:px-4 pr-10 sm:pr-12 bg-[#F5F5F5] rounded-xl border border-[#00000026] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-[0px_4px_4px_0px_#00000012_inset]"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 p-1.5 sm:p-2 rounded-lg hover:bg-orange-600 transition"
                      title="Search"
                    >
                      <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex gap-2 order-2 sm:order-none">
                    <button
                      type="button"
                      className="flex items-center gap-1 border border-[#00000026] rounded-xl px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold text-[#2B1508] hover:bg-gray-200 cursor-pointer"
                    >
                      <span className="hidden sm:inline">Filter</span>
                      <span className="sm:hidden">Filter</span>
                      <Filter size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 border border-[#00000026] rounded-xl px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold text-[#2B1508] hover:bg-gray-200 cursor-pointer"
                    >
                      <span className="hidden sm:inline">Sort by</span>
                      <span className="sm:hidden">Sort</span>
                      <Image
                        src="/sort.svg"
                        alt="sort"
                        width={16}
                        height={16}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 my-6">
                {internships.map((internship, index) => (
                  <InternshipCard
                    key={index}
                    {...internship}
                    onReviewClick={() => handleReviewClick(internship)}
                  />
                ))}
              </div>

              {/* Modal */}
              {isModalOpen && (
                <ReviewApplicationModal
                  application={selectedApplication}
                  onClose={closeModal}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Applications;
