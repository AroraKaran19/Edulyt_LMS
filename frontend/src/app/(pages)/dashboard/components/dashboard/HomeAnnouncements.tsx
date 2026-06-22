"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, ArrowRight } from "lucide-react";
import useAnnouncements, {
  type Announcement,
  type LearnerFeedAudience,
} from "@/hooks/useAnnouncements";
import { cn } from "@/lib/utils";

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Minimal per-audience accents — same colour language as the bold banners. */
const CARD_THEME: Record<
  LearnerFeedAudience,
  {
    label: string;
    href: string;
    chip: string;
    accent: string;
    dot: string;
    hoverBorder: string;
  }
> = {
  course: {
    label: "Courses",
    href: "/dashboard/announcements",
    chip: "bg-orange-50 text-[#E25C12]",
    accent: "text-[#E25C12]",
    dot: "bg-[#E25C12]",
    hoverBorder: "hover:border-orange-200",
  },
  internship: {
    label: "Internships",
    href: "/dashboard/internships/announcements",
    chip: "bg-indigo-50 text-[#4338CA]",
    accent: "text-[#4338CA]",
    dot: "bg-[#4338CA]",
    hoverBorder: "hover:border-indigo-200",
  },
};

function AnnouncementMiniCard({
  audience,
  items,
}: {
  audience: LearnerFeedAudience;
  items: Announcement[];
}) {
  const theme = CARD_THEME[audience];
  const latest = items[0];
  const isNew =
    !!latest.createdAt &&
    Date.now() - new Date(latest.createdAt).getTime() < NEW_WINDOW_MS;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors",
        theme.hoverBorder,
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
          theme.chip,
        )}
      >
        <Megaphone className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider",
              theme.accent,
            )}
          >
            {isNew && (
              <span className="relative flex size-1.5">
                <span
                  className={cn(
                    "absolute inline-flex size-full rounded-full opacity-75 motion-safe:animate-ping",
                    theme.dot,
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex size-1.5 rounded-full",
                    theme.dot,
                  )}
                />
              </span>
            )}
            {theme.label}
          </span>
          {items.length > 1 && (
            <Link
              href={theme.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold hover:underline",
                theme.accent,
              )}
            >
              View all
              <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
        <h3 className="mt-1 truncate text-sm font-semibold text-gray-900">
          {latest.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
          {latest.message}
        </p>
      </div>
    </div>
  );
}

/**
 * Home dashboard announcements: a minimal pair of cards showing the latest
 * course and internship updates together. Each card only appears when its feed
 * has an item, and the section is hidden entirely when both are empty.
 */
const HomeAnnouncements = () => {
  const { getFeed } = useAnnouncements();
  const [course, setCourse] = useState<Announcement[]>([]);
  const [internship, setInternship] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [c, i] = await Promise.allSettled([
        getFeed("course"),
        getFeed("internship"),
      ]);
      if (cancelled) return;
      if (c.status === "fulfilled") setCourse(c.value);
      if (i.status === "fulfilled") setInternship(i.value);
    })();
    return () => {
      cancelled = true;
    };
  }, [getFeed]);

  const hasCourse = course.length > 0;
  const hasInternship = internship.length > 0;
  if (!hasCourse && !hasInternship) return null;

  const both = hasCourse && hasInternship;

  return (
    <section
      aria-label="Announcements"
      className={cn("grid grid-cols-1 gap-3 sm:gap-4", both && "md:grid-cols-2")}
    >
      {hasCourse && <AnnouncementMiniCard audience="course" items={course} />}
      {hasInternship && (
        <AnnouncementMiniCard audience="internship" items={internship} />
      )}
    </section>
  );
};

export default HomeAnnouncements;
