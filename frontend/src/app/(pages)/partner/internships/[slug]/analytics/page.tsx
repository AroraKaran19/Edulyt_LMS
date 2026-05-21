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
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(
    () => new Set(),
  );
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
        setSelectedBatchIds(new Set(d.batches.map((b) => b.batchId)));
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

  const selectedBatches = useMemo(() => {
    if (!data) return [];
    return data.batches.filter((b) => selectedBatchIds.has(b.batchId));
  }, [data, selectedBatchIds]);

  const selectedTotals = useMemo(() => {
    return selectedBatches.reduce(
      (acc, b) => ({
        enrolled: acc.enrolled + b.counts.enrolled,
        appearedInExam: acc.appearedInExam + b.counts.appearedInExam,
        selected: acc.selected + b.counts.selected,
        certified: acc.certified + b.counts.certified,
      }),
      { enrolled: 0, appearedInExam: 0, selected: 0, certified: 0 },
    );
  }, [selectedBatches]);

  const toggleBatch = (batchId: string) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  };

  const filteredStudents = useMemo(() => {
    const all = selectedBatches.flatMap((b) =>
      b.students.map((s) => ({ ...s, batchName: b.name })),
    );
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
  }, [selectedBatches, statusFilter, search]);

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

  const { internship, batches } = data;
  const allBatchesSelected =
    batches.length > 0 && selectedBatchIds.size === batches.length;

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
          {allBatchesSelected
            ? "Totals across all batches"
            : `Totals across ${selectedBatchIds.size} selected ${selectedBatchIds.size === 1 ? "batch" : "batches"}`}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
          <PartnerStatCard
            icon={<Users className="size-5" />}
            value={String(selectedTotals.enrolled)}
            label="Enrolled"
          />
          <PartnerStatCard
            icon={<FileCheck className="size-5" />}
            value={String(selectedTotals.appearedInExam)}
            label="Appeared in Exam"
          />
          <PartnerStatCard
            icon={<Stamp className="size-5" />}
            value={String(selectedTotals.selected)}
            label="Selected / Offer Letter"
          />
          <PartnerStatCard
            icon={<Award className="size-5" />}
            value={String(selectedTotals.certified)}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-base font-semibold text-black sm:text-xl">
                Student lists by batch
              </h2>
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

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#344054]">
                  Batches
                </span>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedBatchIds(
                        new Set(batches.map((b) => b.batchId)),
                      )
                    }
                    className="text-[#F77124] hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBatchIds(new Set())}
                    className="text-[#475467] hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {batches.map((b) => {
                  const active = selectedBatchIds.has(b.batchId);
                  return (
                    <button
                      type="button"
                      key={b.batchId}
                      onClick={() => toggleBatch(b.batchId)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-[#F77124] bg-[#FFF4EB] text-[#B45309]"
                          : "border-gray-300 bg-white text-[#475467] hover:border-[#F77124]/50",
                      )}
                    >
                      {b.name}
                      <span
                        className={cn(
                          "ml-1.5 text-[10px]",
                          active ? "text-[#B45309]/70" : "text-[#98A2B3]",
                        )}
                      >
                        {b.counts.enrolled}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

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
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-[#F2F4F7] text-left">
                    <th className="pb-3 font-semibold text-black">
                      Student Name
                    </th>
                    <th className="pb-3 font-semibold text-black">Email</th>
                    <th className="pb-3 font-semibold text-black">Batch</th>
                    <th className="pb-3 font-semibold text-black">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-10 text-center text-gray-500"
                      >
                        {selectedBatchIds.size === 0
                          ? "Select at least one batch to view students."
                          : search.trim()
                            ? "No students matched your search."
                            : statusFilter === "all"
                              ? "No students in the selected batches."
                              : "No students match this status filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, i) => (
                      <tr
                        key={`${s.email}-${s.batchName}-${i}`}
                        className="border-b border-[#F2F4F7] last:border-0"
                      >
                        <td className="py-3 font-medium text-[#1D2939]">
                          {s.name}
                        </td>
                        <td className="py-3 text-[#344054]">{s.email}</td>
                        <td className="py-3 text-[#475467]">{s.batchName}</td>
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
      </PartnerCard>
    </div>
  );
}
