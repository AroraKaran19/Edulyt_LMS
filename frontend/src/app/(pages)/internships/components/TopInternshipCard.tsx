import React from "react";
import { Instructor, Discount } from "@/types";
import type { InternshipPublicListing } from "@/types/internship";
import { cn } from "@/lib/utils";
import {
  calculateDiscountDisplay,
  calculateInternshipDiscountDisplay,
} from "@/lib/utils/discount";
import { Plus } from "lucide-react";
import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
// import RatingContainer from "@/components/ui/course/RatingContainer";
import DiscountBadge from "@/components/ui/course/DiscountBadge";
import InstructorCard from "@/components/ui/course/InstructorCard";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import InternshipBatchCountContainer from "@/components/ui/course/InternshipBatchCountContainer";
import { useRouter } from "next/navigation";
import { getUpcomingBatchStartDate } from "@/lib/utils/internshipCohortDate";

const TopInternshipCard = ({
  internship,
  ...props
}: { internship: InternshipPublicListing } & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const router = useRouter();

  /** Pre–batch-schema docs may still expose root `plan`. */
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
    : (legacyRoot.plan?.price ?? 0);

  /**
   * With batch pricing: “from” price is the lowest batch plan; only the internship-wide
   * time-window discount applies. Legacy root-only docs still use internship-style
   * plan discount + document discount stacking.
   */
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

  return (
    <div
      className={cn(
        "top-internship-card select-none w-full bg-white rounded-2xl shadow-[0_0_2px_5px_rgba(247,113,36,0.3)] p-3 cursor-default flex flex-col",
        props.className,
      )}
    >
      <div className="internship-card-image rounded-2xl h-1/2 w-full relative">
        <img
          src={internship.thumbnail || "/CourseCardDemo.jpg"}
          alt={internship.title}
          className="rounded-2xl max-h-[200px] select-none w-full h-full object-fill"
          draggable={false}
          loading="lazy"
        />
        {hasAnyDiscount && (
          <DiscountBadge
            label={discountInfo.discountLabel}
            className="absolute top-2 right-2"
          />
        )}
      </div>
      <BestsellerBadge
        enrollStudents={internship.analytics?.totalEnrollments || 0}
        className="mt-3"
      />
      <p
        className={cn(
          "text-2xl font-bold mt-2 font-coolvetica select-none text-balance",
        )}
      >
        {internship.title}
      </p>
      {/* <RatingContainer
        reviewCount={internship.analytics?.totalReviews || 0}
        totalRating={internship.analytics?.totalRatings || 0}
        className="mt-2"
        internshipSlug={internship.slug}
      /> */}
      <InternshipBatchCountContainer
        batches={internship.batches ?? []}
        className="mt-2"
      />

      <div
        className={cn("instructors mt-2 flex gap-2 items-center select-none")}
      >
        {internship.mentors &&
          (internship.mentors as Instructor[]).map(
            (instructor, index: number) => {
              if (index < 2) {
                return <InstructorCard key={index} instructor={instructor} />;
              }
            },
          )}
        {internship.mentors && internship.mentors.length > 2 && (
          <div className="instructor flex items-center bg-[#EEEEEE] rounded-full p-1">
            <Plus className="w-3 h-3 text-text-primary" fill="#2B1508" />
            <p className="text-xs font-bold text-text-primary">
              {internship.mentors.length - 2}
            </p>
          </div>
        )}
      </div>
      <div className="price mt-auto flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-2 select-none">
        <div className="min-w-0 flex-1 basis-[40%] pr-2 sm:basis-auto">
          {batchStartLabel && batchStartDateTimeIso ? (
            <p className="truncate text-[13px] leading-snug text-text-secondary sm:text-sm">
              <span className="font-medium text-text-secondary">Upcoming cohort</span>
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
          className="ml-auto shrink-0 font-bold text-sm px-6 py-3.5 sm:px-8 sm:py-4 sm:min-w-[136px]"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/internships/${internship.slug}`);
          }}
        >
          View Details
        </OrangeButton>
      </div>
    </div>
  );
};

export default TopInternshipCard;
