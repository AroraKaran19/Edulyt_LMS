"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { calculateDiscountDisplay } from "@/lib/utils/discount";
import { Course } from "@/types";
import { PrimaryButton } from "@/app/components/ui/PrimaryButton";

import Image from "next/image";

function formatEnrolled(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

const NewCourseCard = ({
  course,
  className,
  style,
  enrollHref,
}: {
  course: Course;
  className?: string;
  style?: React.CSSProperties;
  /** When set, Enroll navigates here instead of `/courses/[slug]`. */
  enrollHref?: string;
}) => {
  const router = useRouter();

  const originalPrice =
    course.plans?.essential?.price || course.plans?.elite?.price || 0;
  const selectedPlan = course.plans?.essential ? "essential" : "elite";
  const planDiscount = course.plans?.[selectedPlan]?.discount;
  const discountInfo = calculateDiscountDisplay(
    originalPrice,
    planDiscount,
    course.discount
  );
  const hasDiscount = !!discountInfo.discountLabel;

  const rating = course.analytics?.averageRating ?? 0;
  const reviewCount = course.analytics?.totalReviews ?? 0;
  const enrollments = course.analytics?.totalEnrollments ?? 0;
  const isBestSeller = !!course?.isFeatured;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-row overflow-hidden rounded-3xl border-2 bg-white border-[#F77124] shadow-[0_0_0_4px_rgba(247,113,36,0.24)]",
        className
      )}
      style={style}
    >
      {/* Left: image + badges */}
      <div className="shrink-0">
        <div className="relative h-28 w-28 sm:h-44 sm:w-50 p-2">
          <Image
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover rounded-xl"
            draggable={false}
            loading="lazy"
            width={400}
            height={400}
          />
          {hasDiscount && (
            <div className="absolute right-3 top-3 sm:right-6 sm:top-6 rounded-lg bg-[#f7af2a] px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-white">
              {discountInfo.discountLabel}
            </div>
          )}
        </div>
      </div>

      {/* Right: title, rating, price, CTA */}
      <div className="flex flex-1 flex-col justify-between gap-1 sm:gap-3 p-3 sm:p-5">
        <h3 className="line-clamp-1 sm:line-clamp-2 text-sm font-bold leading-snug text-gray-900 sm:text-lg">
          {course.title}
        </h3>

        {(rating > 0 || reviewCount > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {rating > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
                <Star className="h-3.5 w-3.5 fill-white text-white" />
                {rating.toFixed(1)} Rating
              </span>
            )}
            {reviewCount > 0 && (
              <span className="text-xs text-gray-500">
                {reviewCount >= 1000
                  ? `${(reviewCount / 1000).toFixed(0)}k Ratings`
                : `${reviewCount} ${reviewCount === 1 ? "Rating" : "Ratings"}`}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-1 sm:gap-2">
            {hasDiscount ? (
              <>
                <span className="text-[10px] sm:text-sm text-gray-400 line-through">
                  ₹{originalPrice}
                </span>
                <span className="text-sm sm:text-lg font-bold text-gray-900">
                  ₹{discountInfo.discountPrice}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-lg font-bold text-gray-900">
                ₹{originalPrice}
              </span>
            )}
          </div>
          <PrimaryButton className="px-3 sm:px-6 h-8 sm:h-10 text-[10px] sm:text-sm rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              if (enrollHref) router.push(enrollHref);
              else if (course.slug) router.push(`/courses/${course.slug}`);
            }}
          >
            Enroll Now
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default NewCourseCard;
