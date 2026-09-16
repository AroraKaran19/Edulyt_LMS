import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatReviewCount } from "@/lib/utils/courseRating";
import { useRouter } from "next/navigation";

const RatingContainer = ({
  reviewCount,
  totalRating,
  className,
  courseSlug,
  reviewCountText,
}: {
  reviewCount: number;
  totalRating: number;
  className?: string;
  /** When set, links to `/programs/{slug}#ratings` */
  courseSlug?: string;
  reviewCountText?: string;
}) => {
  const router = useRouter();

  const ratingsHref =
    courseSlug != null && courseSlug !== "" ? `/programs/${courseSlug}#ratings` : null;

  const handleRatingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ratingsHref) router.push(ratingsHref);
  };

  return (
    <div
      className={cn(
        "rating flex gap-1 items-center select-none text-sm",
        className
      )}
    >
      <span className="font-bold text-[#F7AD24] flex gap-2 flex-wrap items-center">
        <span
          className={cn(
            "whitespace-nowrap flex gap-2 items-center",
            ratingsHref && "underline cursor-pointer"
          )}
          onClick={ratingsHref ? handleRatingClick : undefined}
          role={ratingsHref ? "link" : undefined}
        >
          <Star className="w-4 h-4 text-[#F7AD24]" fill="#F7AD24" />
          {totalRating} Rating
        </span>
        <span
          className={cn("font-normal text-gray-500 break-all", reviewCountText)}
        >
          {reviewCount > 100
            ? `(${formatReviewCount(reviewCount)}+ reviews)`
            : reviewCount === 1
              ? `(${reviewCount} review)`
              : `(${reviewCount} reviews)`}
        </span>
      </span>
    </div>
  );
};

export default RatingContainer;
