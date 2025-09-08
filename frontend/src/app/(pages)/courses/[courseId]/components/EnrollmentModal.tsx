"use client";
import React from "react";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Course } from "@/types";
import { Crown } from "lucide-react";
import PlanCard from "./PlanCard";

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
    type: "essential" | "elite",
    icon: React.ReactNode;
    name: string;
    theme: string;
    price: number;
    features: { provided: boolean; title: string }[];
    discountType?: string;
    discountValue?: number;
    discountLabel?: string;
    discountPrice?: number;
    isPopular?: boolean;
  }[] = [];

  // Only add Essential plan if it exists
  if (course.plans.essential) {
    plans.push({
      type: "essential",
      icon: <Crown className="size-5" />,
      name: course.plans.essential.title,
      theme: "bg-[#F68A5C]",
      price: course.plans.essential.price || 0,
      features: course.plans.essential.features || [],
      discountType: course.plans.essential.discount?.discount,
      discountValue: course.plans.essential.discount?.value,
      discountLabel: `${
        course.plans.essential.discount?.discount === "fixed"
          ? `₹${course.plans.essential.discount?.value} off`
          : `${course.plans.essential.discount?.value}% off`
      }`,
      discountPrice: Math.round(
        (course.plans.essential.price || 0) -
          (course.plans.essential.discount?.discount === "fixed"
            ? course.plans.essential.discount?.value || 0
            : ((course.plans.essential.price || 0) *
                (course.plans.essential.discount?.value || 0)) /
              100)
      ),
      isPopular: course.plans.essential.isPopular,
    });
  }

  // Only add Elite plan if it exists
  if (course.plans.elite) {
    plans.push({
      type: "elite",
      icon: <Crown className="size-5" />,
      name: course.plans.elite.title,
      theme: "bg-[#8B5CF6]",
      price: course.plans.elite.price || 0,
      features: course.plans.elite.features || [],
      discountType: course.plans.elite.discount?.discount,
      discountValue: course.plans.elite.discount?.value,
      discountLabel: `${
        course.plans.elite.discount?.discount === "fixed"
          ? `₹${course.plans.elite.discount?.value} off`
          : `${course.plans.elite.discount?.value}% off`
      }`,
      discountPrice: Math.round(
        (course.plans.elite.price || 0) -
          (course.plans.elite.discount?.discount === "fixed"
            ? course.plans.elite.discount?.value || 0
            : ((course.plans.elite.price || 0) *
                (course.plans.elite.discount?.value || 0)) /
              100)
      ),
      isPopular: course.plans.elite.isPopular,
    });
  }

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
