"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Users } from "lucide-react";
import type { Assessment, AssessmentSubmission } from "@/types/assessment";
import Container from "@/app/admin/components/ui/Container";
import SubmissionDetailPanel from "../components/SubmissionDetailPanel";
import {
  INITIAL_MOCK_SUBMISSIONS,
  MOCK_BATCHES,
  MOCK_INTERNSHIPS,
  MOCK_USER_LABELS,
  loadPersistedAssessments,
} from "../components/mockData";

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

export default function AssessmentSubmissionsPage() {
  const params = useParams();
  const assessmentId = params.assessmentId as string;

  const [template, setTemplate] = useState<Assessment | null>(null);
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<AssessmentSubmission | null>(null);

  useEffect(() => {
    const list = loadPersistedAssessments();
    setTemplate(list.find((a) => a._id === assessmentId) ?? null);
  }, [assessmentId]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INITIAL_MOCK_SUBMISSIONS.filter((s) => {
      if (s.assessment !== assessmentId) return false;
      if (!q) return true;
      const user = MOCK_USER_LABELS[s.user];
      const blob = [
        internshipTitle(s.internship),
        batchLabel(s.internship, s.batch),
        s.status,
        user?.name,
        user?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [assessmentId, search]);

  return (
    <div className="w-full min-h-full p-4 sm:p-6 lg:p-8 bg-linear-to-br from-gray-50 to-gray-100">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/internships/assessments"
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 mb-2"
            >
              <ArrowLeft className="size-4" />
              Back to assessment templates
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Submissions
            </h1>
            {template ? (
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                <span className="font-mono text-xs bg-gray-200/80 px-1.5 py-0.5 rounded">
                  {template._id}
                </span>
                {" · "}
                {internshipTitle(template.internship)}
                {template.batch
                  ? ` · ${batchLabel(template.internship, template.batch)}`
                  : " · All batches"}
                {" · "}
                <span className="capitalize">{template.submissionType}</span>
              </p>
            ) : (
              <p className="text-amber-800 mt-1 text-sm">
                No template found for this id (mock data may not include it
                yet).
              </p>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-4 overflow-x-hidden overflow-y-visible">
          <div className="relative">
            <input
              type="search"
              placeholder="Search learner, batch, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
              disabled={!template}
            />
          </div>

          <div className="min-w-0 rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div
              className="max-h-[min(65vh,32rem)] overflow-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              <table className="w-max min-w-full text-sm text-left">
                <thead className="sticky top-0 z-1 bg-gray-50 text-gray-600 shadow-[0_1px_0_0_rgb(229,231,235)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Learner</th>
                    <th className="px-4 py-3 font-medium">Internship</th>
                    <th className="px-4 py-3 font-medium">Batch</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {!template ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        <Link
                          href="/admin/internships/assessments"
                          className="text-orange-600 font-medium hover:underline"
                        >
                          Return to templates
                        </Link>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        No submissions for this template (or nothing matches
                        search).
                      </td>
                    </tr>
                  ) : (
                    rows.map((s) => {
                      const user = MOCK_USER_LABELS[s.user];
                      const label = user ? user.name : s.user;
                      return (
                        <tr
                          key={s._id ?? JSON.stringify(s)}
                          className={`cursor-pointer transition-colors ${
                            detailRow?._id === s._id
                              ? "bg-orange-100/70 hover:bg-orange-100"
                              : "hover:bg-orange-50/40"
                          }`}
                          onClick={() => setDetailRow(s)}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {label}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {internshipTitle(s.internship)}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {batchLabel(s.internship, s.batch)}
                          </td>
                          <td className="px-4 py-3 capitalize">
                            {s.submissionType}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold capitalize text-gray-800">
                              {s.status ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {s.earnedPoints ?? s.qualifyingScore}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                            {s.submittedAt
                              ? new Date(s.submittedAt).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <SubmissionDetailPanel
            row={detailRow}
            onClose={() => setDetailRow(null)}
          />
        </div>
      </div>
    </div>
  );
}
