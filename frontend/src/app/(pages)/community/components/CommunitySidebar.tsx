"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  COMMUNITY_REVIEW_TAGS,
  type CommunityReviewTag,
} from "@/hooks/useCommunityReview";

const CATEGORIES: { label: string; value: CommunityReviewTag | null }[] = [
  { label: "All", value: null },
  ...COMMUNITY_REVIEW_TAGS.map((t) => ({ label: t, value: t })),
];

interface CommunitySidebarProps {
  activeTag: CommunityReviewTag | null;
  onTagChange: (next: CommunityReviewTag | null) => void;
}

const CommunitySidebar = ({
  activeTag,
  onTagChange,
}: CommunitySidebarProps) => {
  return (
    <div className="w-full max-w-60 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
      <ul className="flex flex-col gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = activeTag === cat.value;
          return (
            <li key={cat.label}>
              <button
                type="button"
                onClick={() => onTagChange(cat.value)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl font-bold transition-all",
                  isActive
                    ? "bg-orange-50 text-[#F77124] shadow-[0_2px_8px_rgba(247,113,36,0.1)]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {cat.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CommunitySidebar;
