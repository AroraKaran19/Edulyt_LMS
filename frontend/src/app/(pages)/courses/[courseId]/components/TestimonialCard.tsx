import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Linkedin } from "lucide-react";
import Link from "next/link";
import { Testimonial } from "./TestimonialCarousel";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const TestimonialCard = ({
  testimonial,
  className,
}: {
  testimonial: Testimonial;
  className: string;
}) => {
  return (
    <div
      className={cn(
        `${testimonial.name}-card h-full bg-white rounded-2xl flex flex-col items-center py-3 px-2`,
        className
      )}
    >
      <div className="testimonial-image size-16 md:size-20 rounded-full mb-3 md:mb-4">
        <Image
          src={testimonial.image}
          alt={testimonial.name}
          width={100}
          height={100}
          objectFit="cover"
        />
      </div>
      <div className="testimonial-information flex flex-col items-center justify-center gap-1 mb-4 flex-shrink-0">
        <div className="testimonial-name-container w-full flex items-center justify-center gap-3">
          <div className="testimonial-name text-sm md:text-xl font-coolvetica font-normal">
            {testimonial.name}
          </div>
          {testimonial.linkedin && (
            <Link href={testimonial.linkedin} target="_blank">
              <Linkedin className="size-5 text-[#F77124] hover:text-[#F77124]/80 transition-all duration-300" />
            </Link>
          )}
        </div>
        <div
          className={cn(
            "testimonial-role text-xs md:text-base font-normal",
            plusJakartaSans.className
          )}
        >
          {testimonial.currentRole}
        </div>
      </div>
      <div className="testimonial-transition-container flex flex-col items-center justify-center gap-1 flex-grow">
        <div className="testimonial-past-information flex flex-col items-center justify-center gap-1">
          <div
            className={cn(
              "testimonial-past-role text-xs md:text-base font-normal",
              plusJakartaSans.className
            )}
          >
            {testimonial.pastRole}
          </div>
          <div className="testimonial-past-company text-sm md:text-xl font-bold font-coolvetica">
            {testimonial.pastCompany}
          </div>
        </div>
        <img src="/Arrow.svg" alt="Arrow" className="w-10 h-10" />
        <div className="testimonial-current-information flex flex-col items-center justify-center gap-1 py-2.5 px-4 md:px-8 bg-[#F77124]/10 border border-black/10 rounded-full">
          <div
            className={cn(
              "testimonial-current-role text-xs md:text-base font-normal flex-wrap text-center",
              plusJakartaSans.className
            )}
          >
            {testimonial.currentRole}
          </div>
          <div className="testimonial-current-company text-sm md:text-xl font-bold font-coolvetica flex-wrap text-center">
            {testimonial.currentCompany}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
