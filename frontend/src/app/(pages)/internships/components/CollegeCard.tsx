"use client";

import Image from "next/image";
import type { College } from "@/constants/internshipData";
import { cn } from "@/lib/utils";

interface CollegeCardProps {
  college: College;
  className?: string;
}

export default function CollegeCard({ college, className }: CollegeCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-100 pt-3 md:pt-8 pb-1 md:pb-0",
        className
      )}
    >
      {/* College Image with Circular Logo Overlay */}
      <div className="px-3 md:px-5 md:pt-5 relative">
        <div className="relative w-full h-40 sm:h-52 rounded-2xl overflow-hidden shadow-sm">
          <Image
            src={"/assets/Collage-image.png"}
            alt={college.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Circular Logo Overlay - Centered on mobile, top-aligned on desktop */}
        <div className="absolute z-[10] top-[45%] md:top-5 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-28 md:h-28 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-white">
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <Image
              src="/assets/Collage-badge.png"
              alt="College Logo"
              fill
              className="object-contain p-1"
            />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="px-5 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* College Name */}
        <h3 className="text-xl md:text-2xl font-extrabold text-black leading-tight text-center md:text-left">
          {college.name}
        </h3>

        {/* Internship Participation */}
        <div className="space-y-2 md:space-y-3">
          <p className="text-base md:text-lg font-bold text-black">
            Internship Participation
          </p>
          <p className="text-sm md:text-base text-gray-800">
            <span className="text-[#F77124] font-bold">
              {college.internshipParticipation.countLabel}
            </span>{" "}
            {college.internshipParticipation.descriptionPrefix}{" "}
            <span className="font-bold">
              {college.internshipParticipation.descriptionHighlight}
            </span>
          </p>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {college.internshipParticipation.students.slice(0, 1).map((student, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-gray-50 rounded-full pl-1 pr-4 py-1 border border-gray-100 shadow-sm"
              >
                <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                    alt={student.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-xs md:text-sm text-gray-900 font-bold whitespace-nowrap">
                  Aman Sharma
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Courses Enrollment */}
        <div className="space-y-2 md:space-y-3">
          <p className="text-base md:text-lg font-bold text-black">
            Courses Enrollment
          </p>
          <p className="text-sm md:text-base text-gray-800">
            <span className="text-[#F77124] font-bold">
              {college.coursesEnrollment.countLabel}
            </span>{" "}
            {college.coursesEnrollment.descriptionPrefix}{" "}
            <span className="font-bold">
              {college.coursesEnrollment.descriptionHighlight}
            </span>
          </p>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {college.coursesEnrollment.students.slice(0, 1).map((student, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-gray-50 rounded-full pl-1 pr-4 py-1 border border-gray-100 shadow-sm"
              >
                <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                    alt={student.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-xs md:text-sm text-gray-900 font-bold whitespace-nowrap">
                  Aman Sharma
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
