"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import Loader from "@/components/ui/Loader";
import useAnnouncements, { type Announcement } from "@/hooks/useAnnouncements";

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
};

export default function PartnerAnnouncementsPage() {
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

  return (
    <div className="space-y-4 p-2 py-6 sm:p-4">
      <h1 className="flex items-center gap-2 text-lg font-semibold text-black sm:text-2xl">
        <Megaphone className="size-6 text-[#F77124]" />
        Announcements
      </h1>

      {items === null ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" />
        </div>
      ) : items.length === 0 ? (
        <PartnerCard className="p-6 text-center">
          <p className="text-sm text-[#667085]">No announcements yet.</p>
        </PartnerCard>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <PartnerCard key={a._id} className="p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-[#1D2939] sm:text-base">
                {a.title}
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#475467]">
                {a.message}
              </p>
              <p className="mt-2 text-xs text-[#98A2B3]">
                {formatDate(a.createdAt)}
              </p>
            </PartnerCard>
          ))}
        </div>
      )}
    </div>
  );
}
