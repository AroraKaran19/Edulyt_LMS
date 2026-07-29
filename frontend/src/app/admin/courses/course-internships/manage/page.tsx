"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  Calendar,
  Edit3,
  Filter,
  ListChecks,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Pagination from "@/components/admin/Pagination";
import RowActionsMenu from "@/components/admin/RowActionsMenu";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import DeleteProgramConfirmModal from "./components/DeleteProgramConfirmModal";

const LIST_BASE = "/admin/courses/course-internships/manage";

type ProgramRow = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  isActive: boolean;
  courseCount: number;
  taskCount: number;
  updatedAt?: string;
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

/** Descriptions are authored as rich text; cards show a plain-text preview. */
const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getStatusColor = (isActive: boolean) =>
  isActive
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-gray-100 text-gray-800 border-gray-200";

export default function CourseInternshipProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ProgramRow | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterStatus === "active" || filterStatus === "inactive") {
        params.status = filterStatus;
      }

      const res = await apiClient.get(ENDPOINTS.courseInternships.all, {
        params,
      });
      const d = res.data?.data as {
        programs?: ProgramRow[];
        totalPages?: number;
        total?: number;
      };
      setPrograms(d?.programs ?? []);
      setTotalPages(d?.totalPages ?? 1);
      setTotal(d?.total ?? 0);
    } catch {
      toast.error("Failed to load programs");
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, filterStatus]);

  useEffect(() => {
    void fetchPrograms();
  }, [fetchPrograms]);

  const hasFilters = Boolean(debouncedSearch) || Boolean(filterStatus);

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              CourseInternship Programs
            </h1>
            <p className="text-gray-600 mt-1">
              {total} {total === 1 ? "program" : "programs"} total sold as an
              add-on when a learner buys a course
            </p>
          </div>
          <OrangeButton
            onClick={() => router.push(`${LIST_BASE}/create`)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Program
          </OrangeButton>
        </div>

        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <InfiniteScrollSelect
                label="Status"
                placeholder="All statuses"
                value={filterStatus}
                onChange={(value) => {
                  setFilterStatus(typeof value === "string" ? value : "");
                  setPage(1);
                }}
                multi={false}
                showSearch={false}
                fetchOptions={async () => ({
                  items: [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ],
                  totalPages: 1,
                })}
                searchPlaceholder="Search status..."
                emptyMessage="No status found"
              />
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search programs…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoading && programs.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Briefcase className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">No programs found</p>
          <p className="text-gray-400 text-sm mt-1">
            {hasFilters
              ? "Try adjusting your filters"
              : "Create a program, then offer it from a course"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {programs.map((program) => (
              <div
                key={program._id}
                className="bg-white rounded-xl flex flex-col border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="relative h-48 bg-gray-100 shrink-0 rounded-t-xl overflow-hidden">
                  {program.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={program.thumbnail}
                      alt={program.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Briefcase className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        program.isActive,
                      )}`}
                    >
                      {program.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {stripHtml(program.description || "") ||
                      "No description yet."}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(program.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {program.courseCount}{" "}
                      {program.courseCount === 1 ? "course" : "courses"}
                    </div>
                    <div className="flex items-center gap-1">
                      <ListChecks className="w-3 h-3" />
                      {program.taskCount}{" "}
                      {program.taskCount === 1 ? "task" : "tasks"}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-end">
                    <RowActionsMenu
                      triggerLabel={`Actions for ${program.title}`}
                      actions={[
                        {
                          key: "edit",
                          label: "Edit program",
                          icon: Edit3,
                          onSelect: () =>
                            router.push(`${LIST_BASE}/edit/${program._id}`),
                        },
                        {
                          key: "delete",
                          label: "Delete program",
                          icon: Trash2,
                          tone: "danger",
                          separatorBefore: true,
                          onSelect: () => setDeleteTarget(program),
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <DeleteProgramConfirmModal
        program={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          setDeleteTarget(null);
          void fetchPrograms();
        }}
      />
    </div>
  );
}
