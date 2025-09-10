"use client";
import { WhiteButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Check, TrendingUp, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";

const PlanCard = ({
  plan,
  totalPlans,
  className,
  onClick,
  onEnrollClick,
}: {
  plan: {
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
  };
  totalPlans: number;
  className?: string;
  onClick?: () => void;
  onEnrollClick?: () => void;
}) => {
  const session = useSession();
  const router = useRouter();

  return (
    <div
      className={cn(
        "plan-card flex flex-col gap-2 bg-white rounded-2xl relative",
        totalPlans === 1 && "w-full sm:w-2/4 lg:w-3/4 mx-auto",
        totalPlans === 2 && "w-full md:w-1/2",
        className
      )}
      onClick={onClick}
    >
      {plan.isPopular && (
        <div className="absolute -top-4.5 right-0 z-10">
          <div className="bg-gradient-to-r from-[#F77124] to-[#FF8A65] rounded-full px-4 py-2 flex gap-2 items-center shadow-lg border-2 border-white">
            <TrendingUp className="size-4 shrink-0 text-white" />
            <span className="text-white font-bold text-sm tracking-wide">
              Most Popular
            </span>
          </div>
        </div>
      )}
      <div className="flex w-full items-center gap-2 p-3 md:p-4">
        <div className="plan-icon p-0.5 bg-[#E9E9E9] rounded-md">
          <div
            className={`icon-background ${plan.theme} rounded-sm p-1 text-white`}
          >
            {plan.icon}
          </div>
        </div>
        <div className="plan-name text-text-primary text-xl font-bold">
          {plan.name}
        </div>
        {plan.discountType && plan.discountLabel && (
          <span
            className={`plan-discount ml-auto text-white text-xs ${plan.theme} p-1 rounded-md font-bold`}
          >
            {plan.discountLabel}
          </span>
        )}
      </div>

      <div className="plan-price-container mt-3 md:mt-7 flex gap-1 bg-black/5 p-3">
        <div className="plan-price text-2xl text-text-primary font-extrabold flex items-center gap-2">
          ₹
          {plan.discountType &&
          plan.discountPrice &&
          plan.discountPrice < plan.price
            ? `${plan.discountPrice}`
            : `${plan.price}`}
          {plan.discountType && plan.discountPrice !== plan.price && (
            <span className="text-sm text-gray-500 line-through font-normal">
              ₹{plan.price}
            </span>
          )}
        </div>
        <span className="text-sm text-text-primary mt-auto">/ month</span>
      </div>

      <div className="plan-features w-full flex flex-col gap-2 p-3">
        {plan.features.map((feature, index) => (
          <div
            key={index}
            className="plan-feature text-sm font-medium text-text-primary flex items-stretch gap-2"
          >
            {feature.provided ? (
              <Check className="size-4 md:size-5 shrink-0" />
            ) : (
              <X className="size-4 md:size-5 shrink-0" />
            )}
            <span>{feature.title}</span>
          </div>
        ))}
      </div>

      <div className="plan-button-container mt-auto w-full flex justify-center p-3">
        <WhiteButton
          className="w-full hover:bg-[#F77124] hover:!text-white text-text-primary transition-colors duration-200 ease-in-out"
          onClick={() => {
            if (session.status === "authenticated") {
              onEnrollClick?.();
            } else {
              router.push("/auth/login");
            }
            onClick?.();
          }}
        >
          <span className="w-full text-center font-extrabold text-sm md:text-base">
            {session.status === "authenticated"
              ? "Enroll Now"
              : "Login to Enroll"}
          </span>
        </WhiteButton>
      </div>
    </div>
  );
};

export default PlanCard;
