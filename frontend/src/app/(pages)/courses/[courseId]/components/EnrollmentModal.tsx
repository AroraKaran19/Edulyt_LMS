"use client";
import React from "react";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Course, Plan, Discount } from "@/types";
import { Check, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

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
  courseDiscount?: Discount;
}> = ({ plan, isPopular = false, onSelect, courseDiscount }) => {
  const { data: session } = useSession();

  // Calculate final price with both course and plan discounts
  const calculateFinalPrice = () => {
    let finalPrice = plan.price;

    // Apply course-level discount first (if available and active)
    if (courseDiscount?.isActive) {
      if (courseDiscount.discount === "percentage") {
        finalPrice = finalPrice - (finalPrice * courseDiscount.value) / 100;
      } else if (courseDiscount.discount === "fixed") {
        finalPrice = Math.max(0, finalPrice - courseDiscount.value);
      }
    }

    // Apply plan-level discount (if available and active)
    if (plan.discount?.isActive) {
      if (plan.discount.discount === "percentage") {
        finalPrice = finalPrice - (finalPrice * plan.discount.value) / 100;
      } else if (plan.discount.discount === "fixed") {
        finalPrice = Math.max(0, finalPrice - plan.discount.value);
      }
    }

    return Math.max(0, Math.round(finalPrice));
  };

  const originalPrice = plan.price;
  const finalPrice = calculateFinalPrice();

  // Calculate total savings
  const totalSavings = originalPrice - finalPrice;
  const hasAnyDiscount = courseDiscount?.isActive || plan.discount?.isActive;

  return (
    <div
      className={cn(
        "relative border-2 rounded-3xl p-6 transition-all duration-300 cursor-pointer",
        isPopular
          ? "border-[#F77124] bg-[#FFF6F2] shadow-[0_0_20px_4px_rgba(247,113,36,0.2)]"
          : "border-gray-200 hover:border-[#F77124]/50 hover:shadow-[0_0_15px_2px_rgba(247,113,36,0.1)]"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-[#F77124] to-[#E65A1A] text-white px-4 py-1.5 rounded-2xl text-sm font-bold flex items-center gap-1.5 shadow-[0_0_10px_2px_rgba(247,113,36,0.3)]">
            <Crown className="w-4 h-4" />
            Most Popular
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-[#2B1508] mb-3 font-coolvetica">
          {plan.title}
        </h3>
        <div className="flex items-center justify-center gap-3">
          {hasAnyDiscount && (
            <span className="text-lg text-gray-500 line-through font-medium">
              ₹{originalPrice}
            </span>
          )}
          <span className="text-3xl font-bold text-[#2B1508] font-coolvetica">
            ₹{finalPrice}
          </span>
        </div>
        {hasAnyDiscount && (
          <div className="space-y-2 mt-3">
            {/* Course discount */}
            {courseDiscount?.isActive && (
              <div className="bg-[#E3F2FD] rounded-2xl p-2 border border-[#BBDEFB]">
                <span className="text-sm text-[#1976D2] font-semibold block">
                  Course:{" "}
                  {courseDiscount.discount === "percentage"
                    ? `${courseDiscount.value}% OFF`
                    : `₹${courseDiscount.value} OFF`}
                </span>
              </div>
            )}
            {/* Plan discount */}
            {plan.discount?.isActive && (
              <div className="bg-[#FFF6F2] rounded-2xl p-2 border border-[#FFE9DB]">
                <span className="text-sm text-[#F77124] font-semibold block">
                  Plan:{" "}
                  {plan.discount.discount === "percentage"
                    ? `${plan.discount.value}% OFF`
                    : `₹${plan.discount.value} OFF`}
                </span>
              </div>
            )}
            {/* Total savings */}
            <div className="bg-gradient-to-r from-[#4CAF50] to-[#45A049] rounded-2xl p-2">
              <span className="text-sm text-white font-bold block">
                Total Savings: ₹{totalSavings}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                feature.provided
                  ? "bg-[#E8F5E8] text-[#2E7D32] border border-[#C8E6C9]"
                  : "bg-gray-100 text-gray-400 border border-gray-200"
              )}
            >
              {feature.provided && <Check className="w-3 h-3" />}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                feature.provided ? "text-[#2B1508]" : "text-gray-400"
              )}
            >
              {feature.title}
            </span>
          </div>
        ))}
      </div>

      <OrangeButton
        className={cn(
          "w-full rounded-2xl font-semibold",
          isPopular ? "shadow-[0_0_15px_3px_rgba(247,113,36,0.4)]" : ""
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (session?.user?.id) {
            onSelect();
          } else {
            redirect("/auth/login");
          }
        }}
      >
        {session?.user?.id ? "Choose " + plan.title : "Login to Choose"}
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
              courseDiscount={course.discount}
            />
          )}

          {hasElitePlan && (
            <PlanCard
              plan={plans.elite!}
              isPopular={isElitePopular}
              onSelect={() => onPlanSelect("elite")}
              courseDiscount={course.discount}
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
