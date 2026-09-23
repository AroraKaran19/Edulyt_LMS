"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import EmptyState from "../components/applications/EmptyState";
import { Search, FileX, Loader2 } from "lucide-react";
import ImageComponent from "@/components/ui/ImageComponent";
import useCertificateGroups from "@/hooks/useCertificateGroups";
import type { CertificateGroup } from "@/types/certificateGroup";

const RECENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const PROGRAM_PILL_STYLES: Record<CertificateGroup["programType"], string> = {
  course: "bg-[#FFF6F2] text-[#E25C12] border border-[#F66F221F]",
  internship: "bg-indigo-50 text-[#4338CA] border border-indigo-100",
};

const PROGRAM_LABELS: Record<CertificateGroup["programType"], string> = {
  course: "Course",
  internship: "Internship",
};

const CertificatesPage = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { groups, isLoading, hasFetched, fetchCertificateGroups } =
    useCertificateGroups();
  const [nowMs] = useState(() => Date.now());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const tabs = [{ label: "All" }, { label: "Recent" }];

  useEffect(() => {
    fetchCertificateGroups();
  }, [fetchCertificateGroups]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const isSearchActive = debouncedSearch.trim().length > 0;
  const isSearching = search !== debouncedSearch && search.trim().length > 0;
  const hasCertificates = groups.length > 0;

  const displayedGroups = useMemo(() => {
    let result = groups;

    if (activeTab === "Recent") {
      result = result.filter(
        (group) => nowMs - new Date(group.latestIssuedAt).getTime() <= RECENT_WINDOW_MS,
      );
    }

    const query = debouncedSearch.trim().toLowerCase();
    if (query) {
      result = result.filter((group) => group.title.toLowerCase().includes(query));
    }

    return result;
  }, [groups, activeTab, debouncedSearch, nowMs]);

  const hasSearchResults = displayedGroups.length > 0;

  return (
    <div className="flex flex-col min-h-[60vh]">
      <div className="py-4">
        {!hasFetched || (isLoading && groups.length === 0) ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-gray-600">Loading certificates...</div>
          </div>
        ) : !hasCertificates && !isSearchActive ? (
          // Empty State - when no certificates at all
          <EmptyState
            title="Certificates"
            description="No certificates found! Complete courses to get certificates."
            buttonText="Explore for Courses!"
            href="/programs"
          />
        ) : (
          <>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
              My Certificates
            </h1>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex gap-1 sm:gap-2 rounded-lg border border-[#F66F221F] bg-[#FFF6F2] p-1 sm:px-2 sm:py-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    title={tab.label}
                    key={tab.label}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.label
                        ? "bg-orange-500 text-white shadow"
                        : "text-black hover:bg-gray-200"
                    }`}
                    onClick={() => handleTabChange(tab.label)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search, Filter, Sort */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full lg:w-auto">
                <div className="relative order-1 sm:order-0">
                  <input
                    type="text"
                    placeholder="Search certificates by name or program"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="placeholder:text-[#0000003D] placeholder:text-xs w-full sm:w-[240px] md:w-[320px] lg:w-[380px] h-10 sm:h-12 px-3 sm:px-4 pr-10 sm:pr-12 bg-[#F5F5F5] rounded-xl border border-[#00000026] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-[0px_4px_4px_0px_#00000012_inset]"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 p-1.5 sm:p-2 rounded-lg hover:bg-orange-600 transition"
                    title="Search"
                  >
                    <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Section - Independent from search bar */}
            {isSearching ? (
              // Loading State - when search is being debounced
              <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-600">Searching certificates...</p>
              </div>
            ) : isSearchActive && !hasSearchResults ? (
              // Not Found State - when searching and no results
              <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <FileX className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  No Certificates Found
                </h2>
                <p className="text-gray-600 text-center max-w-md mb-6">
                  We couldn&apos;t find any certificates matching &quot;
                  {debouncedSearch}&quot;. Try searching with a different term
                  or check your spelling.
                </p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="cursor-pointer px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-md"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {displayedGroups.map((group) => (
                  <Link
                    key={`${group.programType}-${group.programId}`}
                    href={`/dashboard/certificates/${group.programType}/${group.programId}`}
                    className="bg-white border border-[#0000001F] rounded-xl flex flex-col justify-between p-3 sm:p-4 w-full shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="relative w-full h-24 xs:h-28 sm:h-32 md:h-36 rounded-xl overflow-hidden mb-2 sm:mb-3 pt-2 sm:pt-4 px-2 sm:px-3 border border-[#00000017]">
                        <ImageComponent
                          src={group.thumbnail || "/certificates-user-icon.svg"}
                          alt={group.title}
                          width={259}
                          height={188}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold mb-2 ${PROGRAM_PILL_STYLES[group.programType]}`}
                      >
                        {PROGRAM_LABELS[group.programType]}
                      </span>
                      <div className="font-extrabold text-xs sm:text-sm mb-2 text-black line-clamp-2 leading-tight">
                        {group.title}
                      </div>
                    </div>

                    <div className="border-t border-[#00000012] pt-2 mt-1 text-[11px] font-semibold text-gray-600">
                      {group.documents.length}{" "}
                      {group.documents.length === 1 ? "document" : "documents"}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;
