"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Send } from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "@/hooks/useAuth";
import useCommunityReview, {
    type CommunityReviewReply,
} from "@/hooks/useCommunityReview";

interface CommentThreadProps {
    reviewId: string;
    /** Bumped by the parent when a new reply is added so the count can be kept in sync. */
    onCountChange?: (next: number) => void;
}

const isPopulatedUser = (
    u: CommunityReviewReply["userId"]
): u is Exclude<CommunityReviewReply["userId"], string | undefined> =>
    !!u && typeof u === "object";

const formatWhen = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const diff = Date.now() - d.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return "just now";
    if (diff < hour) return `${Math.floor(diff / minute)}m`;
    if (diff < day) return `${Math.floor(diff / hour)}h`;
    return d.toLocaleDateString();
};

const replyInitials = (reply: CommunityReviewReply) => {
    if (!isPopulatedUser(reply.userId)) return "AN";
    const u = reply.userId;
    return (
        (u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "") ||
        "?"
    ).toUpperCase();
};

const replyDisplayName = (reply: CommunityReviewReply) => {
    if (!reply.userId) return "Anonymous";
    if (!isPopulatedUser(reply.userId)) return "Member";
    const u = reply.userId;
    return (
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "Member"
    );
};

const CommentThread = ({ reviewId, onCountChange }: CommentThreadProps) => {
    const { isAuthenticated } = useAuth();
    const { listReplies, addReply } = useCommunityReview();

    const [replies, setReplies] = useState<CommunityReviewReply[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [draft, setDraft] = useState("");
    const [isPosting, setIsPosting] = useState(false);

    const fetchReplies = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await listReplies(reviewId, { page: 1, limit: 100 });
            setReplies(result.replies);
            onCountChange?.(result.total);
        } catch (err) {
            console.error("Failed to load replies:", err);
            toast.error("Couldn't load replies.");
        } finally {
            setIsLoading(false);
        }
    }, [listReplies, reviewId, onCountChange]);

    useEffect(() => {
        fetchReplies();
    }, [fetchReplies]);

    const handlePost = async () => {
        const text = draft.trim();
        if (!text) return;
        if (!isAuthenticated) {
            toast.info("Sign in to reply.");
            return;
        }
        setIsPosting(true);
        try {
            const reply = await addReply(reviewId, { message: text });
            const next = [...replies, reply];
            setReplies(next);
            setDraft("");
            onCountChange?.(next.length);
        } catch (err) {
            console.error("Failed to post reply:", err);
            toast.error("Couldn't post your reply.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading replies…
                </div>
            ) : replies.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                    No replies yet — be the first.
                </p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {replies.map((reply) => {
                        const u = isPopulatedUser(reply.userId)
                            ? reply.userId
                            : null;
                        return (
                            <li
                                key={reply._id}
                                className="flex items-start gap-3"
                            >
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center text-xs font-semibold text-gray-500">
                                    {u?.profilePicture ? (
                                        <Image
                                            src={u.profilePicture}
                                            alt={replyDisplayName(reply)}
                                            fill
                                            sizes="32px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        replyInitials(reply)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-900 truncate">
                                            {replyDisplayName(reply)}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {formatWhen(reply.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                        {reply.message}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="mt-4 flex items-center gap-2">
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handlePost();
                        }
                    }}
                    placeholder={
                        isAuthenticated
                            ? "Write a reply…"
                            : "Sign in to reply"
                    }
                    disabled={!isAuthenticated || isPosting}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                    type="button"
                    onClick={handlePost}
                    disabled={
                        !isAuthenticated || isPosting || draft.trim() === ""
                    }
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F77124] text-white hover:bg-[#e66013] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Post reply"
                >
                    {isPosting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default CommentThread;
