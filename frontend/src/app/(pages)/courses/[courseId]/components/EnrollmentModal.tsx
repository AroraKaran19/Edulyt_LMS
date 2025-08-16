"use client";
import React from "react";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Course, Plan } from "@/types";
import { Check, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onPlanSelect: (planType: "elite" | "essential") => void;
}

const PlanCard: React.FC<{
  plan: Plan;
  isPopular?: boolean;
  onSelect: () => void;
}> = ({ plan, isPopular = false, onSelect }) => {
  const originalPrice = plan.price;
  const discountedPrice = plan.discount?.isActive
    ? originalPrice - (originalPrice * plan.discount.value) / 100
    : originalPrice;

  return (
    <div
      className={cn(
        "relative border-2 rounded-xl p-6 transition-all duration-200 cursor-pointer",
        isPopular
          ? "border-orange-500 bg-orange-50 shadow-lg"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Crown className="w-4 h-4" />
            Most Popular
          </div>
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {plan.title}
        </h3>
        <div className="flex items-center justify-center gap-2">
          {plan.discount?.isActive && (
            <span className="text-lg text-gray-500 line-through">
              ₹{originalPrice}
            </span>
          )}
          <span className="text-3xl font-bold text-gray-900">
            ₹{discountedPrice}
          </span>
        </div>
        {plan.discount?.isActive && (
          <span className="text-sm text-orange-600 font-medium">
            {plan.discount.value}% OFF
          </span>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                feature.provided
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {feature.provided && <Check className="w-3 h-3" />}
            </div>
            <span
              className={cn(
                "text-sm",
                feature.provided ? "text-gray-700" : "text-gray-400"
              )}
            >
              {feature.title}
            </span>
          </div>
        ))}
      </div>

      <OrangeButton
        className={cn(
          "w-full",
          isPopular ? "bg-orange-500 hover:bg-orange-600" : ""
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        Choose {plan.title}
      </OrangeButton>
    </div>
  );
};

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  course,
  onPlanSelect,
}) => {
  const plans = course.plans;
  const hasElitePlan = plans.elite;
  const hasEssentialPlan = plans.essential;

  // Determine which plan is more popular (has more features)
  const eliteFeatures =
    plans.elite?.features.filter((f) => f.provided).length || 0;
  const essentialFeatures =
    plans.essential?.features.filter((f) => f.provided).length || 0;
  const isElitePopular = eliteFeatures > essentialFeatures;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Plan"
      className="max-w-2xl"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasEssentialPlan && (
            <PlanCard
              plan={plans.essential!}
              isPopular={!isElitePopular && hasEssentialPlan ? true : false}
              onSelect={() => onPlanSelect("essential")}
            />
          )}

          {hasElitePlan && (
            <PlanCard
              plan={plans.elite!}
              isPopular={isElitePopular}
              onSelect={() => onPlanSelect("elite")}
            />
          )}
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
