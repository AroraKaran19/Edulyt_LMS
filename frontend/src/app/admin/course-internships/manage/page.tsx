"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Briefcase, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Select from "@/components/ui/inputs/Select";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Pagination from "@/components/admin/Pagination";
import RowActionsMenu from "@/components/admin/RowActionsMenu";
import InternshipAdminListShell from "../../internships/components/InternshipAdminListShell";
import ProgramUpsertModal from "./components/ProgramUpsertModal";
import DeleteProgramConfirmModal from "./components/DeleteProgramConfirmModal";

type ProgramRow = {
  _id: string;
  title: string;
  slug: string;
  isActive: boolean;
  courseCount: number;
  taskCount: number;
  updatedAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const COL_SPAN = 6;

export default function CourseInternshipProgramsPage() {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProgramRow | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter === "active" || statusFilter === "inactive") {
        params.status = statusFilter;
      }

      const res = await apiClient.get(ENDPOINTS.courseInternships.all, {
        params,
      });
      const d = res.data?.data as {
        programs?: ProgramRow[];
        totalPages?: number;
      };
      setPrograms(d?.programs ?? []);
      setTotalPages(d?.totalPages ?? 1);
    } catch {
      toast.error("Failed to load programs");
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void fetchPrograms();
  }, [fetchPrograms]);

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    statusFilter === "active" ||
    statusFilter === "inactive";

  return (
    <>
      <InternshipAdminListShell
        title="CourseInternship programs"
        subtitle="Internship programs sold as an add-on when a learner buys a course. Attach one to a course from the course builder."
        searchPlaceholder="Search by title…"
        searchValue={search}
        onSearchChange={setSearch}
        headerActions={
          <OrangeButton
            type="button"
            glow={false}
            className="inline-flex items-center gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            Create program
          </OrangeButton>
        }
        filterExtras={
          <div className="sm:w-48">
            <Select
              options={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active only" },
                { value: "inactive", label: "Inactive only" },
              ]}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              placeholder="Status"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[200px]">
                  Program
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Courses
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Tasks
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Updated
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                      <p className="text-gray-500 text-sm">Loading…</p>
                    </div>
                  </td>
                </tr>
              ) : programs.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">
                        No programs found
                      </p>
                      <p className="text-gray-400 text-xs">
                        {hasActiveFilters
                          ? "Try adjusting your filters"
                          : "Create a program, then offer it from a course"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                programs.map((program) => (
                  <tr key={program._id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {program.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        /{program.slug}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 tabular-nums">
                      {program.courseCount}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 tabular-nums">
                      {program.taskCount}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          program.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {program.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(program.updatedAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <RowActionsMenu
                        triggerLabel={`Actions for ${program.title}`}
                        actions={[
                          {
                            key: "edit",
                            label: "Edit program",
                            icon: Edit,
                            onSelect: () => setEditId(program._id),
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </InternshipAdminListShell>

      <ProgramUpsertModal
        isOpen={createOpen || !!editId}
        programId={editId ?? undefined}
        onClose={() => {
          setCreateOpen(false);
          setEditId(null);
        }}
        onSaved={() => {
          setCreateOpen(false);
          setEditId(null);
          void fetchPrograms();
        }}
      />

      <DeleteProgramConfirmModal
        program={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          setDeleteTarget(null);
          void fetchPrograms();
        }}
      />
    </>
  );
}
