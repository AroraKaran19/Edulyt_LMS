"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import usePartner, { type PartnerStudentRow } from "@/hooks/usePartner";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const statIcons = [
  <Users key="total" className="size-5" />,
  <CheckCircle key="courses" className="size-5" />,
  <CheckCircle key="internships" className="size-5" />,
];

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
};

export default function CollegePartnerStudentsPage() {
  const { listStudents, getDashboard } = usePartner();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PartnerStudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard stats power the strip at the top; they don't depend on the
  // search query so fetched once here.
  const [stats, setStats] = useState<{
    total: number;
    inCourses: number;
    inInternships: number;
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever the search term changes — paging stale across
  // searches confuses users.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listStudents({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
      });
      setRows(data.students);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error("Failed to load students:", e);
      toast.error("Could not load students.");
    } finally {
      setIsLoading(false);
    }
  }, [listStudents, page, debouncedSearch]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    let cancelled = false;
    getDashboard()
      .then((d) => {
        if (cancelled) return;
        setStats({
          total: d.stats.totalStudents,
          inCourses: d.stats.studentsEnrolledInCourses,
          inInternships: d.stats.studentsEnrolledInInternships,
        });
      })
      .catch(() => {
        /* dashboard stats failing shouldn't block the students table */
      });
    return () => {
      cancelled = true;
    };
  }, [getDashboard]);

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const statCards = stats
    ? [
        { key: "total", label: "Total Students", value: stats.total },
        {
          key: "courses",
          label: "Enrolled in Courses",
          value: stats.inCourses,
        },
        {
          key: "internships",
          label: "Enrolled in Internships",
          value: stats.inInternships,
        },
      ]
    : [];

  return (
    <div className="p-2 sm:p-4 py-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-2xl font-semibold text-black">
          Students
        </h1>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
          />
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
          {statCards.map((s, i) => (
            <PartnerStatCard
              key={s.key}
              icon={statIcons[i] ?? statIcons[0]}
              value={s.value}
              label={s.label}
            />
          ))}
        </div>
      )}

      <PartnerCard className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-xl leading-none font-semibold text-black">
            {debouncedSearch ? "Search results" : "Enrolled Students"}
          </h2>
          <span className="text-xs text-[#667085]">{total} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left border-b border-[#F2F4F7]">
                <th className="pb-3 font-semibold text-black">Student Name</th>
                <th className="pb-3 font-semibold text-black">Email</th>
                <th className="pb-3 font-semibold text-black">Phone</th>
                <th className="pb-3 font-semibold text-black">Courses</th>
                <th className="pb-3 font-semibold text-black">Internships</th>
                <th className="pb-3 font-semibold text-black">Joined</th>
                <th className="pb-3 font-semibold text-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    <Loader2 className="mx-auto size-6 animate-spin text-[#F77124]" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    {debouncedSearch
                      ? `No students matched "${debouncedSearch}".`
                      : "No students linked to your college yet."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-[#F2F4F7] last:border-0"
                  >
                    <td className="py-3 font-medium text-[#1D2939]">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="py-3 text-[#344054]">{r.email}</td>
                    <td className="py-3 text-[#344054]">{r.phone || "—"}</td>
                    <td className="py-3 text-[#1D2939] tabular-nums">
                      {r.enrolledCourses}
                    </td>
                    <td className="py-3 text-[#1D2939] tabular-nums">
                      {r.enrolledInternships}
                    </td>
                    <td className="py-3 text-[#475467]">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          r.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600",
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-[#EAECF0] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#667085]">
              Showing{" "}
              <span className="font-semibold tabular-nums text-[#344054]">
                {rangeStart}
              </span>
              {"–"}
              <span className="font-semibold tabular-nums text-[#344054]">
                {rangeEnd}
              </span>{" "}
              of{" "}
              <span className="font-semibold tabular-nums text-[#344054]">
                {total}
              </span>
            </p>
            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <WhiteButton
                  type="button"
                  aria-label="Previous page"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 rounded-full border-[#D0D5DD] px-3 py-2 text-xs font-semibold text-[#344054] shadow-none active:scale-100 lg:px-3! lg:py-2! focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#F77124]"
                >
                  <ChevronLeft className="size-4 shrink-0" aria-hidden />
                  Previous
                </WhiteButton>
                <span className="min-w-22 text-center text-xs font-semibold tabular-nums text-[#1D2939]">
                  Page {page} of {totalPages}
                </span>
                <WhiteButton
                  type="button"
                  aria-label="Next page"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1 rounded-full border-[#D0D5DD] px-3 py-2 text-xs font-semibold text-[#344054] shadow-none active:scale-100 lg:px-3! lg:py-2! focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#F77124]"
                >
                  Next
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </WhiteButton>
              </div>
            ) : null}
          </div>
        ) : null}
      </PartnerCard>
    </div>
  );
}
