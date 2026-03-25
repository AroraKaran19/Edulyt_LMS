"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LearnerCareerItem {
  name: string;
  course: string;
  role: string;
  company: string;
  profileImage: string;
  testimonial?: string;
}

interface LearnerCareerCardProps {
  item: LearnerCareerItem;
  /** When false, the bottom testimonial paragraph is not rendered. Default false. */
  showTestimonial?: boolean;
  isHighlighted?: boolean;
  className?: string;
}

export default function LearnerCareerCard({
  item,
  showTestimonial = false,
  isHighlighted = false,
  className,
}: LearnerCareerCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border m-1 transition-all relative overflow-hidden h-full flex flex-col",
        isHighlighted
          ? "bg-white border-[#F77124] shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] border-2"
          : "bg-white/70 backdrop-blur-md border-gray-200 shadow-lg",
        className
      )}
    >
      <div className="flex flex-col items-center mb-4 sm:mb-6">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 sm:mb-4">
          <Image
            src={item.profileImage}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>

        <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-1">
          {item.name}
        </h3>

        <p className="text-xs text-gray-600 mb-2 text-center">{item.course}</p>

        <p className="text-sm sm:text-base mt-3 sm:mt-4 text-gray-900 mb-2 text-center">
          {item.role}
        </p>

        <p className="text-lg sm:text-xl text-center text-black font-extrabold mb-3 sm:mb-4">
          {item.company}
        </p>

        <div className="flex flex-col items-center w-full mb-3 sm:mb-4">
          <div className="relative flex flex-col items-center mb-2">
            <svg
              className="w-5 h-10 sm:w-6 sm:h-12"
              viewBox="0 0 24 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 0 L12 40"
                stroke="#F77124"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M12 40 L6 34 M12 40 L18 34"
                stroke="#F77124"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="bg-[#F771241A] rounded-full p-2 sm:p-3 w-full border flex flex-col items-center justify-center border-gray-200">
            <p className="text-sm sm:text-base text-gray-900 text-center mb-1 sm:mb-2">
              {item.role}
            </p>
            <p className="text-lg sm:text-xl text-black font-extrabold text-center">
              {item.company}
            </p>
          </div>
        </div>
      </div>

      {showTestimonial && item.testimonial && (
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-center line-clamp-6 min-h-24 sm:min-h-32 mt-auto">
          {item.testimonial}
        </p>
      )}
    </div>
  );
}
