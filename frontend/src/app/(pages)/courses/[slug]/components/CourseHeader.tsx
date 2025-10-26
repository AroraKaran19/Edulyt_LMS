"use client";
import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import { Course } from "@/types";
import { useMemo, useState } from "react";
import DiscountCountdown from "./DiscountCountdown";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { calculateDiscountTime, cn } from "@/lib/utils";
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
}: {
  course: Course;
  isEnrollmentModalOpen?: boolean;
  setIsEnrollmentModalOpen?: (open: boolean) => void;
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

  const formattedReviewsCount = useMemo(() => {
    const totalReviews = course?.analytics?.totalReviews;

    if (!totalReviews || totalReviews === 0) {
      return "0";
    }

    if (totalReviews >= 1000000) {
      return `${(totalReviews / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    } else if (totalReviews >= 1000) {
      return `${(totalReviews / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    } else {
      return totalReviews.toString();
    }
  }, [course?.analytics?.totalReviews]);

  const discountCountdown = useMemo(
    () => calculateDiscountTime(course),
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
              course.discount.endDate &&
              new Date(course.discount.endDate).getTime() > Date.now() && (
                <div className="course-discount flex flex-col gap-2">
                  <DiscountCountdown
                    discount={course.discount}
                    days={discountCountdown?.days || 0}
                    hours={discountCountdown?.hours || 0}
                    minutes={discountCountdown?.minutes || 0}
                    seconds={discountCountdown?.seconds || 0}
                    className={`${plusJakartaSans.className} text-sm md:text-base`}
                  />
                </div>
              )}
            {course?.isActive && (
              <div className="flex gap-5">
                <OrangeButton
                  className="font-bold text-sm md:text-base"
                  onClick={() => setIsEnrollmentModalOpen?.(true)}
                >
                  Enroll Now
                </OrangeButton>
                <WhiteButton
                  glow
                  className="font-bold lg:hidden text-sm md:text-base"
                  onClick={() => setIsEnquiryModalOpen(true)}
                >
                  Enquire
                </WhiteButton>
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
                {course?.analytics?.averageRating || 0}
              </span>
              <span className="text-sm md:text-base font-normal text-text-primary">
                (
                {(() => {
                  const totalReviews = course?.analytics?.totalReviews || 0;
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
