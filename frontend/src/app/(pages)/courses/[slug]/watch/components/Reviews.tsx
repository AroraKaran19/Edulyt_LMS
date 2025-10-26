import { useState, useEffect, useRef } from "react";
import { Star, Search, Plus, X } from "lucide-react";
import Image from "next/image";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { Button } from "@/components/ui/buttons/button";
import useReview from "@/hooks/useReview";
import { Review } from "@/types/review";
import { toast } from "react-toastify";

const Reviews = ({
  courseId,
  isLoading = false,
  onRefresh,
}: {
  courseId?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState("");
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { getReviewsByReviewable, createReview, validateReview } = useReview();

  // Fetch reviews for this course
  const fetchReviews = async () => {
    if (!courseId) return;

    setIsLoadingReviews(true);
    try {
      const result = await getReviewsByReviewable("Course", courseId, {
        page: 1,
        limit: 50,
      });

      if (result) {
        setReviews(result.reviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [courseId, getReviewsByReviewable]);

  // Filter reviews based on search
  const filteredReviews = reviews?.filter(
    (review) =>
      review.comment.toLowerCase().includes(search.toLowerCase()) ||
      (typeof review.userId === "object" &&
        `${review.userId.firstName || ""} ${review.userId.lastName || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()))
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`size-4 ${
          index < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-400"
        }`}
      />
    ));
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
            placeholder="Search reviews..."
            className="w-full h-full placeholder:text-black/30 bg-transparent outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            title="Write Review"
            className="text-[#2B1508] font-bold text-base p-4 rounded-2xl border border-[#00000026] flex items-center gap-2 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
            onClick={() => setIsWritingReview(true)}
          >
            <Plus className="w-4 h-4" />
            Write Review
          </button>
        </div>
      </div>

      {/* Write Review Form */}
      {isWritingReview && (
        <div className="bg-white rounded-lg p-6 mb-4 border border-gray-200 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Write a Review
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsWritingReview(false);
                setNewReview({ rating: 5, comment: "" });
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!courseId) {
                toast.error("Course ID is required");
                return;
              }

              const errors = validateReview({
                rating: newReview.rating,
                comment: newReview.comment,
                reviewableType: "Course",
                reviewableId: courseId,
              });

              if (errors.length > 0) {
                toast.error(errors[0]);
                return;
              }

              const result = await createReview({
                rating: newReview.rating,
                comment: newReview.comment,
                reviewableType: "Course",
                reviewableId: courseId,
              });

              if (result) {
                toast.success("Review posted successfully!");
                setIsWritingReview(false);
                setNewReview({ rating: 5, comment: "" });
                onRefresh?.();
              }
            }}
          >
            {/* Rating Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      setNewReview((prev) => ({ ...prev, rating: index + 1 }))
                    }
                    className="focus:outline-none"
                  >
                    <Star
                      className={`size-6 ${
                        index < newReview.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-400 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {newReview.rating} star{newReview.rating !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <textarea
                ref={textareaRef}
                placeholder="Share your experience with this course..."
                value={newReview.comment}
                onChange={(e) => {
                  setNewReview((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }));
                }}
                onKeyDown={(e) => {
                  // Ensure space bar and other keys work normally
                  e.stopPropagation();
                }}
                rows={4}
                minLength={10}
                maxLength={1000}
                required
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 hover:shadow-sm transition-all duration-200 ease-in-out outline-none resize-none"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {newReview.comment.length}/1000 characters
                {newReview.comment.length < 10 && (
                  <span className="text-orange-500 ml-2">
                    (Minimum 10 characters required)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsWritingReview(false);
                  setNewReview({ rating: 5, comment: "" });
                }}
              >
                Cancel
              </Button>
              <OrangeButton
                type="submit"
                disabled={
                  !newReview.comment.trim() ||
                  newReview.comment.trim().length < 10
                }
              >
                Post Review
              </OrangeButton>
            </div>
          </form>
        </div>
      )}

      {/* reviews */}
      <div className="flex flex-col gap-4">
        {/* All Reviews Header */}
        <div className="mt-6">
          <h2 className="text-3xl font-coolvetica font-normal text-black mb-4">
            All Reviews
          </h2>
        </div>

        {/* Loading State */}
        {(isLoading || isLoadingReviews) && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500 font-plus-jakarta">
              Loading reviews...
            </p>
          </div>
        )}

        {/* Review Items */}
        {!isLoading &&
          !isLoadingReviews &&
          filteredReviews?.map((review) => {
            const user =
              typeof review.userId === "object" ? review.userId : null;
            const userName = user?.firstName
              ? `${user.firstName} ${user.lastName}`
              : user?.email ?? "Anonymous User";
            const userAvatar = user?.profilePicture ?? "/user.svg";

            return (
              <div key={review._id} className="bg-white rounded-lg p-6">
                {/* User Info and Rating */}
                <div className="flex justify-between items-start mb-3">
                  {/* User Info */}
                  <div className="flex items-start gap-3">
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
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-4">
                  <p className="text-black text-base font-normal leading-relaxed font-plus-jakarta">
                    {review.comment}
                  </p>
                </div>

                <hr className="border-3 border-[#0000000D] my-5" />
              </div>
            );
          })}

        {/* No results message */}
        {!isLoading &&
          !isLoadingReviews &&
          (!filteredReviews || filteredReviews.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500 font-plus-jakarta">
                No reviews found. Be the first to review this course!
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default Reviews;
