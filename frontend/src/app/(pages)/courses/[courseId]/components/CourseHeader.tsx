"use client";
import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import { Course } from "@/types";
import React, { useMemo, useState } from "react";
import DiscountCountdown from "../../components/DiscountCountdown";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Star } from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import EnquiryFormModal from "./EnquiryFormModal";
import EnrollmentModal from "./EnrollmentModal";
import { FullScreenLoader } from "@/components/ui/Loader";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { calculateDiscountTime } from "@/app/admin/courses/reducers/course/utils/calculateDiscountTime";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const CourseHeader = ({
  course,
  onLoadingChange,
  isEnrollmentModalOpen,
  setIsEnrollmentModalOpen,
}: {
  course: Course;
  onLoadingChange?: (loading: boolean) => void;
  isEnrollmentModalOpen?: boolean;
  setIsEnrollmentModalOpen?: (open: boolean) => void;
}) => {
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [localIsEnrollmentModalOpen, setLocalIsEnrollmentModalOpen] =
    useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Use external state if provided, otherwise use local state
  const enrollmentModalOpen =
    isEnrollmentModalOpen ?? localIsEnrollmentModalOpen;
  const setEnrollmentModalOpen =
    setIsEnrollmentModalOpen ?? setLocalIsEnrollmentModalOpen;
  const { data: session } = useSession();
  const router = useRouter();

  // Remove window event listener - now using props

  const formattedReviewsCount =
    course?.analytics?.totalReviews && course?.analytics?.totalReviews >= 1000000
      ? `${(course?.analytics?.totalReviews / 1000000).toFixed(1).replace(/\.0$/, "")}M`
      : course?.analytics?.totalReviews && course?.analytics?.totalReviews >= 1000
      ? `${(course?.analytics?.totalReviews / 1000).toFixed(1).replace(/\.0$/, "")}K`
      : course?.analytics?.totalReviews?.toString();

  const discountCountdown = useMemo(
    () => calculateDiscountTime(course),
    [course]
  );

  const handlePlanSelect = async (
    planType: "elite" | "essential"
  ): Promise<void> => {
    try {
      setIsPaymentLoading(true);
      onLoadingChange?.(true);

      const generateOrder = await axios.post(`/api/payment/new`, {
        courseId: course._id,
        planType: planType,
        userId: session?.user?.id,
      });
      if (!generateOrder.data.success) {
        console.error(generateOrder.data.message);
        // Handle specific error cases
        if (generateOrder.data.message?.includes("already enrolled")) {
          toast.error("You are already enrolled in this course!");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      }

      if (generateOrder.data.redirectUrl) {
        router.push(generateOrder.data.redirectUrl);
      }
    } catch (error: any) {
      console.error(error);
      // Handle axios error responses
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (
          errorMessage.includes("already enrolled") ||
          errorMessage.includes("already exists") ||
          errorMessage.includes("User already enrolled")
        ) {
          toast.error("You are already enrolled in this course!");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsPaymentLoading(false);
      onLoadingChange?.(false);
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
              <p
                className={cn(
                  "text-[16px] font-normal text-center md:text-left",
                  plusJakartaSans.className
                )}
              >
                {course?.description}
              </p>
            </div>
          </div>
          <div className="course-details-content-right w-full lg:w-2/5 flex flex-col gap-4 mt-3 lg:mt-0 items-center lg:items-end justify-center">
            {course?.discount &&
              course.discount.isActive &&
              course.discount.value > 0 &&
              new Date(course.discount.endDate || "").getTime() >
                Date.now() && (
                <div className="course-discount flex flex-col gap-2">
                  <DiscountCountdown
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
                {course?.analytics?.totalReviews && course?.analytics?.totalReviews > 100
                  ? `(more than ${formattedReviewsCount} reviews)`
                  : formattedReviewsCount === "1"
                  ? `${formattedReviewsCount} review`
                  : `${formattedReviewsCount} reviews`}
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

      {/* Payment Loading Overlay */}
      {isPaymentLoading && (
        <FullScreenLoader
          text="Generating payment link..."
          variant="spinner"
          size="lg"
        />
      )}
    </>
  );
};

export default CourseHeader;
