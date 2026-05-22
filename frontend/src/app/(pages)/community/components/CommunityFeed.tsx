"use client";

import { useCallback, useEffect, useState } from "react";
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

const CommunityFeed = ({ selectedTag = null }: CommunityFeedProps) => {
  const { listPublicReviews } = useCommunityReview();

  const [stories, setStories] = useState<PublicCommunityReview[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listPublicReviews({
        page: 1,
        limit: 50,
        tag: selectedTag ?? undefined,
      });
      setStories(result.reviews);
      setTotal(result.total);
    } catch (err) {
      console.error("Failed to load community feed:", err);
      toast.error("Couldn't load community stories.");
      setStories([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [listPublicReviews, selectedTag]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

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
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;
