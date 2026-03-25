"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Course as InternshipListingItem } from "@/constants/internshipData";
import Image from "next/image";

function formatEnrolled(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

const InternshipCard = ({
  internship,
  className,
  style,
}: {
  internship: InternshipListingItem;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const router = useRouter();
  const hasDiscount = internship.discount > 0;
  const discountLabel = hasDiscount ? `${internship.discount}% off` : "";

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-2xl flex-wrap border-2 bg-white border-[#F77124] shadow-[0_0_0_4px_rgba(247,113,36,0.24)] lg:flex-row",
        className
      )}
      style={style}
    >
      {/* Left: image + badges */}
      <div>
        <div className="relative h-44 w-full lg:h-full xl:w-52 aspect-square p-4">
          <Image
            // src={internship.thumbnail}
            src={'/CourseCardDemo.jpg'}
            alt={internship.title}
            className="h-full w-full object-cover rounded-xl"
            draggable={false}
            loading="lazy"
            width={1000}
            height={1000}
          />
          {hasDiscount && (
            <div className="absolute right-6 top-6 rounded-lg bg-[#f7af2a] px-2.5 py-1 text-xs font-bold text-white">
              {discountLabel}
            </div>
          )}
          {internship.isBestSeller && (
            <div className="absolute h-[30%] m-4 bottom-0 left-0 right-0 rounded-b-xl p-2 bg-[#f7af2a]/30 bg-gradient-to-r from-[#f7af2a]/80 to-transparent shadow-sm">
              <p className="text-sm font-black text-black">Best seller</p>
              <p className="text-[12px] font-semibold text-black">
                (enrolled by {formatEnrolled(internship.enrolledStudents)}{" "}
                students)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: title, rating, price, CTA */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900 sm:text-lg">
          {internship.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
            <Star className="h-3.5 w-3.5 fill-white text-white" />
            {internship.rating > 0 ? internship.rating.toFixed(1) : "—"} Rating
          </span>
          <span className="text-xs text-gray-500">
            {internship.reviewCount >= 1000
              ? `${(internship.reviewCount / 1000).toFixed(0)}k Ratings`
              : `${internship.reviewCount} Ratings`}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-sm text-gray-400 line-through">
                  ₹{internship.originalPrice}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  ₹{internship.currentPrice}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ₹{internship.originalPrice}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push("/internships")}
            className="shrink-0 rounded-2xl bg-[#F77124] px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_0_2px_rgba(247,113,36,0.4)] transition hover:opacity-95"
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InternshipCard;
