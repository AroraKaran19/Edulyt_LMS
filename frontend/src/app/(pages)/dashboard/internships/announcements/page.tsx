"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import useAnnouncements, { type Announcement } from "@/hooks/useAnnouncements";
import Loader from "@/components/ui/Loader";

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return iso;
  }
};

export default function InternshipAnnouncementsPage() {
  const { getFeed } = useAnnouncements();
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const feed = await getFeed("internship");
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
    <div className="h-full w-full overflow-auto py-8">
      <div className="mb-6 flex items-center gap-2">
        <Megaphone className="size-6 text-[#F77124]" />
        <h1 className="text-xl font-bold text-black sm:text-2xl">
          Internship Announcements
        </h1>
      </div>

      {items === null ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-gray-200 p-6 text-center text-sm text-[#667085]">
          No announcements yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <div
              key={a._id}
              className="rounded-lg border border-gray-200 p-4"
            >
              <h3 className="text-sm font-semibold text-black sm:text-base">
                {a.title}
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#667085]">
                {a.message}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {formatDate(a.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
