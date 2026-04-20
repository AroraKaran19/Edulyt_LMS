"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Select from "@/components/ui/inputs/Select";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import InternshipAdminListShell from "../components/InternshipAdminListShell";
import ExamUpsertModal from "./components/ExamUpsertModal";
import ExamDetailModal from "./components/ExamDetailModal";
import DeleteExamConfirmModal from "./components/DeleteExamConfirmModal";

type ExamRow = {
  _id: string;
  title: string;
  questionCount: number;
  totalScore: number;
  thresholdScore?: number;
  examResultAt?: string;
  isActive: boolean;
  updatedAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
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

const COL_SPAN = 8;

export default function InternshipExamTemplatesAdminPage() {
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    preview: string;
  } | null>(null);
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

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 10,
        status: statusFilter,
      };
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await apiClient.get(ENDPOINTS.internshipExams.adminList, {
        params,
      });
      const d = res.data?.data as {
        exams?: ExamRow[];
        totalPages?: number;
        total?: number;
      };
      const rows = d?.exams ?? [];
      setExams(
        rows.map((r) => ({
          ...r,
          questionCount:
            typeof r.questionCount === "number" ? r.questionCount : 0,
        })),
      );
      setTotalPages(d?.totalPages ?? 1);
      setTotal(d?.total ?? 0);
    } catch {
      toast.error("Failed to load exam templates");
      setExams([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void fetchExams();
  }, [fetchExams]);

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    statusFilter === "active" ||
    statusFilter === "inactive";

  const upsertOpen = createOpen || !!editId;
  const upsertMode = editId ? "edit" : "create";

  const openDelete = (id: string, preview: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({ id, preview });
  };

  const openEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditId(id);
  };

  return (
    <>
      <InternshipAdminListShell
        title="Exam templates"
        subtitle="Reusable exam templates with question sets, linked to batches in Manage Internships."
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
            Create template
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
          <table className="w-full min-w-[960px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase min-w-[180px]">
                  Title
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Questions
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Score
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Merit ≥
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Results at
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Active
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Updated
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
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
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <HelpCircle className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">
                        No exam templates found
                      </p>
                      {hasActiveFilters ? (
                        <p className="text-gray-400 text-sm">
                          Try adjusting your search or status filter
                        </p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                exams.map((e) => (
                  <tr
                    key={e._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailId(e._id)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        setDetailId(e._id);
                      }
                    }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <span className="line-clamp-2 font-medium">
                        {e.title || "—"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">
                      {e.questionCount}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">
                      {e.totalScore}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">
                      {typeof e.thresholdScore === "number"
                        ? e.thresholdScore
                        : "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(e.examResultAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          e.isActive
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {e.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(e.updatedAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(ev) => openEdit(e._id, ev)}
                          className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                          aria-label="Edit exam template"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(ev) =>
                            openDelete(e._id, e.title || "this template", ev)
                          }
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete exam template"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <p className="text-sm text-gray-700">
              Showing page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <WhiteButton
                type="button"
                glow={false}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
              >
                Previous
              </WhiteButton>
              <OrangeButton
                type="button"
                glow={false}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
              >
                Next
              </OrangeButton>
            </div>
          </div>
        )}
      </InternshipAdminListShell>

      <ExamUpsertModal
        isOpen={upsertOpen}
        mode={upsertMode}
        examId={editId}
        onClose={() => {
          setCreateOpen(false);
          setEditId(null);
        }}
        onSuccess={() => void fetchExams()}
      />

      <ExamDetailModal
        isOpen={!!detailId}
        examId={detailId}
        onClose={() => setDetailId(null)}
        onMutate={() => void fetchExams()}
        onEdit={(id) => setEditId(id)}
      />

      <DeleteExamConfirmModal
        isOpen={!!deleteTarget}
        examId={deleteTarget?.id ?? null}
        preview={deleteTarget?.preview}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => void fetchExams()}
      />
    </>
  );
}
