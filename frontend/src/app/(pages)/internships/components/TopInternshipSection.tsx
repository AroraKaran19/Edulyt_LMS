"use client";
import InternshipCarousel from "./InternshipCarousel";
import Loader from "@/components/ui/Loader";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import type { InternshipPublicListing } from "@/types/internship";
import { ERROR_TYPES } from "@/constants/error/statusCodes";
import useSWR from "swr";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";

const TopInternshipSection = () => {
  const { data, error, isLoading } = useSWR(
    ENDPOINTS.internships.featured,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryInterval: 5000,
      dedupingInterval: 1000 * 60, // 1 minutes
    }
  );

  const internships: InternshipPublicListing[] =
    data?.data?.data?.internships || [];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader
            size="lg"
            variant="spinner"
            text="Loading featured internships..."
            showText={true}
          />
        </div>
      );
    }

    if (error) {
      const errorConfig = getErrorUIConfig({
        errorType: ERROR_TYPES.BACKEND_ERROR,
        statusCode: 500,
      });
      return (
        <Error
          icon={errorConfig.icon}
          iconSize="lg"
          iconColor={errorConfig.iconColor}
          title={errorConfig.title}
          description={errorConfig.description}
          containerHeight="h-64"
        />
      );
    }

    if (!internships || internships.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-gray-600">No internships available at the moment.</p>
          </div>
        </div>
      );
    }

    return <InternshipCarousel internships={internships} />;
  };

  return (
    <section className="top-internships-section w-full bg-white rounded-2xl py-10 flex flex-col items-center">
      <h1 className="text-lg font-normal text-text-primary">Internships</h1>
      <h2 className="text-[44px] mt-3 text-text-primary font-coolvetica leading-tight text-center text-wrap-balance">
        Our Best <span className="text-primary">Internships</span> <br />
        you can Enroll now!
      </h2>
      <div className="top-internships-carousel w-full mt-10 relative">
        <div className="hidden md:absolute w-full h-full bg-linear-to-r from-white/40 via-transparent to-white/40 z-10 pointer-events-none" />
        {renderContent()}
      </div>
    </section>
  );
};

export default TopInternshipSection;
