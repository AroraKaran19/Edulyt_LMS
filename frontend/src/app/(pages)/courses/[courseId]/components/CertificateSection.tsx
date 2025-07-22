import CourseTitle from "@/components/ui/course/CourseTitle";
import SectionContainer from "@/components/ui/course/SectionContainer";
import OrangeButton from "@/components/ui/OrangeButton";
import WhiteButton from "@/components/ui/WhiteButton";
import { Course } from "@/types";
import { Check, Crown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const CertificateSection = ({ course }: { course: Course }) => {
  const plans = [
    {
      icon: <Crown className="size-5" />,
      name: "Essential",
      theme: "bg-[#F68A5C]",
      price: course.plans.essential?.[0]?.price || 0,
      features: course.plans.essential?.[0]?.features || [],
      discount: course.discount,
      discountLabel: `${course.discount}% off`,
      discountPrice:
        Math.round((
          (course.plans.essential?.[0]?.price ?? 0) -
            ((course.plans.essential?.[0]?.price ?? 0) * (Number(course.discount) || 0)) / 100
        ) * 100) / 100,
    },
    {
      icon: <Crown className="size-5" />,
      name: "Elite",
      theme: "bg-[#8B5CF6]",
      price: course.plans.elite?.[0]?.price || 0,
      features: course.plans.elite?.[0]?.features || [],
      discount: course.discount,
      discountLabel: `${course.discount}% off`,
      discountPrice:
        Math.round((
          (course.plans.elite?.[0]?.price ?? 0) -
            ((course.plans.elite?.[0]?.price ?? 0) * (Number(course.discount) || 0)) / 100
        ) * 100) / 100,
    },
  ];

  return (
    <SectionContainer id="plans" className="bg-text-primary">
      <div className="plans-header w-full flex flex-col md:flex-row items-center gap-4">
        <div className="header-left w-full md:w-1/2 flex flex-col gap-2">
          <CourseTitle
            title={`This Course is ideal for ${course.skillLevel}`}
            className="text-white text-2xl md:text-4xl text-center md:text-left"
          />
          <p className="text-white text-sm md:text-base font-extrabold italic text-center md:text-left">
            The <span className="text-[#f77124]">PG program</span> in AI & ML
            empowers you to align your learning with your professional
            aspirations
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
              className="plan-card w-full flex flex-col gap-2 bg-white rounded-2xl"
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
                {plan.discount && (
                  <span
                    className={`plan-discount ml-auto text-white text-xs ${plan.theme} p-1 rounded-md font-bold`}
                  >
                    {plan.discountLabel}
                  </span>
                )}
              </div>

              <div className="plan-price-container mt-3 md:mt-7 flex gap-1 bg-black/5 p-3">
                <div className="plan-price text-2xl text-text-primary font-extrabold flex items-center gap-2">
                  ₹{plan.discount ? `${plan.discountPrice}` : `${plan.price}`}
                  {plan.discount && (
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
                    className="plan-feature text-sm font-medium text-text-primary flex items-center gap-2"
                  >
                    <Check className="size-4" />
                    {feature.title}
                  </div>
                ))}
              </div>

              <div className="plan-button-container mt-auto w-full flex justify-center p-3">
                <WhiteButton className="w-full">
                  <span
                    className="w-full text-center text-text-primary font-extrabold text-sm md:text-base"
                  >
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
            height={1500}
            className="w-full h-full object-contain object-center select-none"
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
