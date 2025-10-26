import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
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
  courseSlug: string;
  reviewCountText?: string;
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
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/courses/${courseSlug}#ratings`);
          }}
        >
          <Star className="w-4 h-4 text-[#F7AD24]" fill="#F7AD24" />
          {totalRating} Rating
        </span>
        <span
          className={cn("font-normal text-gray-500 break-all", reviewCountText)}
        >
          {reviewCount > 100
            ? `(more than ${reviewCount} reviews)`
            : reviewCount === 1
            ? `(${reviewCount} review)`
            : `(${reviewCount} reviews)`}
        </span>
      </span>
    </div>
  );
};

export default RatingContainer;
