"use client";
import Loader from "@/components/ui/Loader";
import { useState, useEffect, useCallback, useRef } from "react";
import InternshipSearchBar from "./InternshipSearchBar";
import { cn } from "@/lib/utils";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import useSWR from "swr";
import { Internship } from "@/types";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import InternshipCard from "./InternshipCard";

const InternshipSection = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [windowWidth, setWindowWidth] = useState(0);
  const [page, setPage] = useState(1);
  const [allInternships, setAllInternships] = useState<Internship[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);
  const firstPageCommittedRef = useRef(false);
  const internshipSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setPage(1);
    setAllInternships([]);
    setHasMore(true);
    firstPageCommittedRef.current = false;
  }, [debouncedSearch]);

  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", "10");
    // Closed programs stay browsable here; the card blocks registration.
    params.append("includeClosed", "true");

    if (debouncedSearch) {
      params.append("search", debouncedSearch);
    }

    const url = `${ENDPOINTS.internships.all}?${params.toString()}`;
    return url;
  }, [page, debouncedSearch]);

  const { data, error, isLoading, isValidating } = useSWR(
    buildApiUrl(),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryInterval: 5000,
      dedupingInterval: 1000 * 60, // 1 minutes
    },
  );

  useEffect(() => {
    if (data?.data?.data?.internships) {
      const currentPage = data.data.data.page;
      const totalPages = data.data.data.totalPages;

      if (currentPage === page) {
        if (page === 1) {
          setAllInternships(data.data.data.internships);
          firstPageCommittedRef.current = true;
        } else {
          setAllInternships((prev) => [...prev, ...data.data.data.internships]);
        }
        setHasMore(currentPage < totalPages);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    } else if (
      data?.data?.data &&
      Array.isArray(data.data.data) &&
      data.data.data.length === 0
    ) {
      setHasMore(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (!firstPageCommittedRef.current) return;
    if (page === 1 && (isLoading || isValidating)) return;
    if (!isLoadingMore && hasMore && !isLoadingRef.current) {
      isLoadingRef.current = true;
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMore, page, isLoading, isValidating]);

  const handleScroll = useCallback(() => {
    if (!internshipSectionRef.current) return;
    if (!firstPageCommittedRef.current) return;
    if (page === 1 && (isLoading || isValidating)) return;

    const internshipSection = internshipSectionRef.current;
    const internshipSectionBottom =
      internshipSection.offsetTop + internshipSection.offsetHeight;
    const windowBottom = window.scrollY + window.innerHeight;
    const isNearBottom = windowBottom >= internshipSectionBottom - 100;
    const now = Date.now();

    if (
      isNearBottom &&
      hasMore &&
      !isLoadingMore &&
      now - lastLoadTimeRef.current > 1000
    ) {
      lastLoadTimeRef.current = now;
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore, page, isLoading, isValidating]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
  }, []);

  const handleDebouncedSearch = useCallback((debouncedValue: string) => {
    setDebouncedSearch(debouncedValue);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth === 0 ? true : windowWidth <= 1046;

  const renderContent = () => {
    if (isLoading && allInternships.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Loader size="lg" variant="spinner" />
        </div>
      );
    }

    if (error) {
      const errorConfig = getErrorUIConfig(error);
      return (
        <div className="col-span-full">
          <Error
            icon={errorConfig.icon}
            iconSize="lg"
            iconColor={errorConfig.iconColor}
            title={errorConfig.title}
            description={errorConfig.description}
            containerHeight="h-64"
          />
        </div>
      );
    }

    if (!isLoading && allInternships.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <p className="text-2xl font-bold text-text-primary font-coolvetica mb-2">
            No internships found
          </p>
          <p className="text-lg text-text-primary/70 text-center wrap-break-words overflow-wrap-anywhere max-w-full">
            {debouncedSearch ? (
              <>
                No results found for &quot;
                <span className="font-medium break-all inline-block max-w-full">
                  {debouncedSearch.length > 50
                    ? `${debouncedSearch.substring(0, 50)}...`
                    : debouncedSearch}
                </span>
                &quot;
              </>
            ) : (
              "No internships match the selected filters"
            )}
          </p>
          <p className="text-sm text-text-primary/50 text-center mt-2">
            Try adjusting your search terms or filters
          </p>
        </div>
      );
    }

    return (
      <div className="w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
          {allInternships.map((internship: Internship, index: number) => (
            <InternshipCard
              key={index}
              internship={internship}
              className="opacity-0 animate-course-card-fade-in"
              style={{ animationDelay: "100ms" }}
            />
          ))}
        </div>
        {isLoadingMore && (
          <div className="w-full flex items-center justify-center py-4">
            <Loader
              size="md"
              variant="spinner"
              text="Loading more internships..."
              showText={true}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      ref={internshipSectionRef}
      className="internships-section w-full bg-white rounded-2xl py-10 px-4 flex flex-col items-center sm:px-[15%] md:px-[10%] xl:px-[15%]"
    >
      <p
        className={cn(
          "internships-section-header w-full text-[44px] font-normal text-text-primary font-coolvetica",
          isMobile ? "text-center" : "text-left",
        )}
      >
        Explore more <span className="text-primary">Internships</span>
      </p>
      <div className="search-container w-full mt-6 flex gap-6 items-stretch flex-col md:flex-row">
        <InternshipSearchBar
          search={search}
          onSearchChange={handleSearchChange}
          onDebouncedSearch={handleDebouncedSearch}
          debounceDelay={500}
        />
      </div>
      <div className="internships-container w-full mt-6 md:mt-13">
        {renderContent()}
      </div>
    </section>
  );
};

export default InternshipSection;
