import React, { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Testimonial } from "@/types";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const TestimonialCard = ({
  testimonial,
  ...props
}: {
  testimonial: Testimonial;
} & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [imageError, setImageError] = useState(false);

  if (!testimonial) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(
      0
    )}`.toUpperCase();
  };

  return (
    <div
      className={cn(
        `${testimonial.name}-card h-full bg-white rounded-2xl flex flex-col items-center py-3 px-2`,
        props.className
      )}
    >
      <div className="testimonial-image size-16 md:size-20 rounded-full mb-3 md:mb-4 overflow-hidden">
        {!imageError ? (
          <Image
            src={testimonial.profileImage || "/courseDefaultTestimonial.png"}
            alt={testimonial.name || "Testimonial"}
            width={100}
            height={100}
            className="w-full h-full object-cover"
            draggable={false}
            loading="eager"
            unoptimized
            priority
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {getInitials(testimonial.name)}
            </span>
          </div>
        )}
      </div>
      <div className="testimonial-information flex flex-col items-center justify-center gap-1 mb-4 flex-shrink-0">
        <div className="testimonial-name-container w-full flex items-center justify-center gap-3">
          <div className="testimonial-name text-sm md:text-xl font-coolvetica font-normal">
            {testimonial.name}
          </div>
          {testimonial.linkedin && testimonial.linkedin.trim() !== "" && (
            <Link
              href={
                testimonial.linkedin.startsWith("http")
                  ? testimonial.linkedin
                  : `https://${testimonial.linkedin}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/linkedin-icon.svg"
                alt="Linkedin Icon"
                width={20}
                height={20}
                className="size-5"
              />
            </Link>
          )}
        </div>
        <div
          className={cn(
            "testimonial-college text-xs md:text-base font-normal",
            plusJakartaSans.className
          )}
        >
          {testimonial.college}
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
