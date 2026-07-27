"use client";
import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import { Course } from "@/types";
import { useMemo, useState } from "react";
import DiscountCountdown from "./DiscountCountdown";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { calculateDiscountTime, cn } from "@/lib/utils";
import {
  formatReviewCount,
  getCourseDisplayRating,
} from "@/lib/utils/courseRating";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Star } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import EnquiryFormModal from "./EnquiryFormModal";
import EnrollmentModal from "./EnrollmentModal";
import { useRouter } from "next/navigation";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const CourseHeader = ({
  course,
  isEnrollmentModalOpen,
  setIsEnrollmentModalOpen,
  isEnrolled = false,
  isCheckingEnrollment = false,
}: {
  course: Course;
  isEnrollmentModalOpen?: boolean;
  setIsEnrollmentModalOpen?: (open: boolean) => void;
  isEnrolled?: boolean;
  isCheckingEnrollment?: boolean;
}) => {
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [localIsEnrollmentModalOpen, setLocalIsEnrollmentModalOpen] =
    useState(false);

  // Use external state if provided, otherwise use local state
  const enrollmentModalOpen =
    isEnrollmentModalOpen ?? localIsEnrollmentModalOpen;
  const setEnrollmentModalOpen =
    setIsEnrollmentModalOpen ?? setLocalIsEnrollmentModalOpen;
  const router = useRouter();

  const { displayRating, displayReviewCount } = useMemo(() => {
    const { rating, reviewCount } = getCourseDisplayRating(course);
    return { displayRating: rating, displayReviewCount: reviewCount };
  }, [
    course?.analytics?.averageRating,
    course?.analytics?.totalReviews,
    course?.staticRating,
    course?.staticReviewCount,
  ]);

  const formattedReviewsCount = useMemo(
    () => formatReviewCount(displayReviewCount),
    [displayReviewCount]
  );

  const discountCountdown = useMemo(
    () => {
      const result = calculateDiscountTime(course);
      return result;
    },
    [course]
  );

  const handlePlanSelect = async (
    planType: "elite" | "essential"
  ): Promise<void> => {
    try {
      router.push(`/cart?course=${course.slug}&planType=${planType}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnrollmentModalOpen?.(false);
    }
  };

  return (
    <>
      <div className="course-header-content w-full my-6 flex flex-col gap-6">
        <div className="course-details w-full flex flex-col lg:flex-row">
          <div className="course-details-content-left w-full lg:w-3/5">
            {course?.isFeatured && (
              <BestsellerBadge
                enrollStudents={course.analytics?.totalEnrollments || 0}
                className="flex-row justify-center items-center md:justify-start"
                text1ClassName="text-sm"
                text2ClassName="text-sm"
              />
            )}
            <div className="course-info flex flex-col gap-2 font-coolvetica text-text-primary mt-5">
              <h1
                className={cn(
                  "font-bold text-balance",
                  "text-2xl md:text-3xl text-center md:text-left"
                )}
              >
                {course?.title}
              </h1>
              <div
                className={cn(
                  "text-[16px] font-normal text-center md:text-left prose prose-sm max-w-none",
                  plusJakartaSans.className
                )}
                dangerouslySetInnerHTML={{ __html: course?.description || "" }}
              />
            </div>
          </div>
          <div className="course-details-content-right w-full lg:w-2/5 flex flex-col gap-4 mt-3 lg:mt-0 items-center lg:items-end justify-center">
            {course?.discount &&
              course.discount.isActive &&
              course.discount.value > 0 &&
              course.discount.startTime &&
              course.discount.endTime &&
              discountCountdown !== null && (
                <div className="course-discount flex flex-col gap-2">
                  <DiscountCountdown
                    discount={course.discount}
                    days={discountCountdown.days}
                    hours={discountCountdown.hours}
                    minutes={discountCountdown.minutes}
                    seconds={discountCountdown.seconds}
                    className={`${plusJakartaSans.className} text-sm md:text-base`}
                  />
                </div>
              )}
            {course?.isActive && (
              <div className="flex flex-col items-center lg:items-end gap-2">
                <div className="flex gap-5">
                  {isCheckingEnrollment ? (
                    <OrangeButton
                      className="font-bold text-sm md:text-base opacity-50 cursor-not-allowed"
                      disabled
                    >
                      Checking...
                    </OrangeButton>
                  ) : !isEnrolled ? (
                    <OrangeButton
                      className="font-bold text-sm md:text-base"
                      onClick={() => setIsEnrollmentModalOpen?.(true)}
                    >
                      Enroll Now
                    </OrangeButton>
                  ) : (
                    <OrangeButton
                      className="font-bold text-sm md:text-base"
                      onClick={() =>
                        router.push(`/programs/${course.slug}/watch`)
                      }
                    >
                      Continue Learning
                    </OrangeButton>
                  )}
                  <WhiteButton
                    glow
                    className="font-bold lg:hidden text-sm md:text-base"
                    onClick={() => setIsEnquiryModalOpen(true)}
                  >
                    Enquire
                  </WhiteButton>
                </div>

                {!isEnrolled &&
                  course.seatsLeft != null &&
                  course.seatsLeft > 0 && (
                    // The count is the message: a stamped numeral, no motion.
                    // Scarcity is carried by weight (solid fill at 3 or fewer),
                    // so this stays quieter than the Enroll button beside it.
                    <p
                      className={cn(
                        "seats-left flex items-center gap-2 select-none",
                        plusJakartaSans.className
                      )}
                    >
                      <span
                        className={cn(
                          "grid place-items-center size-8 rounded-xl border font-coolvetica text-lg leading-none tabular-nums",
                          course.seatsLeft <= 3
                            ? "bg-primary border-primary text-white"
                            : "bg-[#FFF6EC] border-[#F7AD24]/50 text-primary"
                        )}
                      >
                        {course.seatsLeft}
                      </span>
                      <span className="text-sm text-text-primary/70">
                        {course.seatsLeft === 1 ? "seat" : "seats"} left
                      </span>
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
        <hr className="w-full border-t-3 border-gray-200" />
        <div className="course-information w-full flex flex-row flex-wrap sm:flex-nowrap justify-center lg:justify-start gap-4 md:gap-20">
          <div className="rating-container w-max flex flex-col items-center md:items-start">
            <p className="text-base font-normal text-text-primary">Rating</p>
            <div className="course-rating w-full flex flex-wrap gap-1 md:gap-2 items-center justify-center md:justify-start">
              <Star
                className="size-4 md:size-5 text-[#F7AD24]"
                fill="#F7AD24"
              />
              <span className="text-base md:text-2xl font-normal text-text-primary font-coolvetica tracking-wide">
                {displayRating}
              </span>
              <span className="text-sm md:text-base font-normal text-text-primary">
                (
                {(() => {
                  const totalReviews = displayReviewCount;
                  if (totalReviews > 100) {
                    return `more than ${formattedReviewsCount} reviews`;
                  } else if (totalReviews === 1) {
                    return `${formattedReviewsCount} review`;
                  } else {
                    return `${formattedReviewsCount} reviews`;
                  }
                })()}
                )
              </span>
            </div>
          </div>
          <div className="course-proficency w-max flex flex-col items-center md:items-start">
            <p className="text-sm md:text-base font-normal text-text-primary">
              Proficency
            </p>
            <p className="text-base md:text-2xl font-normal text-text-primary font-coolvetica tracking-wide">
              {course?.skillLevel}
            </p>
          </div>
          <div className="course-total-time w-max flex flex-col items-center md:items-start">
            <p className="text-sm md:text-base font-normal text-text-primary">
              Course Duration
            </p>
            <p className="text-base md:text-2xl font-normal text-text-primary font-coolvetica tracking-wide">
              {course.duration}
            </p>
          </div>
        </div>
      </div>

      {/* Enquiry Form Modal for mobile */}
      <EnquiryFormModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        courseTitle={course?.title}
      />

      {/* Enrollment Modal */}
      <EnrollmentModal
        isOpen={enrollmentModalOpen}
        onClose={() => setEnrollmentModalOpen?.(false)}
        course={course}
        onPlanSelect={handlePlanSelect}
      />
    </>
  );
};

export default CourseHeader;
