"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import StoryCard from "./StoryCard";
import useCommunityReview, {
  type CommunityReviewTag,
  type PublicCommunityReview,
} from "@/hooks/useCommunityReview";

interface CommunityFeedProps {
  selectedTag?: CommunityReviewTag | null;
}

const PAGE_SIZE = 10;

const CommunityFeed = ({ selectedTag = null }: CommunityFeedProps) => {
  const { listPublicReviews } = useCommunityReview();

  const [stories, setStories] = useState<PublicCommunityReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Guards against overlapping fetches (scroll can fire repeatedly).
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = page < totalPages;

  const loadPage = useCallback(
    async (pageToLoad: number) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (pageToLoad === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      try {
        const result = await listPublicReviews({
          page: pageToLoad,
          limit: PAGE_SIZE,
          tag: selectedTag ?? undefined,
        });
        setTotal(result.total);
        setTotalPages(Math.max(1, result.totalPages));
        setPage(result.page);
        setStories((prev) =>
          pageToLoad === 1 ? result.reviews : [...prev, ...result.reviews],
        );
      } catch (err) {
        console.error("Failed to load community feed:", err);
        toast.error("Couldn't load community stories.");
        if (pageToLoad === 1) {
          setStories([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [listPublicReviews, selectedTag],
  );

  // Reset to the first page whenever the tag filter changes (and on mount).
  useEffect(() => {
    setStories([]);
    setPage(1);
    setTotalPages(1);
    void loadPage(1);
  }, [loadPage]);

  // Auto-load the next page as the sentinel scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingRef.current) {
          void loadPage(page + 1);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, page, loadPage]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-extrabold text-gray-900">Read Stories</h2>
        <span className="text-sm font-bold text-[#F77124]">
          ({total} {total === 1 ? "review" : "reviews"})
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#F77124]" />
          <p className="text-sm">Loading stories…</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="w-full bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center">
          <h3 className="text-base font-semibold text-gray-900">
            {selectedTag
              ? `No stories in "${selectedTag}" yet`
              : "No stories yet"}
          </h3>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {stories.map((story) => (
            <StoryCard key={story._id} story={story} />
          ))}

          {/* Infinite-scroll sentinel + loaders */}
          {hasMore && <div ref={sentinelRef} className="h-px w-full" />}

          {isLoadingMore && (
            <div className="flex items-center justify-center py-6 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#F77124]" />
            </div>
          )}

          {!hasMore && stories.length > 0 && (
            <p className="py-6 text-center text-xs text-gray-400">
              You&apos;ve reached the end.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;
