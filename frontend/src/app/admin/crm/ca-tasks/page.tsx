"use client";

import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import Select from "@/components/ui/inputs/Select";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import InternshipAdminListShell from "../../internships/components/InternshipAdminListShell";
import useCaTasks from "@/hooks/useCaTasks";
import CaTaskUpsertModal from "./components/CaTaskUpsertModal";
import DeleteCaTaskConfirmModal from "./components/DeleteCaTaskConfirmModal";
import type { CaTaskAdminRow } from "@/types/ca-task";

function formatDate(iso?: string) {
  if (!iso) return "-";
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
    return "-";
  }
}

const COL_SPAN = 8;

export default function CaTasksAdminPage() {
  const { listAdmin, isLoading } = useCaTasks();
  const [tasks, setTasks] = useState<CaTaskAdminRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; preview: string } | null>(null);

  const fetchTasks = async () => {
    const rows = await listAdmin();
    setTasks(rows ?? []);
  };

  useEffect(() => {
    void fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (statusFilter === "active" && !t.isActive) return false;
        if (statusFilter === "inactive" && t.isActive) return false;
        if (!q) return true;
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      })
      .sort((a, b) => a.startFromDay - b.startFromDay);
  }, [tasks, search, statusFilter]);

  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "all";

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
        title="CA tasks"
        subtitle="The programme every active Campus Ambassador works through, in order."
        searchPlaceholder="Search by title..."
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
            Create task
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
              onChange={setStatusFilter}
              placeholder="Status"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[160px]">Title</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Questions</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 tabular-nums">Pass score</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 max-w-28 leading-tight">Opens day</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 max-w-28 leading-tight">Deadline day</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Updated</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && tasks.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                      <p className="text-gray-500 text-sm">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <HelpCircle className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">No CA tasks found</p>
                      {hasActiveFilters ? (
                        <p className="text-gray-400 text-sm">Try adjusting your search or status filter</p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => openEdit(t.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setEditId(t.id);
                      }
                    }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <span className="line-clamp-2 font-medium">{t.title || "-"}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">{t.questionCount}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">{t.passScore}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">{t.startFromDay}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums whitespace-nowrap">{t.endOnDay}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          t.isActive
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(t.updatedAt)}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => openEdit(t.id, e)}
                          className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                          aria-label="Edit CA task"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openDelete(t.id, t.title || "this task", e)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete CA task"
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
      </InternshipAdminListShell>

      <CaTaskUpsertModal
        isOpen={upsertOpen}
        mode={upsertMode}
        taskId={editId}
        onClose={() => {
          setCreateOpen(false);
          setEditId(null);
        }}
        onSuccess={() => void fetchTasks()}
      />

      <DeleteCaTaskConfirmModal
        isOpen={!!deleteTarget}
        taskId={deleteTarget?.id ?? null}
        preview={deleteTarget?.preview}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => void fetchTasks()}
      />
    </>
  );
}
