import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import DiscountBadge from "@/components/ui/course/DiscountBadge";
import InstructorCard from "@/components/ui/course/InstructorCard";
// import RatingContainer from "@/components/ui/course/RatingContainer";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import InternshipBatchCountContainer from "@/components/ui/course/InternshipBatchCountContainer";
import { cn } from "@/lib/utils";
import { getUpcomingBatchStartDate } from "@/lib/utils/internshipCohortDate";
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

  const nextBatchStart = getUpcomingBatchStartDate(internship.batches ?? []);
  const batchStartLabel = nextBatchStart
    ? nextBatchStart.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : null;
  const batchStartDateTimeIso = nextBatchStart
    ? nextBatchStart.toISOString().split("T")[0]
    : undefined;

  const showFeaturedBadge = Boolean(
    (internship as Internship & { featured?: boolean }).featured,
  );

  // Inactive internship: still browsable, but no longer taking registrations.
  const enrollmentsClosed = internship.isActive === false;

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
          className={cn(
            "rounded-2xl w-full h-full object-fill max-h-[150px] md:max-h-[457px] opacity-90",
            enrollmentsClosed && "grayscale",
          )}
          draggable={false}
          loading="eager"
          unoptimized
          priority
        />
        {enrollmentsClosed && (
          <span className="absolute top-2 left-2 rounded-full bg-stone-900/85 px-3 py-1 text-xs font-bold text-white">
            Enrollments Closed
          </span>
        )}
        {hasAnyDiscount && !enrollmentsClosed && (
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
        {!enrollmentsClosed && (
          <InternshipBatchCountContainer
            batches={internship.batches ?? []}
            className="mt-2"
          />
        )}
        {/* <RatingContainer
          reviewCount={internship?.analytics?.totalReviews || 0}
          totalRating={internship.analytics?.totalRatings || 0}
          className="mt-2 text-xs"
          internshipSlug={internship.slug}
        /> */}
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
        <div className="price mt-auto flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 select-none pt-1">
          <div className="min-w-0 flex-1 basis-[40%] pr-2 sm:basis-auto">
            {/* Closed programs never show cohort dates. */}
            {enrollmentsClosed ? (
              <p className="truncate text-[13px] leading-snug font-bold text-stone-600 sm:text-sm">
                Enrollments are closed!
              </p>
            ) : batchStartLabel && batchStartDateTimeIso ? (
              <p className="truncate text-[13px] leading-snug text-text-secondary sm:text-sm">
                <span className="font-medium text-text-secondary">
                  Upcoming cohort
                </span>
                <span className="mx-1 text-text-secondary/60" aria-hidden>
                  ·
                </span>
                <time
                  dateTime={batchStartDateTimeIso}
                  className="font-bold tabular-nums text-primary"
                >
                  {batchStartLabel}
                </time>
              </p>
            ) : (
              <p className="truncate text-[13px] leading-snug text-text-secondary sm:text-sm">
                Cohort dates on details page
              </p>
            )}
          </div>
          <OrangeButton
            className="ml-auto shrink-0 font-bold text-sm px-6 py-3.5 sm:mt-0 sm:px-8 sm:py-4 sm:min-w-[136px]"
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