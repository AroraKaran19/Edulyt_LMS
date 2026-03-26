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
}: {
  course: Course;
  className?: string;
  style?: React.CSSProperties;
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
        "flex h-full w-full  flex-col overflow-hidden rounded-3xl border-2 bg-white border-[#F77124] shadow-[0_0_0_4px_rgba(247,113,36,0.24)] lg:flex-row",
        className
      )}
      style={style}
    >
      {/* Left: image + badges */}
      <div className="">
        <div className="relative h-44 w-full sm:h-44 sm:w-50 aspect-square p-2">
          <Image
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover rounded-xl"
            draggable={false}
            loading="lazy"
            width={1000}
            height={1000}
          />
          {hasDiscount && (
            <div className="absolute right-6 top-6 rounded-lg bg-[#f7af2a] px-2.5 py-1 text-xs font-bold text-white">
              {discountInfo.discountLabel}
            </div>
          )}
          {isBestSeller && (
            <div className="relative h-[30%] w-full bottom-12 left-0 right-0 rounded-b-xl p-2 bg-[#f7af2a]/30 bg-linear-to-r from-[#f7af2a]/80 to-transparent shadow-sm">
              <p className="text-sm font-black text-black">Best seller</p>
              <p className="text-[12px] font-semibold text-black">
                (enrolled by {formatEnrolled(enrollments)} students)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: title, rating, price, CTA */}
      <div className="flex flex-1  flex-col  justify-between gap-3 p-4 sm:p-5">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900 sm:text-lg">
          {course.title}
        </h3>

        {reviewCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
              <Star className="h-3.5 w-3.5 fill-white text-white" />
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">
              {reviewCount >= 1000
                ? `${(reviewCount / 1000).toFixed(0)}k Ratings`
                : `${reviewCount} ${reviewCount === 1 ? "Rating" : "Ratings"}`}
            </span>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-sm text-gray-400 line-through">
                  ₹{originalPrice}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  ₹{discountInfo.discountPrice}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ₹{originalPrice}
              </span>
            )}
          </div>
          <PrimaryButton size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (course.slug) router.push(`/courses/${course.slug}`);
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
