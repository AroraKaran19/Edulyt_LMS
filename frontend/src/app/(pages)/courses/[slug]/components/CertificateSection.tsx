"use client";
import SectionContainer from "@/components/ui/course/SectionContainer";
import { Course } from "@/types";
import { Crown } from "lucide-react";
import React from "react";
import CertificateCarousel from "./CertificateCarousel";
import PlanCard from "./PlanCard";
import { calculateDiscountDisplay } from "@/lib/utils/discount";

const CertificateSection = ({
  course,
  onEnrollClick,
}: {
  course: Course;
  onEnrollClick?: () => void;
}) => {
  const plans: {
    type: "essential" | "elite";
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

  return (
    <SectionContainer id="plans" className="bg-text-primary xl:px-20!">
      <div className="plans-header w-full flex flex-col md:flex-row items-center justify-stretch gap-4">
        <div className="header-left w-full md:w-2/3 flex flex-col gap-2">
          <h2 className="font-normal font-coolvetica text-white text-2xl md:text-4xl text-center md:text-left">
            This Course is ideal for{" "}
            <span>
              {course.audience
                ?.replace(/college-students/g, "College Students")
                ?.replace(/professionals/g, "Professionals") || "Students"}
            </span>
            .
          </h2>
          <div
            className="text-white text-sm md:text-base font-normal text-wrap wrap-break-words prose prose-sm max-w-none prose-invert [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-4 [&_ol]:list-inside [&_ol]:ml-4 [&_li]:list-item [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: course.whoShouldJoin || "" }}
          />
        </div>
      </div>

      <div className="plans-body w-full flex flex-col xl:flex-row gap-10 items-center lg:items-stretch min-h-[600px]">
        <div className="plans-container w-full md:w-full xl:w-3/4 flex flex-col md:flex-row gap-4">
          {plans.map((plan, index) => (
            <PlanCard
              plan={plan}
              totalPlans={plans.length}
              key={index}
              onEnrollClick={onEnrollClick}
            />
          ))}
        </div>
        <div className="certificate-preview h-[400px]! xl:h-auto! w-full sm:w-3/4 md:w-1/4 mx-auto relative">
          <CertificateCarousel />
        </div>
      </div>
    </SectionContainer>
  );
};

export default CertificateSection;
