"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
  Layers,
  Percent,
  Search,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import PartnerCategoryPie from "@/components/ui/partner/PartnerCategoryPie";
import InfiniteScrollSelect, {
  type InfiniteScrollLoadResult,
} from "@/components/ui/InfiniteScrollSelect";
import Loader from "@/components/ui/Loader";
import PartnerExportButton from "@/components/ui/partner/PartnerExportButton";
import type { ExcelRow } from "@/lib/exportToExcel";
import usePartner, {
  type PartnerAudience,
  type PartnerCoursesEnrollmentsResponse,
  type PartnerCoursesResponse,
} from "@/hooks/usePartner";

/** pageSize is capped at 100 server-side, so exports fetch in 100-row pages. */
const EXPORT_PAGE_SIZE = 100;

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const AUDIENCE_LABEL: Record<PartnerAudience, string> = {
  "college-students": "College Students",
  professionals: "Professionals",
};

const AUDIENCE_OPTIONS: { value: PartnerAudience; label: string }[] = [
  { value: "college-students", label: AUDIENCE_LABEL["college-students"] },
  { value: "professionals", label: AUDIENCE_LABEL.professionals },
];

const ALL_AUDIENCES: PartnerAudience[] = [
  "college-students",
  "professionals",
];

/** Per-audience tints: the filter chip and the row share a colour so the
 *  chips double as a legend when both audiences are shown together. */
const AUDIENCE_TONE: Record<
  PartnerAudience,
  { row: string; dot: string; chipActive: string }
> = {
  "college-students": {
    row: "bg-sky-50/70",
    dot: "bg-sky-500",
    chipActive: "border-sky-300 bg-sky-50 text-sky-700",
  },
  professionals: {
    row: "bg-violet-50/60",
    dot: "bg-violet-500",
    chipActive: "border-violet-300 bg-violet-50 text-violet-700",
  },
};

export default function PartnerCoursesPage() {
  const {
    getCourses,
    getCoursesEnrollments,
    getCourseFilterCourses,
    getCourseFilterDomains,
  } = usePartner();
  const [data, setData] = useState<PartnerCoursesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [enrollmentsData, setEnrollmentsData] =
    useState<PartnerCoursesEnrollmentsResponse | null>(null);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAudiences, setSelectedAudiences] =
    useState<PartnerAudience[]>(ALL_AUDIENCES);
  const [categoryId, setCategoryId] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseLabel, setCourseLabel] = useState("");

  // Backend filters on a single audience; only constrain when exactly one is
  // picked (both / none means "show all"). When more than one audience is
  // visible we tint rows by audience so they're easy to tell apart.
  const audienceFilter =
    selectedAudiences.length === 1 ? selectedAudiences[0] : undefined;
  const coloriseByAudience = selectedAudiences.length !== 1;

  const toggleAudience = (a: PartnerAudience) => {
    setPage(1);
    setSelectedAudiences((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  const loadCourses = useCallback(
    async (p: number, q: string): Promise<InfiniteScrollLoadResult> => {
      const res = await getCourseFilterCourses({ page: p, pageSize: 25, q });
      return {
        items: res.items.map((c) => ({ value: c.courseId, label: c.title })),
        hasMore: res.hasMore,
      };
    },
    [getCourseFilterCourses],
  );

  const loadDomains = useCallback(
    async (p: number, q: string): Promise<InfiniteScrollLoadResult> => {
      const res = await getCourseFilterDomains({
        page: p,
        pageSize: 25,
        q,
        audience: audienceFilter,
      });
      return {
        items: res.items.map((d) => ({ value: d.categoryId, label: d.name })),
        hasMore: res.hasMore,
      };
    },
    [getCourseFilterDomains, audienceFilter],
  );

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const d = await getCourses();
        if (!cancelled) setData(d);
      } catch (e) {
        console.error("Partner courses load failed:", e);
        if (!cancelled) toast.error("Could not load courses.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getCourses]);

  useEffect(() => {
    let cancelled = false;
    setEnrollmentsLoading(true);
    (async () => {
      try {
        const d = await getCoursesEnrollments({
          page,
          pageSize,
          q: search,
          audience: audienceFilter,
          categoryId: categoryId || undefined,
          courseId: courseId || undefined,
        });
        if (!cancelled) setEnrollmentsData(d);
      } catch (e) {
        console.error("Partner enrollments load failed:", e);
        if (!cancelled) toast.error("Could not load enrollments.");
      } finally {
        if (!cancelled) setEnrollmentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    getCoursesEnrollments,
    page,
    pageSize,
    search,
    audienceFilter,
    categoryId,
    courseId,
  ]);

  const pageCount = useMemo(() => {
    if (!enrollmentsData) return 1;
    return Math.max(
      1,
      Math.ceil(enrollmentsData.total / enrollmentsData.pageSize),
    );
  }, [enrollmentsData]);

  // When the user picks an audience, the current domain may not be compatible.
  // We re-derive that from the first page of domain options.
  useEffect(() => {
    if (!categoryId || !audienceFilter) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getCourseFilterDomains({
          page: 1,
          pageSize: 100,
          audience: audienceFilter,
        });
        if (cancelled) return;
        const stillValid = res.items.some((d) => d.categoryId === categoryId);
        if (!stillValid) {
          setCategoryId("");
          setCategoryLabel("");
          setPage(1);
        }
      } catch (e) {
        console.error("Domain compatibility check failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audienceFilter, categoryId, getCourseFilterDomains]);

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setSelectedAudiences(ALL_AUDIENCES);
    setCategoryId("");
    setCategoryLabel("");
    setCourseId("");
    setCourseLabel("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || audienceFilter || categoryId || courseId,
  );

  // Pull every enrollment matching the current filters (following pagination)
  // and flatten it into export rows.
  const buildEnrollmentRows = async (): Promise<ExcelRow[]> => {
    const filters = {
      q: search,
      audience: audienceFilter,
      categoryId: categoryId || undefined,
      courseId: courseId || undefined,
    };
    const first = await getCoursesEnrollments({
      page: 1,
      pageSize: EXPORT_PAGE_SIZE,
      ...filters,
    });
    const totalPages = Math.max(1, Math.ceil(first.total / EXPORT_PAGE_SIZE));
    const rest =
      totalPages > 1
        ? await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              getCoursesEnrollments({
                page: i + 2,
                pageSize: EXPORT_PAGE_SIZE,
                ...filters,
              }),
            ),
          )
        : [];
    const rows = [first, ...rest].flatMap((res) => res.items);
    return rows.map((r) => ({
      Student: r.studentName,
      Email: r.email,
      Audience: r.audiences
        .map((a) => AUDIENCE_LABEL[a])
        .join(", "),
      Domain: r.domains.join(", "),
      "Course Name": r.courseTitle,
      "Completion (%)": r.completion,
      Certified: r.certified ? "Yes" : "No",
      "Certificate URL": r.certificateUrl ?? "",
    }));
  };

  if (isLoading && !data) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader size="xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <PartnerCard className="p-6 text-center">
          <h2 className="text-base font-semibold text-gray-900">
            Courses unavailable
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We couldn&apos;t load course analytics. Please refresh.
          </p>
        </PartnerCard>
      </div>
    );
  }

  const { stats, categoryBreakdown } = data;
  const statCards = [
    {
      key: "courses",
      label: "Courses",
      value: stats.totalCourses,
      icon: <BookOpen className="size-5" />,
    },
    {
      key: "enrollments",
      label: "Course Enrollments",
      value: stats.totalEnrollments,
      icon: <Layers className="size-5" />,
    },
    {
      key: "learners",
      label: "Distinct Learners",
      value: stats.distinctLearners,
      icon: <Users className="size-5" />,
    },
    {
      key: "certs",
      label: "Certificates Issued",
      value: stats.certificatesIssued,
      icon: <GraduationCap className="size-5" />,
    },
    {
      key: "avgCompletion",
      label: "Avg. Students Completed",
      value: `${stats.avgCompletion}%`,
      icon: <Percent className="size-5" />,
    },
  ];

  const items = enrollmentsData?.items ?? [];
  const total = enrollmentsData?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  return (
    <div className="space-y-4 p-2 py-6 sm:p-4">
      <h1 className="text-lg font-semibold text-black sm:text-2xl">Courses</h1>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {statCards.map((s) => (
          <PartnerStatCard
            key={s.key}
            icon={s.icon}
            value={String(s.value)}
            label={s.label}
          />
        ))}
      </div>

      <PartnerCategoryPie data={categoryBreakdown} />

      <PartnerCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-black sm:text-xl">
            Enrollments
          </h2>
          <PartnerExportButton
            getRows={buildEnrollmentRows}
            fileName="course-enrollments"
            sheetName="Enrollments"
            disabled={total === 0}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
            <span>Audience</span>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((o) => {
                const active = selectedAudiences.includes(o.value);
                const tone = AUDIENCE_TONE[o.value];
                return (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => toggleAudience(o.value)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-normal transition-colors",
                      active
                        ? tone.chipActive
                        : "border-gray-300 bg-white text-[#667085] hover:border-gray-400",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        active ? tone.dot : "bg-gray-300",
                      )}
                    />
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
            Domain
            <InfiniteScrollSelect
              value={categoryId}
              onChange={(v, label) => {
                setCategoryId(v);
                setCategoryLabel(label);
                setPage(1);
              }}
              loadPage={loadDomains}
              allLabel="All domains"
              placeholder="All domains"
              selectedLabel={categoryLabel}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
            Course
            <InfiniteScrollSelect
              value={courseId}
              onChange={(v, label) => {
                setCourseId(v);
                setCourseLabel(label);
                setPage(1);
              }}
              loadPage={loadCourses}
              allLabel="All courses"
              placeholder="All courses"
              selectedLabel={courseLabel}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
            Search
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Name, email or course"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
              />
            </div>
          </label>
        </div>

        {hasActiveFilters && (
          <div className="mt-3">
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-[#F77124] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-[#F2F4F7] text-left">
                <th className="pb-3 font-semibold text-black">Student</th>
                <th className="pb-3 font-semibold text-black">Domain</th>
                <th className="pb-3 font-semibold text-black">Course Name</th>
                <th className="pb-3 font-semibold text-black">Completion</th>
              </tr>
            </thead>
            <tbody>
              {enrollmentsLoading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center">
                    <Loader size="md" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-gray-500"
                  >
                    {hasActiveFilters
                      ? "No enrollments matched your filters."
                      : "None of your students have enrolled in a course yet."}
                  </td>
                </tr>
              ) : (
                items.map((r) => {
                  const rowTone = coloriseByAudience
                    ? r.audiences.includes("college-students")
                      ? AUDIENCE_TONE["college-students"].row
                      : r.audiences.includes("professionals")
                        ? AUDIENCE_TONE.professionals.row
                        : ""
                    : "";
                  return (
                    <tr
                      key={r.enrollmentId}
                      className={cn(
                        "border-b border-[#F2F4F7] last:border-0 align-top",
                        rowTone,
                      )}
                    >
                      <td className="py-3">
                        <div className="font-medium text-[#1D2939]">
                          {r.studentName}
                        </div>
                        <div className="text-xs text-[#667085]">
                          {r.email}
                        </div>
                      </td>
                      <td className="py-3 text-[#475467]">
                        {r.domains.length === 0 ? "—" : r.domains.join(", ")}
                      </td>
                    <td className="py-3 text-[#1D2939]">{r.courseTitle}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                r.completion >= 100
                                  ? "bg-emerald-500"
                                  : "bg-[#F77124]",
                              )}
                              style={{
                                width: `${Math.min(100, Math.max(0, r.completion))}%`,
                              }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-xs font-semibold tabular-nums",
                              r.completion >= 100
                                ? "text-emerald-700"
                                : "text-[#475467]",
                            )}
                          >
                            {r.completion}%
                          </span>
                        </div>
                        {r.certified &&
                          (r.certificateUrl ? (
                            <a
                              href={r.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md bg-[#F77124] px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#e0631a]"
                            >
                              <Download className="size-3.5" />
                              Certificate
                            </a>
                          ) : (
                            <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                              Certified
                            </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[#F2F4F7] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-[#475467]">
            <label className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <span>
              {total === 0
                ? "0 enrollments"
                : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || enrollmentsLoading}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-[#344054] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
              Prev
            </button>
            <span className="px-2 text-xs font-medium text-[#475467]">
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount || enrollmentsLoading}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-[#344054] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </PartnerCard>
    </div>
  );
}
