"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/configs/apiConfig";
import { buildWatchUrlForInstructorQna } from "@/lib/instructorWatchLinks";
import type { QnA } from "@/types/qna";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  MessageCircle,
} from "lucide-react";

function authorLabel(userId: QnA["userId"]): string {
  if (userId && typeof userId === "object" && "firstName" in userId) {
    const u = userId as {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    return n || u.email || "Learner";
  }
  return "Learner";
}

function courseTitle(courseId: QnA["courseId"]): string {
  if (courseId && typeof courseId === "object" && "title" in courseId) {
    return (courseId as { title?: string }).title ?? "Course";
  }
  return "Course";
}

export default function InstructorAllQnaPage() {
  const [qnas, setQnas] = useState<QnA[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/instructor/qnas", {
        params: { page, limit: 15 },
      });
      const payload = res.data?.data ?? res.data;
      setQnas(payload?.qnas ?? []);
      setTotalPages(payload?.totalPages ?? 1);
      setTotal(payload?.total ?? 0);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not load questions";
      setError(msg);
      setQnas([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/instructor"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 mb-3"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          All learner questions
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Questions from learners across your courses (including pending review).
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
          <Loader2 className="size-6 animate-spin text-orange-500" />
          Loading questions…
        </div>
      ) : qnas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-gray-500 text-sm">
          No questions yet across your courses.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {total} question{total === 1 ? "" : "s"} total
          </p>
          <ul className="space-y-4">
            {qnas.map((q) => {
              const watchUrl = buildWatchUrlForInstructorQna(q);
              return (
              <li
                key={q._id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2 gap-y-1 text-xs text-gray-500 mb-2">
                  <span className="font-semibold text-orange-700">
                    {courseTitle(q.courseId)}
                  </span>
                  <span>·</span>
                  <span className="font-medium text-gray-900">
                    {authorLabel(q.userId)}
                  </span>
                  <span>·</span>
                  <time dateTime={q.createdAt ? String(q.createdAt) : undefined}>
                    {q.createdAt
                      ? new Date(q.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : ""}
                  </time>
                  <span
                    className={`ml-auto inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      q.approved
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-900 border-amber-200"
                    }`}
                  >
                    {q.approved ? "Visible to class" : "Pending review"}
                  </span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {q.message}
                </p>
                {watchUrl ? (
                  <div className="mt-3">
                    <Link
                      href={watchUrl}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900"
                    >
                      <ExternalLink className="size-4 shrink-0" />
                      Open in course (exact location)
                    </Link>
                  </div>
                ) : null}
                {(q.replies?.length ?? 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <MessageCircle className="size-3.5" />
                      Replies ({q.totalReplies ?? q.replies?.length})
                    </p>
                    <ul className="space-y-2 pl-3 border-l-2 border-orange-100">
                      {q.replies?.map((r) => (
                        <li key={r._id} className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900">
                            {authorLabel(r.userId)}:
                          </span>{" "}
                          {r.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600 tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
