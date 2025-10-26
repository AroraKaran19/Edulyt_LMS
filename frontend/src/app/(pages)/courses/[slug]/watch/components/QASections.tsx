import { useState } from "react";
import { MessageCircle, Search, Plus, X } from "lucide-react";
import Image from "next/image";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Button } from "@/components/ui/buttons/button";
import { QnA, QnAReply } from "@/types/qna";
import useQnA from "@/hooks/useQnA";
import { toast } from "react-toastify";

const QASections = ({
  questions,
  search,
  onSearchChange,
  isLoading = false,
  courseId,
  lessonId = "",
  contentId = "",
  onRefresh,
}: {
  questions: QnA[];
  search: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  courseId?: string;
  lessonId?: string;
  contentId?: string;
  onRefresh?: () => void;
}) => {
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

  const { createQnA, addReply, validateQnA, validateReply } = useQnA();

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
            className="text-[#2B1508] font-bold text-base p-4 rounded-2xl border border-[#00000026] flex items-center gap-2 hover:bg-gray-50 transition-colors"
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
              <button
                type="button"
                onClick={() => {
                  setIsAskingQuestion(false);
                  setNewQuestion("");
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
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
                  <span className="font-medium">Note:</span> No specific lesson
                  or content is selected. This will be a general course
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
              <TextArea
                placeholder="What would you like to know about this course?"
                value={newQuestion}
                setChange={setNewQuestion}
                rows={4}
                minLength={10}
                maxLength={1000}
                showWordCount={true}
                required
                className="mb-4"
              />

              <div className="flex items-center gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAskingQuestion(false);
                    setNewQuestion("");
                  }}
                >
                  Cancel
                </Button>
                <OrangeButton
                  type="submit"
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
              ? `${user.firstName} ${user.lastName}`
              : user?.email ?? "Anonymous User";
            const userAvatar = user?.profilePicture || "/user.svg";

            return (
              <div key={qna._id} className="bg-white rounded-lg p-6">
                {/* User Info */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={userAvatar}
                      alt={userName}
                      className="w-full h-full object-cover"
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-normal font-coolvetica text-black text-xl">
                      {userName}
                    </h3>
                    <p className="text-xs font-normal font-plus-jakarta text-[#575757]">
                      {qna.createdAt
                        ? new Date(qna.createdAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Question Content */}
                <div className="mb-4">
                  <p className="text-black text-base font-normal leading-relaxed font-plus-jakarta">
                    {qna.message}
                  </p>
                </div>

                {/* Replies */}
                {qna.replies && qna.replies.length > 0 && (
                  <div className="ml-13 mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      {qna.replies.length}{" "}
                      {qna.replies.length === 1 ? "Reply" : "Replies"}
                    </h4>
                    {qna.replies.map((reply: QnAReply) => {
                      const replyUser =
                        typeof reply.userId === "object" ? reply.userId : null;
                      const replyUserName = replyUser?.firstName
                        ? `${replyUser.firstName} ${replyUser.lastName}`
                        : replyUser?.email ?? "Anonymous User";
                      const replyUserAvatar =
                        replyUser?.profilePicture ?? "/user.svg";

                      return (
                        <div
                          key={reply._id}
                          className="flex items-start gap-3 mb-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                            <Image
                              src={replyUserAvatar}
                              alt={replyUserName}
                              className="w-full h-full object-cover"
                              width={32}
                              height={32}
                            />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-sm text-gray-900">
                              {replyUserName}
                            </h5>
                            <p className="text-sm text-gray-700 mt-1">
                              {reply.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {reply.createdAt
                                ? new Date(reply.createdAt).toLocaleDateString()
                                : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Reply"
                    className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-2 px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                    onClick={() =>
                      setOpenReplyId(
                        openReplyId === qna._id ? null : qna._id || null
                      )
                    }
                  >
                    <MessageCircle className="size-6 text-black" />
                    <span className="text-base font-bold font-plus-jakarta text-black">
                      Reply
                    </span>
                  </button>
                </div>

                {openReplyId === qna._id && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Add Reply
                      </h4>
                      <button
                        type="button"
                        onClick={() => setOpenReplyId(null)}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        title="Close"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const replyMessage = formData.get("reply") as string;

                        if (!replyMessage.trim()) {
                          toast.error("Please enter a reply");
                          return;
                        }

                        const errors = validateReply({ message: replyMessage });
                        if (errors.length > 0) {
                          toast.error(errors[0]);
                          return;
                        }

                        const result = await addReply(qna._id!, {
                          message: replyMessage,
                        });
                        if (result) {
                          toast.success("Reply posted successfully!");
                          setOpenReplyId(null);
                          onRefresh?.();
                        }
                      }}
                    >
                      <TextArea
                        name="reply"
                        placeholder="Add your reply here..."
                        rows={3}
                        minLength={5}
                        maxLength={500}
                        showWordCount={true}
                        required
                        className="mb-3"
                      />

                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenReplyId(null)}
                        >
                          Cancel
                        </Button>
                        <OrangeButton
                          type="submit"
                          className="px-4 py-2 text-sm"
                        >
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
};

export default QASections;
