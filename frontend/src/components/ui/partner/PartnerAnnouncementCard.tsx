"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import useAnnouncements, { type Announcement } from "@/hooks/useAnnouncements";

/**
 * Latest announcement for the partner dashboard. Renders nothing when there
 * are no announcements; older ones live at /partner/announcements.
 */
export default function PartnerAnnouncementCard() {
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
    <PartnerCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-black sm:text-xl">
          <Megaphone className="size-5 text-[#F77124]" />
          Announcement
        </h2>
        {items.length > 1 && (
          <Link
            href="/partner/announcements"
            className="text-xs font-semibold text-[#F77124] hover:underline"
          >
            View all
          </Link>
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-[#1D2939]">
        {latest.title}
      </h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-[#475467]">
        {latest.message}
      </p>
    </PartnerCard>
  );
}
