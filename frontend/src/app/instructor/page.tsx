"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAuth from "@/hooks/useAuth";
import useInstructorDashboard, {
  type InstructorCourseSummary,
} from "@/hooks/useInstructorDashboard";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/configs/apiConfig";
import { buildInstructorWatchDeepLink } from "@/lib/instructorWatchLinks";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Loader2,
  Users,
  Percent,
  Award,
  UserPlus,
  Video,
  MessageSquareWarning,
  MessageCircle,
  ChevronDown,
  Library,
  Play,
  ExternalLink,
} from "lucide-react";

const COURSES_PAGE_SIZE = 12;

/** Shared cap so Q&A and courses columns align; inner areas scroll. */
const DASHBOARD_CARD_MAX_H =
  "max-h-[min(560px,calc(100vh-14rem))]";

const EMPTY_COURSE_LIST: InstructorCourseSummary[] = [];

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useInstructorDashboard();
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(
    null
  );
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyErr, setReplyErr] = useState<string | null>(null);

  const firstName = user?.firstName?.trim() || "there";
  const s = data?.summary;
  const latest = data?.recentQnas?.[0];
  const moreRecent = (data?.recentQnas ?? []).slice(1, 5);

  const submitReply = useCallback(async () => {
    if (!latest?._id || !replyText.trim()) return;
    setReplyBusy(true);
    setReplyErr(null);
    try {
      await apiClient.post(`/qna/${latest._id}/reply`, {
        message: replyText.trim(),
      });
      setReplyText("");
      await refetch();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not send reply";
      setReplyErr(msg);
    } finally {
      setReplyBusy(false);
    }
  }, [latest?._id, replyText, refetch]);

  const toggleCourse = (id: string) => {
    setExpandedCourseId((prev) => (prev === id ? null : id));
  };

  const courses = data?.courses ?? EMPTY_COURSE_LIST;
  const coursesKey = useMemo(
    () => courses.map((c) => c._id).join(","),
    [courses]
  );
  const [visibleCourseCount, setVisibleCourseCount] = useState(COURSES_PAGE_SIZE);
  const coursesListRef = useRef<InstructorCourseSummary[]>([]);
  coursesListRef.current = courses;
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const [coursesScrollRootEl, setCoursesScrollRootEl] =
    useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCourseCount(COURSES_PAGE_SIZE);
  }, [coursesKey]);

  const visibleCourses = useMemo(
    () => courses.slice(0, visibleCourseCount),
    [courses, visibleCourseCount]
  );
  const hasMoreCourses =
    courses.length > 0 && visibleCourseCount < courses.length;

  useEffect(() => {
    const root = coursesScrollRootEl;
    const node = loadMoreSentinelRef.current;
    if (!node || !hasMoreCourses || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCourseCount((prev) =>
          Math.min(prev + COURSES_PAGE_SIZE, coursesListRef.current.length)
        );
      },
      { root, rootMargin: "80px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreCourses, coursesKey, visibleCourseCount, coursesScrollRootEl]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base max-w-2xl">
          Teaching health: learner reach, progress, and completions. Reply to the
          latest question below or open a course to see its learner stats.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-gray-500 gap-2">
          <Loader2 className="size-6 animate-spin text-orange-500" />
          Loading your dashboard…
        </div>
      ) : data && s ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Unique learners"
              value={s.uniqueLearners}
              hint="Distinct people enrolled across your courses"
              accent="border-amber-100 bg-linear-to-br from-amber-50/90 to-orange-50/80"
              iconClass="text-amber-700"
            />
            <StatCard
              icon={Percent}
              label="Avg. learner progress"
              value={`${s.averageLearnerProgress}%`}
              hint="Mean completion across current enrollments"
              accent="border-violet-100 bg-linear-to-br from-violet-50/90 to-purple-50/70"
              iconClass="text-violet-700"
            />
            <StatCard
              icon={Award}
              label="Course completions"
              value={s.completedEnrollments}
              hint="Learners who finished the course"
              accent="border-emerald-100 bg-linear-to-br from-emerald-50/90 to-teal-50/70"
              iconClass="text-emerald-700"
            />
            <StatCard
              icon={UserPlus}
              label="New enrollments"
              value={s.newEnrollmentsLast30Days}
              hint="Last 30 days"
              accent="border-sky-100 bg-linear-to-br from-sky-50/90 to-blue-50/70"
              iconClass="text-sky-700"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3 sm:px-5 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-2 items-center">
            <span>
              <strong className="text-gray-900 font-semibold tabular-nums">
                {s.coursesCount}
              </strong>{" "}
              course{s.coursesCount === 1 ? "" : "s"}
            </span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span>
              <strong className="text-gray-900 font-semibold tabular-nums">
                {s.activeEnrollments}
              </strong>{" "}
              active enrollments
            </span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span>
              <strong className="text-gray-900 font-semibold tabular-nums">
                {s.certificatesIssued}
              </strong>{" "}
              certificates issued
            </span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquareWarning className="size-4 text-amber-600 shrink-0" />
              <strong className="text-gray-900 font-semibold tabular-nums">
                {s.pendingQnaCount}
              </strong>{" "}
              threads needing your attention — Reply to Q&amp;A
            </span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Video className="size-4 text-sky-600 shrink-0" />
              <strong className="text-gray-900 font-semibold tabular-nums">
                {s.upcomingLiveSessions}
              </strong>{" "}
              upcoming live sessions
              <span className="text-gray-400">
                ({s.liveSessionsCount} total scheduled)
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
            {/* Card 1 — Q&A */}
            <section
              className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[320px] ${DASHBOARD_CARD_MAX_H}`}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                    <MessageCircle className="size-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Reply to Q&amp;A
                    </h2>
                    <p className="text-xs text-gray-500">
                      Only threads that need your reply — most recent first
                    </p>
                  </div>
                </div>
                <Link
                  href="/instructor/qna"
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 whitespace-nowrap"
                >
                  View all questions →
                </Link>
              </div>

              {s.pendingQnaCount > 0 && (
                <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100/90 flex items-start gap-2.5 shrink-0">
                  <MessageSquareWarning
                    className="size-4 shrink-0 mt-0.5 text-amber-600"
                    aria-hidden
                  />
                  <p className="text-sm text-amber-950 leading-snug">
                    <span className="font-semibold">Attention needed:</span>{" "}
                    {s.pendingQnaCount} thread
                    {s.pendingQnaCount === 1 ? "" : "s"} awaiting your reply.{" "}
                    <Link
                      href="/instructor/qna"
                      className="font-medium text-orange-700 underline-offset-2 hover:underline"
                    >
                      View all questions
                    </Link>
                  </p>
                </div>
              )}

              <div className="p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-4">
                {!latest ? (
                  <p className="text-sm text-gray-500 py-6 text-center">
                    {s.coursesCount > 0
                      ? "You're all caught up — no questions need your attention right now."
                      : "No learner questions yet. When you're assigned to courses and learners post, threads that need a reply will appear here."}
                  </p>
                ) : (
                  <>
                    <div
                      className={cn(
                        "rounded-xl border bg-gray-50/80 p-4 space-y-2",
                        latest.notifyInstructor
                          ? "border-orange-200 ring-1 ring-orange-100/90"
                          : "border-gray-100"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                        <span className="font-semibold text-orange-800">
                          {latest.course.title}
                        </span>
                        <span>·</span>
                        <span>{latest.authorName}</span>
                        <span>·</span>
                        <time
                          dateTime={
                            latest.createdAt
                              ? String(latest.createdAt)
                              : undefined
                          }
                        >
                          {latest.createdAt
                            ? new Date(latest.createdAt).toLocaleString(
                                "en-IN",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }
                              )
                            : ""}
                        </time>
                        <div className="ml-auto flex flex-wrap items-center gap-1.5 justify-end">
                          {latest.notifyInstructor ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-orange-100 text-orange-900 border-orange-200">
                              <MessageSquareWarning className="size-3 shrink-0" />
                              Attention needed
                            </span>
                          ) : null}
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              latest.approved
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-900 border-amber-200"
                            }`}
                          >
                            {latest.approved ? "Visible" : "Pending review"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {latest.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {latest.replyCount} repl
                        {latest.replyCount === 1 ? "y" : "ies"} so far
                      </p>
                      {latest.course.slug ? (
                        <Link
                          href={buildInstructorWatchDeepLink({
                            courseSlug: latest.course.slug,
                            qnaId: latest._id,
                            contentId: latest.contentId,
                            lessonId: latest.lessonId,
                          })}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 hover:text-violet-900"
                        >
                          <ExternalLink className="size-3.5" />
                          Open in course (exact location)
                        </Link>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="instructor-qna-reply"
                        className="text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        Your reply
                      </label>
                      <textarea
                        id="instructor-qna-reply"
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a helpful answer…"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                      />
                      {replyErr && (
                        <p className="text-xs text-red-600">{replyErr}</p>
                      )}
                      <button
                        type="button"
                        onClick={submitReply}
                        disabled={replyBusy || !replyText.trim()}
                        className="inline-flex items-center justify-center rounded-xl bg-orange-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {replyBusy ? (
                          <>
                            <Loader2 className="size-4 animate-spin mr-2" />
                            Sending…
                          </>
                        ) : (
                          "Send reply"
                        )}
                      </button>
                    </div>

                    {moreRecent.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Recent
                        </p>
                        <ul className="space-y-2">
                          {moreRecent.map((q) => (
                            <li
                              key={q._id}
                              className="text-xs text-gray-600 line-clamp-2"
                            >
                              <span className="font-medium text-gray-800">
                                {q.course.title}
                              </span>
                              {" — "}
                              {q.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Card 2 — Courses & stats (scroll + infinite load inside) */}
            <section
              className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[320px] ${DASHBOARD_CARD_MAX_H}`}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 shrink-0">
                <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 border border-violet-100">
                  <Library className="size-5 text-violet-700" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Your courses
                  </h2>
                  <p className="text-xs text-gray-500">
                    Tap a course to see enrollment and progress stats
                  </p>
                </div>
              </div>

              <div
                ref={setCoursesScrollRootEl}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-5 pt-0"
              >
                {data.courses.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    You are not listed as an instructor on any course yet. When
                    an admin assigns you to a course, it will appear here.
                  </p>
                ) : (
                  <div className="space-y-3 pt-5">
                    <ul className="space-y-3">
                      {visibleCourses.map((c) => {
                      const open = expandedCourseId === c._id;
                      return (
                        <li key={c._id}>
                          <button
                            type="button"
                            onClick={() => toggleCourse(c._id)}
                            className={`w-full text-left rounded-xl border transition-colors ${
                              open
                                ? "border-orange-200 bg-orange-50/40 ring-1 ring-orange-100"
                                : "border-gray-200 bg-white hover:bg-gray-50/80"
                            }`}
                          >
                            <div className="flex items-center gap-3 p-3">
                              <div className="relative size-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                {c.thumbnail ? (
                                  <Image
                                    src={c.thumbnail}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-medium">
                                    Course
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate text-sm">
                                  {c.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {c.totalLearners} learner
                                  {c.totalLearners === 1 ? "" : "s"} · avg{" "}
                                  {c.avgProgress}% progress
                                </p>
                              </div>
                              <ChevronDown
                                className={`size-5 text-gray-400 shrink-0 transition-transform ${
                                  open ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                            {open && (
                              <div className="px-3 pb-3 pt-0 border-t border-orange-100/80">
                                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mt-3">
                                  <div>
                                    <dt className="text-gray-500">
                                      Active learners
                                    </dt>
                                    <dd className="font-semibold text-gray-900 tabular-nums">
                                      {c.activeLearners}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-gray-500">
                                      Completed
                                    </dt>
                                    <dd className="font-semibold text-gray-900 tabular-nums">
                                      {c.completedLearners}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-gray-500">
                                      Total learners
                                    </dt>
                                    <dd className="font-semibold text-gray-900 tabular-nums">
                                      {c.totalLearners}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-gray-500">
                                      Avg. progress
                                    </dt>
                                    <dd className="font-semibold text-gray-900 tabular-nums">
                                      {c.avgProgress}%
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-gray-500">
                                      New (30 days)
                                    </dt>
                                    <dd className="font-semibold text-gray-900 tabular-nums">
                                      {c.newEnrollments30d}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-gray-500">
                                      Need your attention
                                    </dt>
                                    <dd className="font-semibold text-gray-900 tabular-nums">
                                      {c.pendingQnaCount}
                                    </dd>
                                  </div>
                                </dl>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <Link
                                    href={`/instructor/course/${c._id}/qna?title=${encodeURIComponent(c.title)}`}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MessageCircle className="size-3.5" />
                                    Questions for this course
                                  </Link>
                                  {c.slug ? (
                                    <>
                                      <Link
                                        href={`/courses/${c.slug}/watch`}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-900"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Play className="size-3.5" />
                                        Watch / preview
                                      </Link>
                                      <Link
                                        href={`/courses/${c.slug}`}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        View course
                                        <ArrowRight className="size-3.5" />
                                      </Link>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            )}
                          </button>
                        </li>
                      );
                    })}
                    </ul>
                    {hasMoreCourses ? (
                      <div
                        ref={loadMoreSentinelRef}
                        className="flex flex-col items-center justify-center gap-2 py-4 min-h-[52px]"
                        aria-hidden
                      >
                        <Loader2
                          className="size-6 text-orange-500 animate-spin"
                          aria-label="Loading more courses"
                        />
                        <span className="text-xs text-gray-500">
                          Loading more…
                        </span>
                      </div>
                    ) : courses.length > COURSES_PAGE_SIZE ? (
                      <p className="text-center text-xs text-gray-400 pt-2 pb-1">
                        All {courses.length} courses loaded
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  iconClass,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint: string;
  accent: string;
  iconClass: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${accent}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex size-10 items-center justify-center rounded-xl bg-white/80 border border-gray-100/80 shadow-sm">
          <Icon className={`size-5 ${iconClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums mt-1 leading-tight">
            {value}
          </p>
          <p className="text-xs text-gray-600 mt-2 leading-snug">{hint}</p>
        </div>
      </div>
    </div>
  );
}
