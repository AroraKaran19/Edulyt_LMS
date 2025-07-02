import { Star } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const RatingContainer = ({
  rating,
  totalRating,
  className,
  courseId,
}: {
  rating: number;
  totalRating: number;
  className?: string;
  courseId: string;
}) => {
  const router = useRouter();

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
          onClick={() => router.push(`/courses/${courseId}/#ratings`)}
        >
          <Star className="w-4 h-4 text-[#F7AD24]" fill="#F7AD24" />
          {rating} Rating
        </span>
        <span className="font-normal text-gray-500">
          (more than {totalRating} reviews)
        </span>
      </span>
    </div>
  );
};

export default RatingContainer;
