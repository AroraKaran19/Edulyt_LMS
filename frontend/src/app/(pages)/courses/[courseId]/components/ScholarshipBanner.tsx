import { cn } from "@/lib/utils";
import React from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import OrangeButton from "@/components/ui/OrangeButton";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ScholarshipBanner = () => {
  return (
    <section
      id="scholarship"
      className={cn(
        "scholarship-banner w-full bg-[#2B1508] rounded-2xl py-4 px-8 lg:px-[10%] md:py-15 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-0"
      )}
    >
      <div className="banner-content w-full lg:w-1/2 flex flex-col gap-4">
        <h2 className="text-white text-xl md:text-4xl font-bold font-coolvetica tracking-wide text-center lg:text-left">
          Enroll now for a scholarship and get 50% off
        </h2>
        <p
          className={cn(
            "text-white text-sm md:text-base font-extrabold !italic text-center lg:text-left",
            plusJakartaSans.className
          )}
        >
          The <span className="text-[#F77124]">PG program</span> in AI & ML
          empowers you to align your learning with your professional aspirations
        </p>
      </div>
      <div className="banner-cta w-full lg:w-1/5 flex flex-col gap-4 items-center">
        <OrangeButton
          className={cn(
            "font-bold text-sm md:text-base px-8 md:px-16 w-max text-center",
            plusJakartaSans.className
          )}
        >
          Apply Now!
        </OrangeButton>
      </div>
    </section>
  );
};

export default ScholarshipBanner;
