"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import useAnnouncements, { type Announcement } from "@/hooks/useAnnouncements";

/**
 * Latest announcement for the learner dashboard. Renders nothing when there
 * are no announcements; older ones live at /dashboard/announcements.
 */
const AnnouncementSection = () => {
  const { getFeed } = useAnnouncements();
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const feed = await getFeed();
        if (!cancelled) setItems(feed);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getFeed]);

  if (!items || items.length === 0) return null;

  const latest = items[0];

  return (
    <div className="flex h-max w-full flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:p-4 md:p-5">
      <div className="flex w-full items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold sm:text-base">
          <Megaphone className="size-4 text-[#F77124] sm:size-5" />
          Announcement
        </h2>
        {items.length > 1 && (
          <Link
            href="/dashboard/announcements"
            className="text-xs font-medium text-[#F77124] hover:underline"
          >
            View all
          </Link>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-black">{latest.title}</h3>
        <p className="mt-1 whitespace-pre-wrap text-xs text-[#667085]">
          {latest.message}
        </p>
      </div>
    </div>
  );
};

export default AnnouncementSection;
