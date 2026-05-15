"use client";

import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Layers, Users } from "lucide-react";
import { toast } from "react-toastify";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import PartnerCategoryPie from "@/components/ui/partner/PartnerCategoryPie";
import PartnerEntityCard from "@/components/ui/partner/PartnerEntityCard";
import Loader from "@/components/ui/Loader";
import usePartner, { type PartnerCoursesResponse } from "@/hooks/usePartner";

export default function PartnerCoursesPage() {
  const { getCourses } = usePartner();
  const [data, setData] = useState<PartnerCoursesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const d = await getCourses();
        if (!cancelled) setData(d);
      } catch (e) {
        console.error("Partner courses load failed:", e);
        if (!cancelled) toast.error("Could not load courses.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getCourses]);

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
            Courses unavailable
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We couldn&apos;t load course analytics. Please refresh.
          </p>
        </PartnerCard>
      </div>
    );
  }

  const { stats, categoryBreakdown, courses } = data;
  const statCards = [
    {
      key: "courses",
      label: "Courses",
      value: stats.totalCourses,
      icon: <BookOpen className="size-5" />,
    },
    {
      key: "enrollments",
      label: "Course Enrolments",
      value: stats.totalEnrollments,
      icon: <Layers className="size-5" />,
    },
    {
      key: "learners",
      label: "Distinct Learners",
      value: stats.distinctLearners,
      icon: <Users className="size-5" />,
    },
    {
      key: "certs",
      label: "Certificates Issued",
      value: stats.certificatesIssued,
      icon: <GraduationCap className="size-5" />,
    },
  ];

  return (
    <div className="space-y-4 p-2 py-6 sm:p-4">
      <h1 className="text-lg font-semibold text-black sm:text-2xl">Courses</h1>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
        {statCards.map((s) => (
          <PartnerStatCard
            key={s.key}
            icon={s.icon}
            value={String(s.value)}
            label={s.label}
          />
        ))}
      </div>

      <PartnerCategoryPie data={categoryBreakdown} />

      <PartnerCard className="p-4 sm:p-5">
        <h2 className="text-base font-semibold text-black sm:text-xl">
          Courses your students are enrolled in
        </h2>
        {courses.length === 0 ? (
          <p className="mt-4 text-sm text-[#667085]">
            None of your students have enrolled in a course yet.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((c) => (
              <PartnerEntityCard
                key={c.courseId}
                href={`/partner/courses/${encodeURIComponent(c.slug)}/analytics`}
                title={c.title}
                thumbnail={c.thumbnail}
                tags={c.categories}
                metricLabel="students enrolled"
                metricValue={c.studentsEnrolled}
              />
            ))}
          </div>
        )}
      </PartnerCard>
    </div>
  );
}
