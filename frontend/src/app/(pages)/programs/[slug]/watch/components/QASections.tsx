import { useState, memo, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  MessageCircle,
  Search,
  Plus,
  X,
  Send,
  Loader2,
  ChevronDown,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Button } from "@/components/ui/buttons/button";
import type { User } from "@/types";
import { QnA, QnAReply } from "@/types/qna";
import useQnA from "@/hooks/useQnA";
import { toast } from "react-toastify";

// Helper function to get initials from name
const getInitials = (name: string): string => {
  if (name.includes("@")) {
    const username = name.split("@")[0];
    return username.substring(0, 2).toUpperCase();
  }

  if (name.toLowerCase().includes("anonymous")) {
    return "AU";
  }

  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to generate a consistent color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-teal-500",
  ];
  const index = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

function refUserId(
  userId: QnA["userId"] | QnAReply["userId"] | undefined,
): string {
  if (userId == null) return "";
  if (typeof userId === "object" && userId !== null && "_id" in userId) {
    const id = (userId as { _id?: unknown })._id;
    if (id != null) return String(id);
  }
  return String(userId);
}

const QASections = memo(
  ({
    questions,
    search,
    onSearchChange,
    isLoading = false,
    courseId,
    lessonId = "",
    contentId = "",
    onRefresh,
    onLoadMoreReplies,
    loadingRepliesForId = null,
    scrollToQnaId = null,
    canModerateQna = false,
  }: {
    questions: QnA[];
    search: string;
    onSearchChange: (value: string) => void;
    isLoading?: boolean;
    courseId?: string;
    lessonId?: string;
    contentId?: string;
    onRefresh?: () => void;
    onLoadMoreReplies?: (qnaId: string) => void;
    loadingRepliesForId?: string | null;
    /** Scroll to this thread after load (e.g. instructor deep link). */
    scrollToQnaId?: string | null;
    /** Instructor or admin: may delete any thread on this course. */
    canModerateQna?: boolean;
  }) => {
    const [openReplyId, setOpenReplyId] = useState<string | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
      new Set(),
    );
    const [isAskingQuestion, setIsAskingQuestion] = useState(false);

    const toggleRepliesExpanded = (qnaId: string) => {
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        if (next.has(qnaId)) next.delete(qnaId);
        else next.add(qnaId);
        return next;
      });
    };
    const [newQuestion, setNewQuestion] = useState("");
    const [replyText, setReplyText] = useState("");
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const [deletingQnaId, setDeletingQnaId] = useState<string | null>(null);
    const [deletingReplyKey, setDeletingReplyKey] = useState<string | null>(
      null,
    );

    const { data: session } = useSession();
    const sessionUser = session?.user as (User & { id?: string }) | undefined;
    const currentUserId =
      sessionUser?._id != null
        ? String(sessionUser._id)
        : sessionUser?.id != null
          ? String(sessionUser.id)
          : "";

    const {
      createQnA,
      addReply,
      validateQnA,
      validateReply,
      deleteQnA,
      removeReply,
    } = useQnA();

    const handleDeleteThread = async (qnaId: string) => {
      if (
        !window.confirm(
          "Delete this question and all of its replies? This cannot be undone.",
        )
      ) {
        return;
      }
      setDeletingQnaId(qnaId);
      try {
        const ok = await deleteQnA(qnaId);
        if (ok) {
          toast.success("Question deleted");
          setOpenReplyId((prev) => (prev === qnaId ? null : prev));
          onRefresh?.();
        } else {
          toast.error("Could not delete question");
        }
      } finally {
        setDeletingQnaId(null);
      }
    };

    const handleDeleteReply = async (qnaId: string, replyId: string) => {
      if (!window.confirm("Delete this reply?")) return;
      setDeletingReplyKey(`${qnaId}:${replyId}`);
      try {
        const ok = await removeReply(qnaId, replyId);
        if (ok) {
          toast.success("Reply deleted");
          onRefresh?.();
        } else {
          toast.error("Could not delete reply");
        }
      } finally {
        setDeletingReplyKey(null);
      }
    };

    useEffect(() => {
      if (!scrollToQnaId || isLoading) return;
      let cancelled = false;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const attempt = () => {
        if (cancelled) return;
        const el = document.getElementById(`qna-thread-${scrollToQnaId}`);
        if (!el) {
          timeoutId = setTimeout(attempt, 250);
          return;
        }
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add(
          "ring-2",
          "ring-orange-400",
          "ring-offset-2",
          "rounded-lg",
          "shadow-sm"
        );
        timeoutId = setTimeout(() => {
          el.classList.remove(
            "ring-2",
            "ring-orange-400",
            "ring-offset-2",
            "rounded-lg",
            "shadow-sm"
          );
        }, 4500);
      };

      const start = setTimeout(attempt, 350);
      return () => {
        cancelled = true;
        clearTimeout(start);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [scrollToQnaId, isLoading, questions]);

    const handleImageError = (id: string) => {
      setImageErrors((prev) => ({ ...prev, [id]: true }));
    };

    return (
      <div>
        {/* search bar */}
        <div className="flex justify-between gap-6">
          <div
            className={`w-full bg-[#F5F5F5] p-4 shrink rounded-xl flex gap-2 items-center border border-black/10`}
          >
            <Search className="size-6 text-black/30" />
            <input
              type="text"
              placeholder="Search for questions"
              className="w-full h-full placeholder:text-black/30 bg-transparent outline-none"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              title="Ask Question"
              className="text-[#2B1508] font-bold cursor-pointer text-base p-4 rounded-2xl border border-[#00000026] flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={() => setIsAskingQuestion(true)}
            >
              <Plus className="w-4 h-4" />
              Ask
            </button>
          </div>
        </div>

        {/* questions */}
        <div className="flex flex-col gap-4">
          {/* All Questions Header */}
          <div className="mt-6">
            <h2 className="text-3xl font-coolvetica font-normal text-black mb-4">
              All Questions
            </h2>
          </div>

          {/* Ask Question Form */}
          {isAskingQuestion && (
            <div className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ask a Question
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAskingQuestion(false);
                    setNewQuestion("");
                  }}
                  className="h-9 w-9 shrink-0 p-0 rounded-full cursor-pointer hover:bg-gray-100"
                  title="Close"
                  aria-label="Close ask question"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </Button>
              </div>

              {/* Context Information */}
              {lessonId || contentId ? (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Context:</span>{" "}
                    {lessonId && contentId
                      ? "This question will be associated with the current lesson and content you're viewing."
                      : lessonId
                        ? "This question will be associated with the current lesson you're viewing."
                        : "This question will be associated with the current content you're viewing."}
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Note:</span> No specific
                    lesson or content is selected. This will be a general course
                    question.
                  </p>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!courseId) {
                    toast.error("Course ID is required");
                    return;
                  }

                  const errors = validateQnA({
                    courseId,
                    lessonId,
                    contentId,
                    message: newQuestion,
                  });

                  if (errors.length > 0) {
                    toast.error(errors[0]);
                    return;
                  }

                  const result = await createQnA({
                    courseId,
                    lessonId,
                    contentId,
                    message: newQuestion,
                  });

                  if (result) {
                    toast.success("Question posted successfully!");
                    setIsAskingQuestion(false);
                    setNewQuestion("");
                    onRefresh?.();
                  }
                }}
              >
                <div className="mb-4 relative">
                  <textarea
                    placeholder="What would you like to know about this course?"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    rows={4}
                    minLength={10}
                    maxLength={1000}
                    required
                    className="w-full px-4 py-3.5 pb-8 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md resize-none"
                  />
                  <div className="absolute bottom-2 right-3 text-xs bg-white px-1 rounded">
                    <div
                      className={`text-right ${
                        newQuestion.length > 1000
                          ? "text-red-500"
                          : newQuestion.length < 10
                            ? "text-orange-500"
                            : "text-gray-500"
                      }`}
                    >
                      {newQuestion.length}/1000
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <WhiteButton
                    type="button"
                    className="text-sm px-4 py-2.5"
                    onClick={() => {
                      setIsAskingQuestion(false);
                      setNewQuestion("");
                    }}
                  >
                    Cancel
                  </WhiteButton>
                  <OrangeButton
                    type="submit"
                    className="text-sm px-4 py-2.5"
                    disabled={
                      !newQuestion.trim() || newQuestion.trim().length < 10
                    }
                  >
                    Post Question
                  </OrangeButton>
                </div>
              </form>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-500 font-plus-jakarta">
                Loading questions...
              </p>
            </div>
          )}

          {/* Question Items */}
          {!isLoading &&
            questions?.map((qna) => {
              const user = typeof qna.userId === "object" ? qna.userId : null;
              const userName = user?.firstName
                ? `${user.firstName} ${user.lastName || ""}`.trim()
                : (user?.email ?? "Anonymous User");
              const userAvatar = user?.profilePicture || "/user.svg";
              const nameForInitials = user?.firstName
                ? `${user.firstName} ${user.lastName || ""}`.trim()
                : "Anonymous User";
              const canDeleteThread =
                !!currentUserId &&
                (canModerateQna ||
                  refUserId(qna.userId) === currentUserId);

              return (
                <div
                  key={qna._id}
                  id={
                    qna._id ? `qna-thread-${qna._id}` : undefined
                  }
                  className="bg-white rounded-lg p-6 scroll-mt-24"
                >
                  {/* User Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                      {user?.profilePicture && !imageErrors[qna._id || ""] ? (
                        <Image
                          src={userAvatar}
                          alt={userName}
                          className="w-full h-full object-cover"
                          width={40}
                          height={40}
                          onError={() => handleImageError(qna._id || "")}
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(
                            nameForInitials,
                          )}`}
                        >
                          {getInitials(nameForInitials)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-start justify-between gap-2 min-w-0">
                      <div>
                        <h3 className="font-normal font-coolvetica text-black text-xl">
                          {userName}
                        </h3>
                        <p className="text-xs font-normal font-plus-jakarta text-[#575757]">
                          {qna.createdAt
                            ? new Date(qna.createdAt).toLocaleDateString(
                                "en-IN",
                                { timeZone: "Asia/Kolkata" },
                              )
                            : ""}
                        </p>
                      </div>
                      {canDeleteThread && qna._id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete question and all replies"
                          aria-label="Delete question and all replies"
                          disabled={deletingQnaId === qna._id}
                          onClick={() => handleDeleteThread(qna._id!)}
                        >
                          {deletingQnaId === qna._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="mb-4">
                    <p className="text-black text-base font-normal leading-relaxed font-plus-jakarta">
                      {qna.message}
                    </p>
                  </div>

                  {/* Replies - collapsed by default, expand on click */}
                  {qna.replies && qna.replies.length > 0 && (
                    <div className="ml-13 mb-4">
                      {expandedReplies.has(qna._id || "") ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">
                              {qna.totalReplies ?? qna.replies.length}{" "}
                              {(qna.totalReplies ?? qna.replies.length) === 1
                                ? "Reply"
                                : "Replies"}
                            </h4>
                            <button
                              type="button"
                              onClick={() =>
                                toggleRepliesExpanded(qna._id || "")
                              }
                              className="text-sm font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
                            >
                              Hide replies
                            </button>
                          </div>
                          {qna.replies.map((reply: QnAReply) => {
                            const replyUser =
                              typeof reply.userId === "object"
                                ? reply.userId
                                : null;
                            const replyUserName = replyUser?.firstName
                              ? `${replyUser.firstName} ${
                                  replyUser.lastName || ""
                                }`.trim()
                              : (replyUser?.email ?? "Anonymous User");
                            const replyUserAvatar =
                              replyUser?.profilePicture ?? "/user.svg";
                            const replyNameForInitials = replyUser?.firstName
                              ? `${replyUser.firstName} ${
                                  replyUser.lastName || ""
                                }`.trim()
                              : "Anonymous User";
                            const canDeleteOwnReply =
                              !!currentUserId &&
                              !!reply._id &&
                              refUserId(reply.userId) === currentUserId;
                            const replyKey = `${qna._id}:${reply._id}`;

                            return (
                              <div
                                key={reply._id}
                                className="flex items-start gap-3 mb-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                                  {replyUser?.profilePicture &&
                                  !imageErrors[reply._id || ""] ? (
                                    <Image
                                      src={replyUserAvatar}
                                      alt={replyUserName}
                                      className="w-full h-full object-cover"
                                      width={32}
                                      height={32}
                                      onError={() =>
                                        handleImageError(reply._id || "")
                                      }
                                    />
                                  ) : (
                                    <div
                                      className={`w-full h-full flex items-center justify-center text-white font-semibold text-xs ${getAvatarColor(
                                        replyNameForInitials,
                                      )}`}
                                    >
                                      {getInitials(replyNameForInitials)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm text-gray-900">
                                    {replyUserName}
                                  </h5>
                                  <p className="text-sm text-gray-700 mt-1">
                                    {reply.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {reply.createdAt
                                      ? new Date(
                                          reply.createdAt,
                                        ).toLocaleDateString("en-IN", {
                                          timeZone: "Asia/Kolkata",
                                        })
                                      : ""}
                                  </p>
                                </div>
                                {canDeleteOwnReply && reply._id && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Delete reply"
                                    aria-label="Delete reply"
                                    disabled={deletingReplyKey === replyKey}
                                    onClick={() =>
                                      handleDeleteReply(qna._id!, reply._id!)
                                    }
                                  >
                                    {deletingReplyKey === replyKey ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                          {onLoadMoreReplies &&
                            (qna.totalReplies ?? 0) > qna.replies.length && (
                              <button
                                type="button"
                                onClick={() => onLoadMoreReplies?.(qna._id!)}
                                disabled={loadingRepliesForId === qna._id}
                                className="mt-2 flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loadingRepliesForId === qna._id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading...
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Load 5 more replies
                                  </>
                                )}
                              </button>
                            )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleRepliesExpanded(qna._id || "")}
                          className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                          View {qna.totalReplies ?? qna.replies.length}{" "}
                          {(qna.totalReplies ?? qna.replies.length) === 1
                            ? "reply"
                            : "replies"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reply Button - align with question content (avatar + gap) */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0" aria-hidden />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Reply"
                        className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-2 px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                        onClick={() =>
                          setOpenReplyId(
                            openReplyId === qna._id ? null : qna._id || null,
                          )
                        }
                      >
                        <MessageCircle className="size-6 text-black" />
                        <span className="text-base font-bold font-plus-jakarta text-black">
                          Reply
                        </span>
                      </button>
                    </div>
                  </div>

                  {openReplyId === qna._id && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Add Reply
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOpenReplyId(null);
                            setReplyText("");
                          }}
                          className="h-8 w-8 shrink-0 p-0 rounded-full cursor-pointer hover:bg-gray-200"
                          title="Close"
                          aria-label="Close reply"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();

                          if (!replyText.trim()) {
                            toast.error("Please enter a reply");
                            return;
                          }

                          const errors = validateReply({ message: replyText });
                          if (errors.length > 0) {
                            toast.error(errors[0]);
                            return;
                          }

                          const result = await addReply(qna._id!, {
                            message: replyText,
                          });
                          if (result) {
                            toast.success("Reply posted successfully!");
                            setOpenReplyId(null);
                            setReplyText("");
                            onRefresh?.();
                          }
                        }}
                      >
                        <div className="mb-3 relative">
                          <textarea
                            placeholder="Add your reply here..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={3}
                            minLength={5}
                            maxLength={500}
                            required
                            className="w-full px-4 py-3.5 pb-8 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md resize-none"
                          />
                          <div className="absolute bottom-2 right-3 text-xs bg-white px-1 rounded">
                            <div
                              className={`text-right ${
                                replyText.length > 500
                                  ? "text-red-500"
                                  : replyText.length < 5
                                    ? "text-orange-500"
                                    : "text-gray-500"
                              }`}
                            >
                              {replyText.length}/500
                            </div>
                          </div>
                          {replyText.length < 5 && replyText.length > 0 && (
                            <div className="text-xs text-orange-500 mt-1">
                              Minimum 5 characters required (
                              {5 - replyText.length} more needed)
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 justify-end flex-wrap">
                          <WhiteButton
                            type="button"
                            className="text-sm px-4 py-2.5"
                            onClick={() => {
                              setOpenReplyId(null);
                              setReplyText("");
                            }}
                          >
                            Cancel
                          </WhiteButton>
                          <OrangeButton
                            type="submit"
                            className="text-sm px-4 py-2.5 inline-flex items-center gap-2"
                            disabled={
                              !replyText.trim() ||
                              replyText.trim().length < 5
                            }
                          >
                            <Send className="size-4 shrink-0" />
                            Post Reply
                          </OrangeButton>
                        </div>
                      </form>
                    </div>
                  )}
                  <hr className="border-3 border-[#0000000D] my-5" />
                </div>
              );
            })}

          {/* No results message */}
          {!isLoading && questions?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 font-plus-jakarta">
                No questions found. Be the first to ask a question!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.questions === nextProps.questions &&
      prevProps.search === nextProps.search &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.canModerateQna === nextProps.canModerateQna
    );
  },
);

QASections.displayName = "QASections";

export default QASections;
