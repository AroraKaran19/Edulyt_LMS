"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HelpCircle, Pencil, Plus, Trash2, FileSpreadsheet } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Select from "@/components/ui/inputs/Select";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { QUESTION_CATEGORY_OPTIONS } from "@/constants/questionCategories";
import InternshipAdminListShell from "../components/InternshipAdminListShell";
import QuestionUpsertModal from "./components/QuestionUpsertModal";
import QuestionDetailModal from "./components/QuestionDetailModal";
import DeleteQuestionConfirmModal from "./components/DeleteQuestionConfirmModal";
import QuestionExcelImportModal from "./components/QuestionExcelImportModal";

type QuestionRow = {
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  isActive: boolean;
  category?: string | null;
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

export default function InternshipQuestionsAdminPage() {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [importExcelOpen, setImportExcelOpen] = useState(false);
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

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 10,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter === "mcq" || typeFilter === "file_upload") {
        params.type = typeFilter;
      }
      if (categoryFilter) params.category = categoryFilter;

      const res = await apiClient.get(ENDPOINTS.internshipQuestions.adminList, {
        params,
      });
      const d = res.data?.data as {
        questions?: QuestionRow[];
        totalPages?: number;
        total?: number;
      };
      setQuestions(d?.questions ?? []);
      setTotalPages(d?.totalPages ?? 1);
      setTotal(d?.total ?? 0);
    } catch {
      toast.error("Failed to load questions");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, categoryFilter]);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    typeFilter !== "all" ||
    Boolean(categoryFilter.trim());

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
        title="Question bank"
        subtitle="Reusable MCQ and file-upload questions for internship exams and tasks."
        searchPlaceholder="Search question text…"
        searchValue={search}
        onSearchChange={setSearch}
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            <WhiteButton
              type="button"
              glow={false}
              className="inline-flex items-center gap-2"
              onClick={() => setImportExcelOpen(true)}
            >
              <FileSpreadsheet className="size-4" />
              Import Excel
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              className="inline-flex items-center gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              Create question
            </OrangeButton>
          </div>
        }
        filterExtras={
          <div className="flex flex-wrap items-center gap-2">
            <div className="sm:w-48">
              <Select
                options={[
                  { value: "all", label: "All types" },
                  { value: "mcq", label: "MCQ only" },
                  { value: "file_upload", label: "File upload only" },
                ]}
                value={typeFilter}
                onChange={(val) => {
                  setTypeFilter(val);
                  setPage(1);
                }}
                placeholder="Question type"
              />
            </div>
            <div className="sm:min-w-[200px]">
              <Select
                searchable
                searchPlaceholder="Search categories…"
                options={[
                  { value: "", label: "All categories" },
                  ...QUESTION_CATEGORY_OPTIONS,
                ]}
                value={categoryFilter}
                onChange={(val) => {
                  setCategoryFilter(val);
                  setPage(1);
                }}
                placeholder="Category"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase min-w-[200px]">
                  Question
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Type
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Category
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Usage
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Score
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
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <HelpCircle className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">
                        No questions found
                      </p>
                      {hasActiveFilters ? (
                        <p className="text-gray-400 text-sm">
                          Try adjusting your search or type filter
                        </p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr
                    key={q._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailId(q._id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailId(q._id);
                      }
                    }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-md">
                      <span className="line-clamp-2">{q.questionText}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm whitespace-nowrap">
                      <span className="uppercase text-xs font-semibold text-gray-600">
                        {q.type}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {q.category?.trim() ? q.category : "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 capitalize whitespace-nowrap">
                      {q.usageType}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">
                      {q.score}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          q.isActive
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {q.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(q.updatedAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => openEdit(q._id, e)}
                          className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                          aria-label="Edit question"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            openDelete(q._id, q.questionText, e)
                          }
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete question"
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

      <QuestionExcelImportModal
        isOpen={importExcelOpen}
        onClose={() => setImportExcelOpen(false)}
        onSuccess={() => void fetchQuestions()}
      />

      <QuestionUpsertModal
        isOpen={upsertOpen}
        mode={upsertMode}
        questionId={editId}
        onClose={() => {
          setCreateOpen(false);
          setEditId(null);
        }}
        onSuccess={() => void fetchQuestions()}
      />

      <QuestionDetailModal
        isOpen={!!detailId}
        questionId={detailId}
        onClose={() => setDetailId(null)}
        onMutate={() => void fetchQuestions()}
        onEdit={(id) => setEditId(id)}
      />

      <DeleteQuestionConfirmModal
        isOpen={!!deleteTarget}
        questionId={deleteTarget?.id ?? null}
        preview={deleteTarget?.preview}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => void fetchQuestions()}
      />
    </>
  );
}
