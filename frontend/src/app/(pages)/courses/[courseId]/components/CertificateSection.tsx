import SectionContainer from "@/components/ui/course/SectionContainer";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Course } from "@/types";
import { Check, Crown, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const CertificateSection = ({ course }: { course: Course }) => {
  const plans = [];

  // Only add Essential plan if it exists
  if (course.plans.essential) {
    plans.push({
      icon: <Crown className="size-5" />,
      name: "Essential",
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
    });
  }

  // Only add Elite plan if it exists
  if (course.plans.elite) {
    plans.push({
      icon: <Crown className="size-5" />,
      name: "Elite",
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
    });
  }

  return (
    <SectionContainer id="plans" className="bg-text-primary !px-20">
      <div className="plans-header w-full flex flex-col md:flex-row items-center gap-4">
        <div className="header-left w-full md:w-1/2 flex flex-col gap-2">
          <h2 className="font-normal font-coolvetica text-white text-2xl md:text-4xl text-center md:text-left">
            This Course is ideal for{" "}
            <span>
              {course.audience
                .replace(/college-students/g, "College Students")
                .replace(/professionals/g, "Professionals")}
            </span>
            .
          </h2>
          <p className="text-white text-sm md:text-base font-extrabold italic text-center md:text-left">
            {course.shortDescription}
          </p>
        </div>
        <div className="header-right w-full md:w-1/2 flex items-center justify-center md:justify-end">
          <OrangeButton glow>
            <Link
              href={`/courses/${course.slug}`}
              className="text-white font-bold text-sm md:text-base"
            >
              Get Curriculum
            </Link>
          </OrangeButton>
        </div>
      </div>

      <div className="plans-body w-full flex flex-col xl:flex-row gap-10 items-center lg:items-stretch">
        <div className="plans-container w-full md:w-full xl:w-1/2 flex flex-col md:flex-row gap-4">
          {plans.map((plan, index) => (
            <div
              key={index}
              className="plan-card w-1/2 flex flex-col gap-2 bg-white rounded-2xl"
            >
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
                <span className="text-sm text-text-primary mt-auto">
                  / month
                </span>
              </div>

              <div className="plan-features w-full flex flex-col gap-2 p-3">
                {plan.features.map((feature, index) => (
                  <div
                    key={index}
                    className="plan-feature text-sm font-medium text-text-primary flex items-center gap-2"
                  >
                    {feature.provided ? (
                      <Check className="size-4" />
                    ) : (
                      <X className="size-4" />
                    )}
                    {feature.title}
                  </div>
                ))}
              </div>

              <div className="plan-button-container mt-auto w-full flex justify-center p-3">
                <WhiteButton className="w-full">
                  <span className="w-full text-center text-text-primary font-extrabold text-sm md:text-base">
                    Select
                  </span>
                </WhiteButton>
              </div>
            </div>
          ))}
        </div>
        <div className="certificate-preview w-full md:w-1/2 relative">
          <Image
            src="/certificate.svg"
            alt="Certificate Preview"
            width={1500}
            height={569}
            className="w-full h-full object-contain object-center select-none max-h-[470px]"
            priority
            quality={100}
            draggable={false}
            unoptimized
          />
        </div>
      </div>
    </SectionContainer>
  );
};

export default CertificateSection;
