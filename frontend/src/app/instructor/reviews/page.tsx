"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/configs/apiConfig";
import type { Review } from "@/types/review";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Star,
} from "lucide-react";

function reviewerName(userId: Review["userId"]): string {
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

function courseLabel(reviewableId: Review["reviewableId"]): {
  title: string;
  slug?: string;
} {
  if (
    reviewableId &&
    typeof reviewableId === "object" &&
    "title" in reviewableId
  ) {
    const c = reviewableId as { title?: string; slug?: string };
    return { title: c.title ?? "Course", slug: c.slug };
  }
  return { title: "Course" };
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-4 shrink-0 ${i < rating
            ? "fill-amber-400 text-amber-400"
            : "fill-gray-100 text-gray-200"
            }`}
        />
      ))}
    </div>
  );
}

export default function InstructorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/instructor/reviews", {
        params: { page, limit: 15, search: search.trim() || undefined },
      });
      const payload = res.data?.data ?? res.data;
      setReviews(payload?.reviews ?? []);
      setTotalPages(payload?.totalPages ?? 1);
      setTotal(payload?.total ?? 0);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not load reviews";
      setError(msg);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

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
          Course reviews
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base max-w-2xl">
          Approved reviews from learners on courses you teach. Pending reviews
          are hidden here until an admin approves them.
        </p>
      </div>

      <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search review text…"
            className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-orange-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-orange-700 sm:self-start"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
          <Loader2 className="size-6 animate-spin text-orange-500" />
          Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600 text-sm">
          {total === 0 && !search
            ? "No approved reviews yet for your courses."
            : "No reviews match your search."}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            Showing {reviews.length} of {total} review{total === 1 ? "" : "s"}
          </p>
          <ul className="space-y-4">
            {reviews.map((r) => {
              const { title, slug } = courseLabel(r.reviewableId);
              const u = r.userId;
              const avatar =
                u &&
                typeof u === "object" &&
                "profilePicture" in u &&
                (u as { profilePicture?: string }).profilePicture;

              return (
                <li
                  key={r._id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="relative size-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      {avatar ? (
                        <Image
                          src={avatar}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-500">
                          {reviewerName(r.userId)
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {reviewerName(r.userId)}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs font-medium text-violet-800 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full truncate max-w-[min(100%,280px)]">
                          {title}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <StarRow rating={r.rating} />
                        {r.createdAt ? (
                          <time
                            className="text-xs text-gray-500"
                            dateTime={String(r.createdAt)}
                          >
                            {new Date(r.createdAt).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </time>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-800 mt-3 whitespace-pre-wrap leading-relaxed">
                        {r.comment}
                      </p>
                      {slug ? (
                        <Link
                          href={`/programs/${slug}`}
                          className="inline-block mt-3 text-xs font-medium text-orange-600 hover:text-orange-700"
                        >
                          View course →
                        </Link>
                      ) : null}
                    </div>
                  </div>
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
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600 tabular-nums">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
