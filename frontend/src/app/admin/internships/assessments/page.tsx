"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Edit3,
  FileUp,
  ListChecks,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import type { Assessment } from "@/types/assessment";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Container from "@/app/admin/components/ui/Container";
import AssessmentEditorModal from "./components/AssessmentEditorModal";
import {
  INITIAL_MOCK_ASSESSMENTS,
  MOCK_BATCHES,
  MOCK_INTERNSHIPS,
  persistAssessments,
  loadPersistedAssessments,
} from "./components/mockData";

function formatRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return `${start.toLocaleString(undefined, opts)} → ${end.toLocaleString(undefined, opts)}`;
}

function internshipTitle(id: string) {
  return MOCK_INTERNSHIPS.find((i) => i._id === id)?.title ?? id;
}

function batchLabel(internshipId: string, batchIndexStr: string) {
  const idx = Number.parseInt(batchIndexStr, 10);
  if (Number.isNaN(idx)) return batchIndexStr;
  return (
    MOCK_BATCHES.find(
      (b) => b.internshipId === internshipId && b.batchIndex === idx,
    )?.label ?? `Batch ${idx}`
  );
}

const InternshipAssessmentsPage = () => {
  const [assessments, setAssessments] = useState<Assessment[]>(
    INITIAL_MOCK_ASSESSMENTS,
  );
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    setAssessments(loadPersistedAssessments());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    persistAssessments(assessments);
  }, [assessments, storageReady]);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(
    null,
  );

  const filteredAssessments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assessments.filter((a) => {
      if (activeFilter === "active" && !a.isActive) return false;
      if (activeFilter === "inactive" && a.isActive) return false;
      if (!q) return true;
      const title = internshipTitle(a.internship).toLowerCase();
      const batch = a.batch
        ? batchLabel(a.internship, a.batch).toLowerCase()
        : "all";
      const type = a.submissionType;
      return (
        title.includes(q) ||
        batch.includes(q) ||
        type.includes(q) ||
        (a._id && a._id.toLowerCase().includes(q))
      );
    });
  }, [assessments, search, activeFilter]);

  const openCreate = () => {
    setEditingAssessment(null);
    setEditorOpen(true);
  };

  const openEdit = (row: Assessment) => {
    setEditingAssessment(row);
    setEditorOpen(true);
  };

  const handleSaveAssessment = (row: Assessment) => {
    setAssessments((prev) => {
      const id = row._id;
      const idx = id ? prev.findIndex((a) => a._id === id) : -1;
      const next = { ...row, updatedAt: new Date() };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = next as Assessment;
        return copy;
      }
      return [...prev, { ...next, createdAt: new Date() } as Assessment];
    });
    toast.success("Saved locally — connect API when backend is ready.");
  };

  const handleDelete = (id: string | undefined) => {
    if (!id) return;
    if (!window.confirm("Remove this assessment from the local list?")) return;
    setAssessments((prev) => prev.filter((a) => a._id !== id));
    toast.info("Removed locally.");
  };

  return (
    <div className="w-full min-h-full p-4 sm:p-6 lg:p-8 bg-linear-to-br from-gray-50 to-gray-100">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Internship assessments
          </h1>
          <p className="text-gray-600 mt-1 max-w-2xl">
            Manage assessment templates. Open submissions on a separate page via
            the people icon. Mock data is persisted in session until APIs exist.
          </p>
        </div>

        <div className="min-h-0 bg-white border border-gray-200 rounded-xl p-6 shadow-[0_0_5px_2px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center p-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search templates…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                />
              </div>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white min-w-[160px]"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <OrangeButton
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 shrink-0"
              >
                <Plus className="size-4" />
                New template
              </OrangeButton>
            </div>

            <div className="min-w-0 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-max min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Internship</th>
                    <th className="px-4 py-3 font-medium">Batch</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Questions</th>
                    <th className="px-4 py-3 font-medium">Points</th>
                    <th className="px-4 py-3 font-medium">Window</th>
                    <th className="px-4 py-3 font-medium">Active</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredAssessments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        No templates match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAssessments.map((a) => (
                      <tr
                        key={a._id ?? JSON.stringify(a)}
                        className="hover:bg-orange-50/40"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {internshipTitle(a.internship)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {a.batch ? (
                            batchLabel(a.internship, a.batch)
                          ) : (
                            <span className="text-gray-400">All batches</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize">
                            {a.submissionType === "mcq" ? (
                              <ListChecks className="size-3.5" />
                            ) : (
                              <FileUp className="size-3.5" />
                            )}
                            {a.submissionType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {a.submissionType === "mcq"
                            ? a.mcqQuestions.length
                            : a.fileQuestions.length}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-800">
                          {a.assessmentPoints}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs max-w-[220px]">
                          {formatRange(
                            new Date(a.duration.startDate),
                            new Date(a.duration.endDate),
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              a.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {a.isActive ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end items-center gap-0.5">
                            {a._id ? (
                              <Link
                                href={`/admin/internships/assessments/${a._id}`}
                                className="p-2 rounded-lg inline-flex text-indigo-600 hover:bg-indigo-50"
                                title="View submissions (separate page)"
                                aria-label="View submissions for this template"
                              >
                                <Users className="size-4" />
                              </Link>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => openEdit(a)}
                              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                              aria-label="Edit template"
                            >
                              <Edit3 className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(a._id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                              aria-label="Delete template"
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
          </div>
        </div>
      </div>

      <AssessmentEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        editing={editingAssessment}
        onSave={handleSaveAssessment}
      />
    </div>
  );
};

export default InternshipAssessmentsPage;
