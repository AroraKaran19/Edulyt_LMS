import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import DiscountBadge from "@/components/ui/course/DiscountBadge";
import InstructorCard from "@/components/ui/course/InstructorCard";
import RatingContainer from "@/components/ui/course/RatingContainer";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";
import {
  calculateDiscountDisplay,
  calculateInternshipDiscountDisplay,
} from "@/lib/utils/discount";
import { Instructor, Discount } from "@/types";
import type { Internship, InternshipPublicListing } from "@/types/internship";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import Image from "next/image";

const InternshipCard = ({
  internship,
  ...props
}: { internship: Internship | InternshipPublicListing } & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const router = useRouter();

  const legacyRoot = internship as InternshipPublicListing & {
    plan?: { price?: number; discount?: Discount } | null;
  };

  const batchPrices = (internship.batches ?? [])
    .filter((b) => b.isActive !== false)
    .map((b) => b.plan?.price ?? 0)
    .filter((p) => p > 0);

  const hasBatchPricing = batchPrices.length > 0;

  const originalPrice = hasBatchPricing
    ? Math.min(...batchPrices)
    : legacyRoot.plan?.price ?? 0;

  const discountInfo = hasBatchPricing
    ? calculateInternshipDiscountDisplay(
        originalPrice,
        internship.discount ?? undefined,
      )
    : calculateDiscountDisplay(
        originalPrice,
        legacyRoot.plan?.discount,
        internship.discount ?? undefined,
      );

  const hasAnyDiscount = !!discountInfo.discountLabel;

  const showFeaturedBadge = Boolean(
    (internship as Internship & { featured?: boolean }).featured,
  );

  return (
    <div
      className={cn(
        "internship-card w-full h-full bg-white rounded-2xl p-3 flex flex-col border-2 border-[rgb(233,117,0)] shadow-[0_0_2px_4px_rgba(233,117,0,0.3)] gap-4 cursor-default",
        "md:flex-row md:items-stretch",
        props.className
      )}
      style={props.style}
    >
      <div className="internship-image w-full md:w-2/5 rounded-2xl overflow-hidden relative shrink-0">
        <Image
          src={internship.thumbnail || "/InternshipCardDemo.jpg"}
          alt={internship.title}
          width={500}
          height={500}
          className="rounded-2xl w-full h-full object-fill max-h-[150px] md:max-h-[457px] opacity-90"
          draggable={false}
          loading="eager"
          unoptimized
          priority
        />
        {hasAnyDiscount && (
          <DiscountBadge
            label={discountInfo.discountLabel}
            className="absolute top-2 right-2"
          />
        )}
      </div>
      <div className="internship-content w-full md:w-3/5 flex flex-col justify-between flex-1">
        {showFeaturedBadge ? (
          <BestsellerBadge
            enrollStudents={internship?.analytics?.totalEnrollments || 0}
          />
        ) : (
          <div className="w-full h-4" />
        )}
        <p className="text-2xl font-bold mt-2 font-coolvetica select-none text-balance wrap-break-words line-clamp-2">
          {internship.title}
        </p>
        <RatingContainer
          reviewCount={internship?.analytics?.totalReviews || 0}
          totalRating={internship.analytics?.totalRatings || 0}
          className="mt-2 text-xs"
          internshipSlug={internship.slug}
        />
        <div className="instructors mt-2 flex gap-2 select-none mb-2 flex-col sm:flex-row items-start sm:items-center">
          {internship.mentors?.map((instructor, index) => {
            if (index < 2) {
              return (
                <InstructorCard
                  key={index}
                  instructor={instructor as Instructor}
                />
              );
            }
          })}
          {(internship.mentors?.length ?? 0) > 2 && (
            <div className="instructor-count flex gap-0.25 items-center bg-[#EEEEEE] rounded-full p-1">
              <Plus className="w-3 h-3 text-text-primary" fill="#2B1508" />
              <p className="text-xs font-bold text-text-primary">
                {(internship.mentors?.length ?? 0) - 2}
              </p>
            </div>
          )}
        </div>
        <div className="mt-auto flex flex-col sm:flex-row gap-2 sm:items-center select-none">
          <div className="pricing flex flex-row lg:flex-col xl:flex-row gap-2 sm:items-center flex-wrap">
            {hasAnyDiscount ? (
              <>
                <span className="text-xl font-bold text-black">
                  ₹{discountInfo.discountPrice}
                </span>
                <p className="text-sm font-normal text-black line-through opacity-50">
                  ₹{originalPrice}
                </p>
              </>
            ) : (
              <span className="text-xl font-bold text-black">
                ₹{originalPrice}
              </span>
            )}
            <p className="text-sm font-normal text-black">onwards/-</p>
          </div>
          <OrangeButton
            className="mt-auto sm:mt-0 sm:ml-auto font-bold text-sm px-8 py-4"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/internships/${internship.slug}`);
            }}
          >
            View Details
          </OrangeButton>
        </div>
      </div>
    </div>
  );
};

export default InternshipCard;