"use client";
import Card from "./dashboard/ui/Card";
import Image from "next/image";
import useDashboardStats from "@/hooks/useDashboardStats";
import useCertificates from "@/hooks/useCertificates";
import { useSession } from "next-auth/react";
import Loader from "@/components/ui/Loader";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMyInternshipEnrollmentTotal } from "@/hooks/useMyInternshipEnrollments";

const DashboardBanner = () => {
  const { data: session } = useSession();
  const { stats, isLoading } = useDashboardStats();
  const [internshipCount, setInternshipCount] = useState<number>(0);
  const { total: certificateCount, fetchCertificates } = useCertificates();

  useEffect(() => {
    let cancelled = false;
    fetchMyInternshipEnrollmentTotal()
      .then((t) => { if (!cancelled) setInternshipCount(t); })
      .catch(() => { if (!cancelled) setInternshipCount(0); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetchCertificates({ page: 1, limit: 1 });
  }, [fetchCertificates]);

  const hour = new Date().getHours();
  const timeMessage =
    hour >= 18
      ? "Good Evening"
      : hour >= 12
      ? "Good Afternoon"
      : "Good Morning";

  // Get user name from session
  const userName = session?.user?.firstName
    ? `${session?.user.firstName} ${session?.user.lastName}`
    : session?.user?.email?.split("@")[0] || "User";
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  if (isLoading) {
    return (
      <div className="flex w-full py-6 px-4 sm:px-8 lg:px-20 flex-col lg:flex-row gap-4 lg:gap-0 shadow-[0_2px_0_rgba(0,0,0,0.1)]">
        <div className="w-max flex flex-col gap-1 text-text-primary whitespace-nowrap">
          <h2 className="text-xl sm:text-2xl font-bold">
            {timeMessage}, {displayName}
          </h2>
          <p className="text-sm font-semibold">Welcome to Airkrit!</p>
        </div>
        <div className="ml-auto w-max flex items-center gap-2 sm:gap-4 lg:gap-6 flex-wrap">
          <div className="flex py-2 px-2.5 w-[138px] items-center gap-2 rounded-lg border border-gray-200 overflow-hidden">
            <Loader size="sm" variant="spinner" />
          </div>
          <div className="flex py-2 px-2.5 w-[138px] items-center gap-2 rounded-lg border border-gray-200 overflow-hidden">
            <Loader size="sm" variant="spinner" />
          </div>
          <div className="flex py-2 px-2.5 w-[138px] items-center gap-2 rounded-lg border border-gray-200 overflow-hidden">
            <Loader size="sm" variant="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full py-6 px-4 sm:px-8 lg:px-20 flex-col lg:flex-row gap-4 lg:gap-0 shadow-[0_2px_0_rgba(0,0,0,0.1)]">
      <div className="w-max flex flex-col gap-1 text-text-primary whitespace-nowrap">
        <h2 className="text-xl sm:text-2xl font-bold">
          {timeMessage}, {displayName}
        </h2>
        <p className="text-sm font-semibold">Welcome to Airkrit!</p>
      </div>
      <div className="ml-auto w-max flex items-center gap-2 sm:gap-4 lg:gap-6 flex-wrap">
        <Card
          title="Courses"
          count={stats?.totalCourses || 0}
          icon={
            <Image
              src="/dashboard/CourseBannerIcon.svg"
              width={24}
              height={24}
              alt="courses"
              draggable={false}
            />
          }
        />
        <Card
          title="Certificates"
          count={certificateCount}
          icon={
            <Image
              src="/dashboard/CertificateBannerIcon.svg"
              width={24}
              height={24}
              alt="certificates"
              draggable={false}
            />
          }
        />
        <Card
          title="Internships"
          count={internshipCount}
          icon={
            <Image
              src="/dashboard/CourseBannerIcon.svg"
              width={24}
              height={24}
              alt="internships"
              draggable={false}
            />
          }
        />
      </div>
    </div>
  );
};

export default DashboardBanner;
