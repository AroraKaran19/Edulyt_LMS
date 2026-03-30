"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { RiKakaoTalkFill } from "react-icons/ri";
import { PrimaryButton } from "../ui/PrimaryButton";

const BENEFITS = [
  "Understanding Your Current Level",
  "Identifying Skill Gaps",
  "Creating A Personalized Career Roadmap",
];

function PhoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// function SpeechBubbleIcon() {
//   return (
//     <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#3FD673] text-white shadow-sm">
//       <div className="absolute -bottom-1 -left-0.5 h-3 w-3 rotate-45 bg-[#3FD673]"></div>
//       <span className="relative z-10 text-[7px] font-black tracking-tighter">TALK</span>
//     </div>
//   );
// }

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size ?? 40} height={size ?? 40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ConsultationSection() {
  return (
    <div className="relative px-4 sm:px-10 lg:px-40 py-8 sm:py-10 lg:py-12">
      {/* Top Header Row */}
      <div className="flex items-center relative gap-4 -translate-x-6 sm:-translate-x-22">
        <div className="flex h-9 w-9 sm:h-11 sm:w-11 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-full bg-[#F77124] text-white">
          <PhoneIcon />
        </div>
        <h3 className="text-base sm:text-xl md:text-xl relative md:left-7 font-semibold text-gray-800">
          One Conversation Can Change Everything.
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center mt-6">
        {/* Left: Image with Overlays */}
        <div className="lg:col-span-6 relative overflow-hidden rounded-2xl hidden sm:block">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-white to-transparent blur-4xl z-10" />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-white to-transparent blur-4xl z-10" />
          <Image
            src="/assets/professional-consult.png"
            alt="Industry professionals ready to help"
            width={700}
            height={500}
            className="h-auto w-full rounded-xl object-cover"
          />
        </div>

        {/* Right: Content */}
        <div className="lg:col-span-6 flex flex-col gap-6 sm:gap-8 lg:pl-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg sm:text-lg lg:text-4xl whitespace-nowrap font-extrabold leading-tight">
              You Don&apos;t Need To Figure It<br className="hidden sm:block" />
              Out <span className="text-[#F77124]">Alone !</span>
            </h2>
          </div>

          <div
            className="group w-full flex items-center bg-[#59CC62]/30 rounded-full mb-4 sm:mb-6">
            <span className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[#59CC62] text-white">
              <RiKakaoTalkFill className="text-xl sm:text-2xl" />
            </span>
            <span className={cn("pl-3 sm:pl-4 pr-3 sm:pr-4 w-full  whitespace-nowrap py-2 sm:py-3 font-bold text-gray-800", "text-xs sm:text-sm font-medium")}>
              Talk To Our Professionals And Get Clarity.
            </span>
          </div>


          {BENEFITS.map((b) => (
            <div
              key={b}
              className="flex relative items-center gap-3 sm:gap-5 rounded-full bg-[#FFF0E6] pr-4 sm:pr-10 shadow-sm border border-orange-50/50"
            >
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#F77124]">
                <span className="p-1 text-[#F77124] bg-white rounded-full">
                  <CheckIcon size={18} />
                </span>
              </div>
              <span className={cn("font-bold text-gray-900", "text-xs sm:text-sm lg:text-lg font-bold")}>{b}</span>
            </div>
          ))}

          <PrimaryButton variant="primary" size="md" className="w-full sm:w-fit">
            Book Consultation
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
