"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { CertificationExamCohortRow } from "@/types";
import Input from "@/components/ui/inputs/Input";
import Select, { type SelectOption } from "@/components/ui/inputs/Select";

const SORT_OPTIONS: SelectOption[] = [
  { value: "newest", label: "Cohort start (soonest)" },
  { value: "oldest", label: "Cohort start (latest)" },
  { value: "a-z", label: "Program A–Z" },
  { value: "z-a", label: "Program Z–A" },
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function CertificationExamsAdminPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CertificationExamCohortRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        ENDPOINTS.internshipEnrollments.adminCertificationExamCohorts,
      );
      const cohorts = res.data?.data?.cohorts as
        | CertificationExamCohortRow[]
        | undefined;
      setRows(Array.isArray(cohorts) ? cohorts : []);
    } catch {
      toast.error("Failed to load certification exam cohorts");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [search]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    let list = q
      ? rows.filter(
          (r) =>
            r.internshipTitle.toLowerCase().includes(q) ||
            r.batchName.toLowerCase().includes(q) ||
            r.examTitle.toLowerCase().includes(q),
        )
      : [...rows];
    if (sortBy === "a-z") {
      list.sort((a, b) => a.internshipTitle.localeCompare(b.internshipTitle));
    } else if (sortBy === "z-a") {
      list.sort((a, b) => b.internshipTitle.localeCompare(a.internshipTitle));
    } else if (sortBy === "newest") {
      list.sort(
        (a, b) =>
          new Date(a.internshipStartDate).getTime() -
          new Date(b.internshipStartDate).getTime(),
      );
    } else if (sortBy === "oldest") {
      list.sort(
        (a, b) =>
          new Date(b.internshipStartDate).getTime() -
          new Date(a.internshipStartDate).getTime(),
      );
    }
    return list;
  }, [rows, debouncedSearch, sortBy]);

  const hasActiveFilters = Boolean(debouncedSearch) || sortBy !== "newest";

  const goToCohort = (r: CertificationExamCohortRow) => {
    const q = new URLSearchParams({
      internshipId: r.internshipId,
      batchId: r.batchId,
      examId: r.examId,
    });
    router.push(`/admin/internships/certification-exams/cohort?${q.toString()}`);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Certification exams
        </h1>
        <p className="text-gray-600 mt-1">
          Cohorts with a certification exam — open a row to view enrolled
          learners and submissions.
        </p>
        <p className="text-sm text-amber-900/90 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2 mt-3 max-w-3xl leading-relaxed">
          Operations: learners should complete certification while still{" "}
          <span className="font-medium">enrolled</span>—once an enrollment is{" "}
          <span className="font-medium">Completed</span>, certification cannot be run on it.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by program, batch, or exam name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="sm:w-56">
            <Select
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort by"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[220px]">
                  Program
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[140px]">
                  Batch
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[180px]">
                  Certification exam
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">
                  Apply by
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">
                  Cohort starts
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                      <p className="text-gray-500 text-sm">Loading…</p>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">
                        No cohorts with a certification exam
                      </p>
                      <p className="text-gray-400 text-sm max-w-md">
                        Link a certification exam template to a batch in Manage
                        internships.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">No matches</p>
                      {hasActiveFilters ? (
                        <p className="text-gray-400 text-sm">
                          Try adjusting search or sort
                        </p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={`${r.internshipId}-${r.batchId}-cert`}
                    onClick={() => goToCohort(r)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 sm:px-6 py-4 min-w-[220px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {r.internshipTitle}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {r.internshipSlug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-[200px]">
                      <span className="line-clamp-2">{r.batchName}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 min-w-[180px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="line-clamp-2">{r.examTitle}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(r.applicationLastDate)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(r.internshipStartDate)}
                    </td>
                    <td
                      className="px-4 sm:px-6 py-4 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-orange-600 font-medium">Open</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
