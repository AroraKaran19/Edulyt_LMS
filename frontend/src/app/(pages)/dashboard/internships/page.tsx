"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { Search, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMyInternshipEnrollments } from "@/hooks/useMyInternshipEnrollments";
import { fetchMyInternshipEnrollmentsPage } from "@/hooks/useMyInternshipEnrollments";
import { ENTRANCE_EXAM_ATTENTION_STATUSES } from "@/lib/internshipEntranceFlow";
import type { InternshipEnrollmentListRow } from "@/types";
import EmptyState from "../components/applications/EmptyState";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import DashboardInternshipCard from "./components/DashboardInternshipCard";
import InternshipExamReminderBanner from "./components/InternshipExamReminderBanner";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 400;

function DashboardInternshipsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showAll = searchParams.get("all") === "1";

  const { loadPage, isLoading, error } = useMyInternshipEnrollments();
  const [rows, setRows] = useState<InternshipEnrollmentListRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [entranceGate, setEntranceGate] = useState<"checking" | "ready">(
    "checking",
  );
  const [singleEntrancePending, setSingleEntrancePending] =
    useState<InternshipEnrollmentListRow | null>(null);
  const [entrancePendingTotal, setEntrancePendingTotal] = useState(0);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    let redirected = false;
    (async () => {
      try {
        const snap = await fetchMyInternshipEnrollmentsPage({
          page: 1,
          limit: 2,
          statuses: [...ENTRANCE_EXAM_ATTENTION_STATUSES],
        });
        if (cancelled) return;
        setEntrancePendingTotal(snap.total);
        if (!showAll && snap.total >= 2) {
          router.replace("/dashboard/internships/pending");
          redirected = true;
          return;
        }
        if (snap.total === 1 && snap.enrollments[0]) {
          setSingleEntrancePending(snap.enrollments[0]);
        } else {
          setSingleEntrancePending(null);
        }
      } catch {
        if (!cancelled) {
          setSingleEntrancePending(null);
          setEntrancePendingTotal(0);
        }
      } finally {
        if (!cancelled && !redirected) setEntranceGate("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, showAll]);

  const fetchRows = useCallback(async () => {
    const res = await loadPage({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
    });
    if (res) {
      setRows(res.enrollments);
      setTotalPages(res.totalPages);
    }
  }, [loadPage, page, debouncedSearch]);

  useEffect(() => {
    if (entranceGate !== "ready") return;
    void fetchRows();
  }, [entranceGate, fetchRows]);

  const isSearching = search !== debouncedSearch && search.trim().length > 0;
  const hasRows = rows.length > 0;

  if (entranceGate === "checking") {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading your enrollments…
      </div>
    );
  }

  return (
    <div className="py-4">
      {entrancePendingTotal === 1 && singleEntrancePending && (
        <InternshipExamReminderBanner enrollment={singleEntrancePending} />
      )}

      {entrancePendingTotal >= 2 && showAll && (
        <div
          className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 sm:px-5"
          role="status"
        >
          <p className="text-sm text-amber-950">
            <span className="font-semibold">
              {entrancePendingTotal} programs
            </span>{" "}
            are still in the entrance exam or selection step. Open the list to
            review each one.
          </p>
          <Link
            href="/dashboard/internships/pending"
            className="shrink-0 text-sm font-semibold text-amber-950 underline underline-offset-2 hover:text-orange-800"
          >
            View pending list →
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
          My Internships
        </h1>
        <p className="text-sm text-gray-600 max-w-2xl">
          Your internship intakes and cohorts — a different pass than courses:
          follow status, cohort, and the program page for tasks and schedule.
        </p>
        <div className="relative w-full max-w-md">
          <input
            type="search"
            placeholder="Search by program or cohort name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="placeholder:text-[#0000003D] placeholder:text-xs w-full h-10 sm:h-12 px-3 sm:px-4 pr-10 sm:pr-12 bg-[#F5F5F5] rounded-xl border border-[#00000026] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-[0px_4px_4px_0px_#00000012_inset]"
            aria-label="Search internships"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-orange-500 p-1.5">
            {isLoading && search.length > 0 ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </span>
        </div>
      </div>

      {isLoading && rows.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading your programs…
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => void fetchRows()}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : !hasRows && debouncedSearch ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-12 px-4 text-center">
          <p className="text-gray-800 font-medium">
            No enrollments match &quot;{debouncedSearch}&quot;
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Try another program or cohort name.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
            }}
            className="mt-6 bg-[#F5691D] text-white px-4 py-2 rounded-2xl cursor-pointer hover:bg-orange-600 transition"
          >
            Clear search
          </button>
        </div>
      ) : !hasRows ? (
        <div className="py-6">
          <EmptyState
            title="Internships"
            description="When you apply to a program or complete enrollment, your intake passes will show up here."
            buttonText="Browse internships"
            href="/internships"
          />
        </div>
      ) : (
        <>
          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6",
              isSearching && "opacity-60",
            )}
          >
            {rows.map((row) => (
              <DashboardInternshipCard key={row._id} row={row} />
            ))}
          </div>
          {totalPages > 1 && !isSearching && (
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              <WhiteButton
                glow={false}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Previous
              </WhiteButton>
              <div className="flex items-center gap-1 text-sm text-gray-600 px-2">
                Page {page} of {totalPages}
              </div>
              <OrangeButton
                glow={false}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
              >
                Next
              </OrangeButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardInternshipsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading…
        </div>
      }
    >
      <DashboardInternshipsContent />
    </Suspense>
  );
}
