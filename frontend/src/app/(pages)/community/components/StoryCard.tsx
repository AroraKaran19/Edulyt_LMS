"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "@/hooks/useAuth";
import useCommunityReview, {
  type PublicCommunityReview,
} from "@/hooks/useCommunityReview";
import CommentThread from "./CommentThread";

interface StoryCardProps {
  story: PublicCommunityReview;
}

const isPopulatedUser = (
  u: PublicCommunityReview["userId"]
): u is Exclude<PublicCommunityReview["userId"], string | undefined> =>
  !!u && typeof u === "object";

const formatTimeAgo = (iso?: string) => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) return "just now";
  if (diff < hour) {
    const n = Math.floor(diff / minute);
    return `${n} minute${n === 1 ? "" : "s"} ago`;
  }
  if (diff < day) {
    const n = Math.floor(diff / hour);
    return `${n} hour${n === 1 ? "" : "s"} ago`;
  }
  if (diff < week) {
    const n = Math.floor(diff / day);
    return `${n} day${n === 1 ? "" : "s"} ago`;
  }
  if (diff < month) {
    const n = Math.floor(diff / week);
    return `${n} week${n === 1 ? "" : "s"} ago`;
  }
  if (diff < year) {
    const n = Math.floor(diff / month);
    return `${n} month${n === 1 ? "" : "s"} ago`;
  }
  const n = Math.floor(diff / year);
  return `${n} year${n === 1 ? "" : "s"} ago`;
};

const initials = (firstName?: string, lastName?: string) => {
  const a = firstName?.[0] ?? "";
  const b = lastName?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
};

// Render review text with #hashtags tinted in the brand orange. Splitting on a
// capture group keeps the delimiters, so surrounding text + newlines are
// preserved for `whitespace-pre-line`.
const renderReview = (text: string) =>
  text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) =>
    /^#[\p{L}\p{N}_]+$/u.test(part) ? (
      <span key={i} className="font-semibold text-[#F77124]">
        {part}
      </span>
    ) : (
      part
    ),
  );

const StoryCard = ({ story }: StoryCardProps) => {
  const { isAuthenticated } = useAuth();
  const { toggleLike } = useCommunityReview();

  const user = isPopulatedUser(story.userId) ? story.userId : null;
  const isAnonymous = !user;

  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      "Member"
    : "Anonymous";

  const college = user?.collegeName;
  const role = user?.currentPosition;
  const company = user?.currentCompany;

  const [totalLikes, setTotalLikes] = useState(story.totalLikes);
  const [hasLiked, setHasLiked] = useState(story.hasLiked);
  const [isToggling, setIsToggling] = useState(false);

  const [commentsCount, setCommentsCount] = useState(story.repliesCount);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const isPreview = story._id === "preview";
  const timeAgo = formatTimeAgo(story.createdAt);

  // "Read more" toggle — only surfaced when the review overflows the 3-line clamp.
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClampable, setIsClampable] = useState(false);
  const reviewRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = reviewRef.current;
    if (!el) return;
    // Measured while collapsed (clamped): hidden overflow ⇒ a toggle is needed.
    if (!isExpanded) {
      setIsClampable(el.scrollHeight > el.clientHeight + 1);
    }
  }, [story.review, isExpanded]);

  const handleLike = async () => {
    if (isPreview) return;
    if (!isAuthenticated) {
      toast.info("Sign in to like.");
      return;
    }
    if (isToggling) return;

    // Optimistic — flip first, then reconcile with server response.
    const optimisticLiked = !hasLiked;
    setHasLiked(optimisticLiked);
    setTotalLikes((c) => c + (optimisticLiked ? 1 : -1));
    setIsToggling(true);

    try {
      const result = await toggleLike(story._id);
      setHasLiked(result.liked);
      setTotalLikes(result.totalLikes);
    } catch (err) {
      // Revert
      setHasLiked(!optimisticLiked);
      setTotalLikes((c) => c + (optimisticLiked ? -1 : 1));
      console.error("Failed to toggle like:", err);
      toast.error("Couldn't update like.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
            {user?.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={fullName}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-sm">
                {isAnonymous
                  ? "AN"
                  : initials(user?.firstName, user?.lastName)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-gray-900">{fullName}</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#F77124]">
                {story.tag}
              </span>
            </div>
            {college && (
              <p className="text-xs font-bold text-gray-500">{college}</p>
            )}
            {(role || company) && (
              <p className="text-[10px] font-bold text-[#F77124]">
                {role}
                {role && company ? " at " : ""}
                {company && (
                  <span className="text-[#F77124]">{company}</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-extrabold text-gray-900 mb-2 leading-tight">
        {story.title}
      </h3>
      <div className="mb-6">
        <p
          ref={reviewRef}
          className={`text-gray-600 text-sm leading-relaxed whitespace-pre-line ${
            isExpanded ? "" : "line-clamp-3"
          }`}
        >
          {renderReview(story.review)}
        </p>
        {(isClampable || isExpanded) && (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="mt-1.5 text-xs font-bold text-[#F77124] hover:underline"
          >
            {isExpanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleLike}
            disabled={isToggling || isPreview}
            aria-pressed={hasLiked}
            className="flex items-center gap-2 group disabled:cursor-not-allowed"
          >
            <Heart
              className={
                hasLiked
                  ? "text-red-500 fill-red-500 group-hover:scale-110 transition-transform"
                  : "text-gray-400 group-hover:scale-110 group-hover:text-red-500 transition-all"
              }
              size={18}
            />
            <span className="text-sm font-bold text-gray-500">
              {totalLikes}
            </span>
          </button>
          <button
            type="button"
            onClick={() => !isPreview && setIsCommentsOpen((v) => !v)}
            disabled={isPreview}
            aria-expanded={isCommentsOpen}
            className="flex items-center gap-2 group disabled:cursor-not-allowed"
          >
            <MessageCircle
              className={
                isCommentsOpen
                  ? "text-[#F77124] group-hover:scale-110 transition-transform"
                  : "text-gray-400 group-hover:scale-110 group-hover:text-[#F77124] transition-all"
              }
              size={18}
            />
            <span className="text-sm font-bold text-gray-500">
              {commentsCount}
            </span>
          </button>
        </div>
        {timeAgo && (
          <span className="text-xs font-bold text-gray-400">{timeAgo}</span>
        )}
      </div>

      {isCommentsOpen && !isPreview && (
        <CommentThread
          reviewId={story._id}
          onCountChange={setCommentsCount}
        />
      )}
    </div>
  );
};

export default StoryCard;
