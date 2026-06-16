"use client";
import React, { useMemo } from "react";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Course } from "@/types";
import { Crown } from "lucide-react";
import PlanCard from "./PlanCard";
import DiscountCountdown from "./DiscountCountdown";
import { Plus_Jakarta_Sans } from "next/font/google";
import { calculateDiscountTime } from "@/lib/utils";
import { calculateDiscountDisplay } from "@/lib/utils/discount";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onPlanSelect: (planType: "elite" | "essential") => void;
}

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  course,
  onPlanSelect,
}) => {
  const plans: {
    type: "essential" | "elite";
    icon: React.ReactNode;
    name: string;
    theme: string;
    price: number;
    features: { provided: boolean; title: string; showHover?: string }[];
    discountType?: string;
    discountValue?: number;
    discountLabel?: string;
    discountPrice?: number;
    isPopular?: boolean;
  }[] = [];

  // Only add Essential plan if it exists
  if (course.plans?.essential) {
    const essentialPrice = course.plans.essential.price || 0;
    const combinedDiscount = calculateDiscountDisplay(
      essentialPrice,
      course.plans.essential.discount,
      course.discount
    );

    plans.push({
      type: "essential",
      icon: <Crown className="size-5" />,
      name: course.plans.essential.title,
      theme: "bg-[#F68A5C]",
      price: essentialPrice,
      features: course.plans.essential.features || [],
      discountType: combinedDiscount.discountType,
      discountValue: combinedDiscount.discountValue,
      discountLabel: combinedDiscount.discountLabel,
      discountPrice: combinedDiscount.discountPrice,
      isPopular: course.plans.essential.isPopular,
    });
  }

  // Only add Elite plan if it exists
  if (course.plans?.elite) {
    const elitePrice = course.plans.elite.price || 0;
    const combinedDiscount = calculateDiscountDisplay(
      elitePrice,
      course.plans.elite.discount,
      course.discount
    );

    plans.push({
      type: "elite",
      icon: <Crown className="size-5" />,
      name: course.plans.elite.title,
      theme: "bg-[#8B5CF6]",
      price: elitePrice,
      features: course.plans.elite.features || [],
      discountType: combinedDiscount.discountType,
      discountValue: combinedDiscount.discountValue,
      discountLabel: combinedDiscount.discountLabel,
      discountPrice: combinedDiscount.discountPrice,
      isPopular: course.plans.elite.isPopular,
    });
  }

  const discountCountdown = useMemo(
    () => calculateDiscountTime(course),
    [course]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Plan"
      className="max-w-6xl"
    >
      <div className="space-y-6">
        {/* Course Info */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {course.title}
          </h3>
          <p className="text-sm text-gray-600">
            Select the plan that best fits your learning goals
          </p>
          {/* Discount Countdown */}
          {course?.discount &&
            course.discount.isActive &&
            course.discount.value > 0 &&
            course.discount.startTime &&
            course.discount.endTime &&
            discountCountdown && (
              <div className="w-full flex justify-center mt-2">
                <DiscountCountdown
                  discount={course.discount}
                  days={discountCountdown.days || 0}
                  hours={discountCountdown.hours || 0}
                  minutes={discountCountdown.minutes || 0}
                  seconds={discountCountdown.seconds || 0}
                  className={`${plusJakartaSans.className} text-sm md:text-base`}
                  discountClassname="justify-center!"
                />
              </div>
            )}
        </div>

        {/* Plans Grid */}
        <div className="w-full flex flex-col md:flex-row justify-between items-stretch gap-5">
          {plans.map((plan, index) => (
            <PlanCard
              key={index}
              plan={plan}
              totalPlans={plans.length}
              className="shadow-[0_0_5px_1px_rgba(0,0,0,0.2)]"
              onClick={() => onPlanSelect(plan.type)}
            />
          ))}
        </div>

        {/* Close Button */}
        <div className="flex justify-center">
          <WhiteButton onClick={onClose} className="px-8">
            Cancel
          </WhiteButton>
        </div>
      </div>
    </Modal>
  );
};

export default EnrollmentModal;
