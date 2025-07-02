import { Star } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

const RatingContainer = ({
  rating,
  totalRating,
  className,
}: {
  rating: number;
  totalRating: number;
  className?: string;
}) => {
  return (
    <div className={cn("rating flex gap-2 items-center select-none text-sm", className)}>
      <Star className="w-4 h-4 text-[#F7AD24]" fill="#F7AD24" />
      <span className="font-bold text-[#F7AD24]">{rating} Rating</span>
      <span className="font-normal text-gray-500">
        (more than {totalRating} reviews)
      </span>
    </div>
  );
};

export default RatingContainer;
