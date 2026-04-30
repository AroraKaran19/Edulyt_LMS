"use client";

import Link from "next/link";
import Loader from "@/components/ui/Loader";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import useSWR from "swr";
import type { Internship } from "@/types";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import InternshipCard from "../../internships/components/InternshipCard";

const LIST_LIMIT = 6;

/** Homepage internship strip: no category filters, no audience — all active programs (paginated teaser). */
const HomeInternshipSection = () => {
  const [allInternships, setAllInternships] = useState<Internship[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", "1");
    params.append("limit", String(LIST_LIMIT));
    return `${ENDPOINTS.internships.all}?${params.toString()}`;
  }, []);

  const { data, error, isLoading } = useSWR(buildApiUrl(), fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryInterval: 5000,
    dedupingInterval: 1000 * 60,
  });

  useEffect(() => {
    if (data?.data?.data?.internships) {
      const currentPage = data.data.data.page;
      const totalPages = data.data.data.totalPages;
      if (currentPage === 1) {
        setAllInternships(data.data.data.internships);
        setHasMore(currentPage < totalPages);
      }
    } else if (
      data?.data?.data &&
      Array.isArray(data.data.data) &&
      data.data.data.length === 0
    ) {
      setHasMore(false);
    }
  }, [data]);

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
            Check back soon for new programs
          </p>
        </div>
      );
    }

    return (
      <div className="w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
          {allInternships.map((internship: Internship, index: number) => (
            <InternshipCard
              key={`${internship._id || internship.slug}-${index}`}
              internship={internship}
              className="opacity-0 animate-course-card-fade-in"
              style={{ animationDelay: "100ms" }}
            />
          ))}
        </div>
        {hasMore && allInternships.length > 0 && (
          <div className="w-full flex justify-center pt-8">
            <Link
              href="/internships"
              className={cn(
                "inline-flex items-center justify-center bg-white text-black rounded-2xl border border-gray-200 shadow-[inset_0_-2px_2px_0_rgba(0,0,0,0.1)]",
                "px-8 py-2.5 text-sm font-semibold cursor-pointer",
                "lg:px-4 lg:py-2.5",
              )}
            >
              View all internships
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="internships-section w-full bg-white rounded-2xl flex flex-col items-center">
      <div className="courses-container w-full mt-6 md:mt-13">
        {renderContent()}
      </div>
    </section>
  );
};

export default HomeInternshipSection;
