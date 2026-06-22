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

/**
 * Per-audience accent so the two banners read as distinct at a glance while
 * staying on-brand: course keeps the brand orange, internship uses the indigo
 * accent already used on the internships dashboard.
 */
const BANNER_THEME: Record<
  LearnerFeedAudience,
  { surface: string; accentText: string; accentBg: string }
> = {
  course: {
    surface:
      "bg-linear-to-r from-[#F77124] via-[#FB8537] to-[#E25C12] shadow-orange-500/25",
    accentText: "text-[#E25C12]",
    accentBg: "bg-[#E25C12]",
  },
  internship: {
    surface:
      "bg-linear-to-r from-[#4F46E5] via-[#6366F1] to-[#4338CA] shadow-indigo-500/25",
    accentText: "text-[#4338CA]",
    accentBg: "bg-[#4338CA]",
  },
};

interface AnnouncementSectionProps {
  /** Which learner feed to show. Defaults to the course dashboard feed. */
  audience?: LearnerFeedAudience;
  /** Where "View all" links to. Defaults to the course announcements page. */
  viewAllHref?: string;
  /** Extra classes for the outer banner (e.g. spacing) — only applied when rendered. */
  className?: string;
}

/**
 * Top-of-dashboard announcement banner. Bold and motion-accented to draw the
 * eye to the latest update; renders nothing when there are no announcements.
 * Used on both the course dashboard and the internships dashboard.
 */
const AnnouncementSection = ({
  audience = "course",
  viewAllHref = "/dashboard/announcements",
  className,
}: AnnouncementSectionProps = {}) => {
  const { getFeed } = useAnnouncements();
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const feed = await getFeed(audience);
        if (!cancelled) setItems(feed);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getFeed, audience]);

  if (!items || items.length === 0) return null;

  const latest = items[0];
  const isNew =
    !!latest.createdAt &&
    Date.now() - new Date(latest.createdAt).getTime() < NEW_WINDOW_MS;
  const theme = BANNER_THEME[audience];

  return (
    <section
      aria-label="Latest announcement"
      className={cn(
        "relative isolate w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10",
        theme.surface,
        className,
      )}
    >
      {/* Sweeping sheen to catch the eye */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 z-0 w-1/3 bg-linear-to-r from-transparent via-white/25 to-transparent motion-safe:animate-announcement-sheen"
      />

      <div className="relative z-10 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        {/* Broadcasting megaphone */}
        <div className="relative flex size-12 shrink-0 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-white/30 motion-safe:animate-ping"
          />
          <span className="relative flex size-12 items-center justify-center rounded-full bg-white/20 ring-1 ring-inset ring-white/40 backdrop-blur-sm">
            <Megaphone className="size-6 text-white" />
          </span>
        </div>

        {/* Copy */}
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
              theme.accentText,
            )}
          >
            {isNew && (
              <span className="relative flex size-2">
                <span
                  className={cn(
                    "absolute inline-flex size-full rounded-full opacity-75 motion-safe:animate-ping",
                    theme.accentBg,
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex size-2 rounded-full",
                    theme.accentBg,
                  )}
                />
              </span>
            )}
            {isNew ? "New" : "Announcement"}
          </span>
          <h2 className="mt-1.5 truncate text-base font-bold text-white sm:text-lg">
            {latest.title}
          </h2>
          <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-sm text-white/90">
            {latest.message}
          </p>
        </div>

        {/* View all */}
        {items.length > 1 && (
          <Link
            href={viewAllHref}
            className={cn(
              "group inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-white/90 sm:self-center",
              theme.accentText,
            )}
          >
            View all
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </section>
  );
};

export default AnnouncementSection;
