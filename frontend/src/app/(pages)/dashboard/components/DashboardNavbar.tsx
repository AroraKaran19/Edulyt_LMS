"use client";
import UserMenu from "@/components/shared/User/UserMenu";
import ImageComponent from "@/components/ui/ImageComponent";
import Searchbar2 from "@/components/ui/Searchbar2";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useUserStats from "@/hooks/useUserStats";
import { useEffect, useRef, useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { Course } from "@/types/course";
import { Enrollment } from "@/types/enrollment";
import { Loader2, X } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { AMBASSADOR_KIND_TAB_LABELS } from "@/hooks/useCrm";

/**
 * Routes that need a minimal "focus mode" header — no nav tabs, no search,
 * no stats. Matches /dashboard/internships/exam/[id] and
 * /dashboard/internships/[slug]/[taskId].
 */
function isFocusRoute(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  // e.g. ["dashboard","internships","exam","abc123"]  → depth 4
  return (
    parts.length >= 4 && parts[0] === "dashboard" && parts[1] === "internships"
  );
}

const SEARCH_DEBOUNCE_MS = 400;
const DROPDOWN_LIMIT = 5;

type SearchHit = {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  thumbnail: string;
};

const DashboardNavbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  // Account pages (profile / settings) use a minimal header — no course search
  // or dashboard tabs, which don't belong in the account section.
  const isAccountRoute = pathname === "/profile" || pathname === "/settings";
  const { stats, isLoading } = useUserStats();
  const [navSearch, setNavSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const activeRequest = useRef(0);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const fetchSearchHits = useCallback(async (q: string) => {
    const id = ++activeRequest.current;
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: String(DROPDOWN_LIMIT),
        search: q,
        sortBy: "name-asc",
      });
      const res = await apiClient.get(
        `/enrollments/user/me?${params.toString()}`,
      );
      if (id !== activeRequest.current) return;
      const data = res.data?.data;
      const list: Enrollment[] = data?.enrollments ?? [];
      const next: SearchHit[] = [];
      for (const en of list) {
        const c = en.courseId as unknown as Course | undefined;
        if (!c || typeof c !== "object" || !("_id" in c)) continue;
        const slug = (c as Course).slug;
        if (!slug) continue;
        next.push({
          enrollmentId: String(en._id),
          courseId: String(c._id),
          slug: String(slug),
          title: c.title || "Course",
          thumbnail: c.thumbnail || "",
        });
      }
      setHits(next);
    } catch {
      if (id === activeRequest.current) setHits([]);
    } finally {
      if (id === activeRequest.current) setSearchLoading(false);
    }
  }, []);

  const handleNavSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setNavSearch(q);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const trimmed = q.trim();
    if (!trimmed) {
      setHits([]);
      setDropdownOpen(false);
      setSearchLoading(false);
      return;
    }
    setDropdownOpen(true);
    debounceTimer.current = setTimeout(() => {
      void fetchSearchHits(trimmed);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleInputFocus = () => {
    if (navSearch.trim().length > 0) {
      setDropdownOpen(true);
      if (hits.length === 0 && !searchLoading) {
        void fetchSearchHits(navSearch.trim());
      }
    }
  };

  const handleNavSearch = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const q = navSearch.trim();
    setDropdownOpen(false);
    router.push(
      q
        ? `/dashboard/courses?search=${encodeURIComponent(q)}`
        : "/dashboard/courses",
    );
  };

  /*
   * Read from the session rather than fetched: the auth payload already carries
   * the kind, and only while their link is live. Fetching here would cost every
   * learner a request on every dashboard load to learn they are not one.
   */
  const { user: authUser } = useAuth();
  const internLabel = authUser?.crmAmbassadorKind
    ? AMBASSADOR_KIND_TAB_LABELS[authUser.crmAmbassadorKind]
    : null;

  const navItems = [
    { label: "Home", href: "/dashboard" },
    {
      label: "My Programs",
      href: "/dashboard/courses",
      count: stats.totalCourses,
    },
    {
      label: "My Internships",
      href: "/dashboard/internships",
      count: stats.totalInternships,
    },
    {
      label: "Course Internships",
      href: "/dashboard/course-internships",
    },
    {
      label: "Certificates",
      href: "/dashboard/certificates",
      count: stats.totalCertificates,
    },
    ...(internLabel
      ? [{ label: internLabel, href: "/ambassador", isNew: true }]
      : []),
  ];

  // ── Focus mode (exam / task taking) ──────────────────────────────────────
  if (isFocusRoute(pathname)) {
    const parts = pathname.split("/").filter(Boolean);
    const isExamRoute = parts[2] === "exam";
    const backHref = isExamRoute
      ? "/dashboard/internships"
      : `/dashboard/internships/${encodeURIComponent(parts[2] ?? "")}`;
    const backLabel = isExamRoute ? "My Internships" : "Back to program";

    return (
      <div className="focus-navbar w-full fixed top-0 left-0 z-9999 bg-primary/40 backdrop-blur-sm border-b border-primary/20">
        <div className="w-full h-14 px-4 lg:px-10 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center overflow-visible"
          >
            <ImageComponent
              src="/logo.svg"
              alt="Logo"
              width={100}
              height={100}
              loading="eager"
              className="h-8 w-auto max-w-none shrink-0 object-contain object-left"
              draggable={false}
            />
          </Link>

          {/* Centre label */}
          <p className="hidden sm:block text-xs font-semibold uppercase tracking-widest text-amber-400/80">
            {isExamRoute ? "Entrance Exam" : "Task"}
          </p>

          {/* Exit */}
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary px-3 py-1.5 text-xs font-semibold text-white"
          >
            <X className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-navbar w-full fixed top-0 left-0 z-9999 bg-white">
      <div className="w-full py-4 px-4 lg:px-20 flex items-center gap-4">
        <Link href="/" className="shrink-0 flex items-center">
          <ImageComponent
            src="/logo.svg"
            alt="logo"
            width={100}
            height={100}
            loading="eager"
            className="h-[52px] w-auto object-contain"
            draggable={false}
          />
        </Link>
        {!isAccountRoute && (
          <div
            className="hidden lg:flex max-w-[350px] w-full min-w-0 flex-1 items-start mt-2"
            ref={searchContainerRef}
          >
            <div className="relative w-full z-10000">
              <Searchbar2
                className="w-full"
                placeholder="Search your courses…"
                value={navSearch}
                onChange={handleNavSearchChange}
                onSearch={handleNavSearch}
                onInputFocus={handleInputFocus}
              />
              {dropdownOpen && navSearch.trim().length > 0 && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-gray-200 bg-white shadow-xl max-h-80 overflow-y-auto"
                  role="listbox"
                  aria-label="Search results"
                >
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-6 text-gray-500 gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching…
                    </div>
                  ) : hits.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No courses match &quot;{navSearch.trim()}&quot; in your
                      enrollments.
                    </div>
                  ) : (
                    <ul className="py-1">
                      {hits.map((h) => (
                        <li key={h.enrollmentId}>
                          <Link
                            href={`/programs/${h.slug}/watch`}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                              {h.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={h.thumbnail}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <span className="text-sm text-gray-900 line-clamp-2 min-w-0">
                              {h.title}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!searchLoading && (
                    <div className="border-t border-gray-100 px-2 py-1.5">
                      <button
                        type="button"
                        onClick={handleNavSearch}
                        className="w-full text-left text-xs font-medium text-orange-600 hover:text-orange-700 py-1.5 px-2 rounded-lg hover:bg-orange-50/80"
                      >
                        See all results
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="ml-auto flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
      {!isAccountRoute && (
        <div className="w-full py-4.25 px-4 lg:px-20 shadow-[0_2px_0_rgba(0,0,0,0.1)]">
          <nav className="w-full flex items-center gap-4 overflow-x-auto">
            {navItems.map((item, index) => (
              <Link
                href={item.href}
                key={index}
                className={cn(
                  "text-text-primary shrink-0 text-sm font-medium px-5 py-2.5 rounded-full transition-colors duration-200 ease-in-out flex items-center gap-2",
                  pathname === item.href && "bg-[#FFE9DB] text-orange-600",
                )}
              >
                <span>{item.label}</span>
                {item.isNew && (
                  <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                    New
                  </span>
                )}
                {item.count !== undefined && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-semibold",
                      pathname === item.href
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-700",
                    )}
                  >
                    {isLoading ? "..." : item.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default DashboardNavbar;
