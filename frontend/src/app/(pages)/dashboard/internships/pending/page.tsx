"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { fetchMyInternshipEnrollmentsPage } from "@/hooks/useMyInternshipEnrollments";
import {
  ENTRANCE_EXAM_ATTENTION_STATUSES,
  entranceAttentionLabel,
  entranceAttentionSummary,
} from "@/lib/internshipEntranceFlow";
import type { InternshipEnrollmentListRow } from "@/types";

const LIMIT = 50;

export default function InternshipEntrancePendingPage() {
  const [rows, setRows] = useState<InternshipEnrollmentListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyInternshipEnrollmentsPage({
        page: 1,
        limit: LIMIT,
        statuses: [...ENTRANCE_EXAM_ATTENTION_STATUSES],
      });
      setRows(data.enrollments);
      setTotal(data.total);
    } catch {
      setError("Could not load pending entrance steps.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="py-4">
      <div className="mb-6">
        <Link
          href="/dashboard/internships?all=1"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-600 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          All my internship enrollments
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
          Entrance exam &amp; selection
        </h1>
        <p className="text-sm text-gray-600 mt-1 max-w-2xl">
          Programs where you are still in the exam or post-exam selection
          stage. Open each program for dates, materials, and updates.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading…
        </div>
      ) : error ? (
        <p className="text-red-600 text-center py-10">{error}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-12 px-4 text-center">
          <p className="text-gray-800 font-medium">Nothing pending here</p>
          <p className="text-sm text-gray-600 mt-2">
            You don’t have any enrollments in the entrance exam or selection
            step right now.
          </p>
          <Link
            href="/dashboard/internships?all=1"
            className="inline-flex mt-6 text-sm font-semibold text-orange-600 hover:underline"
          >
            Back to all internships
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 sm:gap-4">
          {rows.map((row) => {
            const title =
              row.internshipSnapshot?.title ||
              row.internship?.title ||
              "Program";
            const slug =
              row.internship?.slug?.trim() ||
              row.internshipSnapshot?.slug?.trim() ||
              "";
            const href = slug
              ? `/internships/${encodeURIComponent(slug)}`
              : "/internships";
            return (
              <li key={row._id}>
                <div className="rounded-2xl border border-amber-200/80 bg-linear-to-r from-amber-50/90 to-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">
                        {entranceAttentionLabel(row.status)}
                      </span>
                    </div>
                    <p className="text-base font-bold text-stone-900 mt-1 line-clamp-2">
                      {title}
                    </p>
                    {row.batchSnapshot?.name && (
                      <p className="text-sm text-stone-600 mt-0.5">
                        {row.batchSnapshot.name}
                      </p>
                    )}
                    <p className="text-sm text-stone-600 mt-2">
                      {entranceAttentionSummary(row.status)}
                    </p>
                  </div>
                  <Link
                    href={href}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-900 text-white text-sm font-semibold px-4 py-2.5 hover:bg-amber-950 transition shrink-0"
                  >
                    Open program
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && !error && total > LIMIT && (
        <p className="text-sm text-amber-900/80 mt-4">
          Showing {LIMIT} of {total}. Contact support if you need the full
          list.
        </p>
      )}
    </div>
  );
}
