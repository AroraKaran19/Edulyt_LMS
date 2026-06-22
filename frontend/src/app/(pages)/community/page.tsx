"use client";

import { useState } from "react";
import HeroSection from "./components/HeroSection";
import WritePostCard from "./components/WritePostCard";
import CommunitySidebar from "./components/CommunitySidebar";
import CommunityFeed from "./components/CommunityFeed";
import RightSidebar from "./components/RightSidebar";
import type { CommunityReviewTag } from "@/hooks/useCommunityReview";

const CommunityPage = () => {
  const [activeTag, setActiveTag] = useState<CommunityReviewTag | null>(null);

  const handleTagChange = (next: CommunityReviewTag | null) => {
    setActiveTag(next);
    // Switching category reloads the feed from page 1 — bring the user back to
    // the top so they start reading the filtered stories from the beginning.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className=" mx-auto w-full md:px-6 lg:px-8 py-4">
      <HeroSection />
      <WritePostCard />

      <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="hidden lg:block lg:w-60 shrink-0 lg:sticky lg:top-24 lg:self-start">
          <CommunitySidebar
            activeTag={activeTag}
            onTagChange={handleTagChange}
          />
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-8 xl:flex-row xl:items-start">
          <div className="flex-1 min-w-0">
            <CommunityFeed selectedTag={activeTag} />
          </div>

          <aside className="w-full xl:w-[360px] xl:shrink-0">
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
