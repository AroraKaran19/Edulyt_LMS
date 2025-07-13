import { Star } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Course } from "@/types";

const RatingContainer = ({
  ratings,
  className,
  courseId,
}: {
  ratings: Course["featuredReviews"];
  className?: string;
  courseId: string;
}) => {
  const router = useRouter();
  const rating =
    ratings?.reduce((acc, review) => acc + review.rating, 0) /
    ratings?.length || 0;
  const ratingCount = ratings?.length;

  return (
    <div
      className={cn(
        "rating flex gap-1 items-center select-none text-sm",
        className
      )}
    >
      <span className="font-bold text-[#F7AD24] flex gap-2 flex-wrap items-center">
        <span
          className="whitespace-nowrap underline cursor-pointer flex gap-2 items-center"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/courses/${courseId}#ratings`);
          }}
        >
          <Star className="w-4 h-4 text-[#F7AD24]" fill="#F7AD24" />
          {rating} Rating
        </span>
        <span className="font-normal text-gray-500 break-all">
          {ratingCount > 100 ? (
            `(more than ${ratingCount} reviews)`
          ) : (
            ratingCount === 1 ? (
              `(${ratingCount} review)`
            ) : (
              `(${ratingCount} reviews)`
            )
          )}
        </span>
      </span>
    </div>
  );
};

export default RatingContainer;
