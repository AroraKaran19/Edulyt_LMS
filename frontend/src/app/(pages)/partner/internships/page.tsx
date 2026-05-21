"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  FileCheck,
  GraduationCap,
  Stamp,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import PartnerEntityCard from "@/components/ui/partner/PartnerEntityCard";
import Loader from "@/components/ui/Loader";
import usePartner, {
  type PartnerInternshipsResponse,
} from "@/hooks/usePartner";

export default function PartnerInternshipsPage() {
  const { getInternships } = usePartner();
  const [data, setData] = useState<PartnerInternshipsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const d = await getInternships();
        if (!cancelled) setData(d);
      } catch (e) {
        console.error("Partner internships load failed:", e);
        if (!cancelled) toast.error("Could not load internships.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getInternships]);

  if (isLoading && !data) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader size="xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <PartnerCard className="p-6 text-center">
          <h2 className="text-base font-semibold text-gray-900">
            Internships unavailable
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We couldn&apos;t load internship analytics. Please refresh.
          </p>
        </PartnerCard>
      </div>
    );
  }

  const { stats, internships } = data;
  const statCards = [
    {
      key: "internships",
      label: "Internships",
      value: stats.totalInternships,
      icon: <Briefcase className="size-5" />,
    },
    {
      key: "registered",
      label: "Registered",
      value: stats.totalEnrolled,
      icon: <Users className="size-5" />,
    },
    {
      key: "exam",
      label: "Appeared in Exam",
      value: stats.appearedInExam,
      icon: <FileCheck className="size-5" />,
    },
    {
      key: "offerLetters",
      label: "Offer Letters Received",
      value: stats.offerLettersReceived,
      icon: <Stamp className="size-5" />,
    },
    {
      key: "certs",
      label: "Completed / Certified",
      value: stats.certificatesIssued,
      icon: <GraduationCap className="size-5" />,
    },
  ];

  return (
    <div className="space-y-4 p-2 py-6 sm:p-4">
      <h1 className="text-lg font-semibold text-black sm:text-2xl">
        Internships
      </h1>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {statCards.map((s) => (
          <PartnerStatCard
            key={s.key}
            icon={s.icon}
            value={String(s.value)}
            label={s.label}
          />
        ))}
      </div>

      <PartnerCard className="p-4 sm:p-5">
        <h2 className="text-base font-semibold text-black sm:text-xl">
          Internships your students are enrolled in
        </h2>
        {internships.length === 0 ? (
          <p className="mt-4 text-sm text-[#667085]">
            None of your students have enrolled in an internship yet.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {internships.map((i) => (
              <PartnerEntityCard
                key={i.internshipId}
                href={`/partner/internships/${encodeURIComponent(
                  i.slug,
                )}/analytics`}
                title={i.title}
                thumbnail={i.thumbnail}
                tags={[]}
                metricLabel="students enrolled"
                metricValue={i.studentsEnrolled}
              />
            ))}
          </div>
        )}
      </PartnerCard>
    </div>
  );
}
