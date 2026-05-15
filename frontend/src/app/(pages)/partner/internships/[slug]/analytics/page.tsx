"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  ChevronLeft,
  FileCheck,
  Search,
  Stamp,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import Loader from "@/components/ui/Loader";
import usePartner, {
  type PartnerInternshipBatchStudent,
  type PartnerInternshipDetailResponse,
} from "@/hooks/usePartner";

/** Cumulative funnel-stage badges for one student. */
function StatusBadges({ student }: { student: PartnerInternshipBatchStudent }) {
  const badges: { label: string; className: string }[] = [];
  if (student.appearedInExam) {
    badges.push({
      label: "Exam Appeared",
      className: "bg-amber-50 text-amber-700",
    });
  }
  if (student.selected) {
    badges.push({
      label: "Selected",
      className: "bg-violet-50 text-violet-700",
    });
  }
  if (student.certified) {
    badges.push({
      label: "Certified",
      className: "bg-emerald-50 text-emerald-700",
    });
  }
  if (badges.length === 0) {
    badges.push({ label: "Enrolled", className: "bg-gray-100 text-gray-600" });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b.label}
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            b.className,
          )}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

type StatusFilter = "all" | "enrolled" | "exam" | "selected" | "certified";

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "enrolled", label: "Enrolled only" },
  { value: "exam", label: "Exam Appeared" },
  { value: "selected", label: "Selected" },
  { value: "certified", label: "Certified" },
];

export default function PartnerInternshipAnalyticsPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug ?? "");
  const { getInternshipDetail } = usePartner();
  const [data, setData] = useState<PartnerInternshipDetailResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const d = await getInternshipDetail(slug);
        if (cancelled) return;
        setData(d);
        setSelectedBatchId(d.batches[0]?.batchId ?? "");
      } catch (e) {
        console.error("Internship analytics load failed:", e);
        if (!cancelled) toast.error("Could not load internship analytics.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, getInternshipDetail]);

  const selectedBatch = useMemo(
    () => data?.batches.find((b) => b.batchId === selectedBatchId) ?? null,
    [data, selectedBatchId],
  );

  const filteredStudents = useMemo(() => {
    const all = selectedBatch?.students ?? [];
    let byStatus = all;
    if (statusFilter === "exam") {
      byStatus = all.filter((s) => s.appearedInExam);
    } else if (statusFilter === "selected") {
      byStatus = all.filter((s) => s.selected);
    } else if (statusFilter === "certified") {
      byStatus = all.filter((s) => s.certified);
    } else if (statusFilter === "enrolled") {
      byStatus = all.filter(
        (s) => !s.appearedInExam && !s.selected && !s.certified,
      );
    }
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [selectedBatch, statusFilter, search]);

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
            Internship analytics unavailable
          </h2>
          <Link
            href="/partner/internships"
            className="mt-3 inline-block text-sm font-semibold text-[#F77124]"
          >
            Back to internships
          </Link>
        </PartnerCard>
      </div>
    );
  }

  const { internship, totals, batches } = data;

  return (
    <div className="space-y-4 p-2 py-6 sm:p-4">
      <Link
        href="/partner/internships"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#475467] hover:text-[#1D2939]"
      >
        <ChevronLeft className="size-4" />
        Back to internships
      </Link>

      <h1 className="text-lg font-semibold text-black sm:text-2xl">
        {internship.title}
      </h1>

      <div>
        <p className="mb-2 text-sm font-semibold text-[#101828]">
          Totals across all batches
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
          <PartnerStatCard
            icon={<Users className="size-5" />}
            value={String(totals.enrolled)}
            label="Enrolled"
          />
          <PartnerStatCard
            icon={<FileCheck className="size-5" />}
            value={String(totals.appearedInExam)}
            label="Appeared in Exam"
          />
          <PartnerStatCard
            icon={<Stamp className="size-5" />}
            value={String(totals.selected)}
            label="Selected / Offer Letter"
          />
          <PartnerStatCard
            icon={<Award className="size-5" />}
            value={String(totals.certified)}
            label="Cleared with Certificate"
          />
        </div>
      </div>

      <PartnerCard className="p-4 sm:p-5">
        {batches.length === 0 ? (
          <p className="text-sm text-[#667085]">
            None of your students have enrolled in this internship yet.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-black sm:text-xl">
                Student lists by batch
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-[#344054]">Batch</span>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
                  >
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-[#344054]">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as StatusFilter)
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
                  >
                    {STATUS_FILTER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {selectedBatch && (
              <>
                <div className="relative mt-4 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
                  />
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-[#F2F4F7] text-left">
                      <th className="pb-3 font-semibold text-black">
                        Student Name
                      </th>
                      <th className="pb-3 font-semibold text-black">Email</th>
                      <th className="pb-3 font-semibold text-black">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-10 text-center text-gray-500"
                        >
                          {search.trim()
                            ? "No students matched your search."
                            : statusFilter === "all"
                              ? "No students in this batch."
                              : "No students match this status filter."}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s, i) => (
                        <tr
                          key={`${s.email}-${i}`}
                          className="border-b border-[#F2F4F7] last:border-0"
                        >
                          <td className="py-3 font-medium text-[#1D2939]">
                            {s.name}
                          </td>
                          <td className="py-3 text-[#344054]">{s.email}</td>
                          <td className="py-3">
                            <StatusBadges student={s} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </>
        )}
      </PartnerCard>
    </div>
  );
}
