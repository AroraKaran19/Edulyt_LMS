"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  GraduationCap,
  Percent,
  Search,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import Loader from "@/components/ui/Loader";
import usePartner, {
  type PartnerCourseDetailResponse,
} from "@/hooks/usePartner";

export default function PartnerCourseAnalyticsPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug ?? "");
  const { getCourseDetail } = usePartner();
  const [data, setData] = useState<PartnerCourseDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const d = await getCourseDetail(slug);
        if (!cancelled) setData(d);
      } catch (e) {
        console.error("Course analytics load failed:", e);
        if (!cancelled) toast.error("Could not load course analytics.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, getCourseDetail]);

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
            Course analytics unavailable
          </h2>
          <Link
            href="/partner/courses"
            className="mt-3 inline-block text-sm font-semibold text-[#F77124]"
          >
            Back to courses
          </Link>
        </PartnerCard>
      </div>
    );
  }

  const { course, stats, students } = data;

  const query = search.trim().toLowerCase();
  const filteredStudents = query
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query),
      )
    : students;

  return (
    <div className="space-y-4 p-2 py-6 sm:p-4">
      <Link
        href="/partner/courses"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#475467] hover:text-[#1D2939]"
      >
        <ChevronLeft className="size-4" />
        Back to courses
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-black sm:text-2xl">
          {course.title}
        </h1>
        <p className="text-sm text-[#475467]">
          {course.categories.length > 0
            ? course.categories.join(", ")
            : "Uncategorised"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-3">
        <PartnerStatCard
          icon={<Users className="size-5" />}
          value={String(stats.studentsEnrolled)}
          label="Students Enrolled"
        />
        <PartnerStatCard
          icon={<GraduationCap className="size-5" />}
          value={String(stats.certificatesIssued)}
          label="Certificates Received"
        />
        <PartnerStatCard
          icon={<Percent className="size-5" />}
          value={`${stats.averageCompletion}%`}
          label="Average Completion"
        />
      </div>

      <PartnerCard className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-black sm:text-xl">
            Enrolled Students
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
              />
            </div>
            <span className="shrink-0 text-xs text-[#667085]">
              {filteredStudents.length} of {students.length}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[#F2F4F7] text-left">
                <th className="pb-3 font-semibold text-black">Student Name</th>
                <th className="pb-3 font-semibold text-black">Email</th>
                <th className="pb-3 font-semibold text-black">Completion</th>
                <th className="pb-3 font-semibold text-black">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500">
                    {query
                      ? "No students matched your search."
                      : "No students enrolled in this course yet."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr
                    key={s.userId}
                    className="border-b border-[#F2F4F7] last:border-0"
                  >
                    <td className="py-3 font-medium text-[#1D2939]">
                      {s.name}
                    </td>
                    <td className="py-3 text-[#344054]">{s.email}</td>
                    <td className="py-3 tabular-nums text-[#1D2939]">
                      {s.completion}%
                    </td>
                    <td className="py-3">
                      <span
                        className={
                          s.certified
                            ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                        }
                      >
                        {s.certified ? "Issued" : "Not issued"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PartnerCard>
    </div>
  );
}
