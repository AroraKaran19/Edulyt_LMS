"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Loader2, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "@/hooks/useAuth";
import useCommunityReview, {
  type PublicCommunityReview,
} from "@/hooks/useCommunityReview";
import Modal from "@/components/ui/Modal";
import CommentThread from "./CommentThread";

interface StoryCardProps {
  story: PublicCommunityReview;
  onDeleted?: (id: string) => void;
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

const StoryCard = ({ story, onDeleted }: StoryCardProps) => {
  const { isAuthenticated, user: currentUser } = useAuth();
  const { toggleLike, deleteOwnReview } = useCommunityReview();

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isPreview = story._id === "preview";
  const timeAgo = formatTimeAgo(story.createdAt);

  // Only non-anonymous posts have a populated user object; we compare that
  // user's id against the current session id to decide whether to show the
  // delete affordance. Anonymous posts can't be deleted because the schema
  // doesn't store an author for them.
  const authorId =
    user && "_id" in user ? (user._id as string | undefined) : undefined;
  const isOwner =
    !isPreview &&
    !!authorId &&
    !!currentUser?._id &&
    String(authorId) === String(currentUser._id);

  const confirmDelete = async () => {
    if (!isOwner || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteOwnReview(story._id);
      setIsConfirmOpen(false);
      toast.success("Post deleted.");
      onDeleted?.(story._id);
    } catch (err) {
      console.error("Failed to delete community review:", err);
      toast.error("Couldn't delete the post.");
      setIsDeleting(false);
    }
  };

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
      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 whitespace-pre-line">
        {story.review}
      </p>

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
        <div className="flex items-center gap-3">
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isDeleting}
              aria-label="Delete post"
              title="Delete post"
              className="text-gray-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          )}
          {timeAgo && (
            <span className="text-xs font-bold text-gray-400">{timeAgo}</span>
          )}
        </div>
      </div>

      {isCommentsOpen && !isPreview && (
        <CommentThread
          reviewId={story._id}
          onCountChange={setCommentsCount}
        />
      )}

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          if (!isDeleting) setIsConfirmOpen(false);
        }}
        showCloseButton={false}
        className="max-w-sm rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.12)]"
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-5 shadow-[0_4px_12px_rgba(247,113,36,0.18)]">
            <Trash2 className="w-6 h-6 text-[#F77124]" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">
            Delete this post?
          </h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            This can&apos;t be undone. Your story and all of its replies will
            be removed.
          </p>

          <div className="mt-6 flex w-full gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isDeleting}
              className="flex-1 px-6 py-2.5 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 px-6 py-2.5 rounded-full bg-[#F77124] hover:bg-[#e66013] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(247,113,36,0.3)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StoryCard;
