"use client";

import Image from "next/image";
import TimelineMarkerIcon from "./TimelineMarkerIcon";
import { RiKakaoTalkFill } from "react-icons/ri";
// import TimelineSectionsWrapper from "./TimelineSectionsWrapper";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  "What Should I Do Next?",
  "How Do I Get A Good Job?",
  "What Skills Should I Learn?",
  "Am I Already Too Late?",
];

export function DashedLineHorizontal({
  className,
  svgStyle,
  children,
}: {
  className?: string;
  svgStyle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute hidden sm:flex ${className ?? ""}`}
    // style={{ width }}
    >
      <svg
        width="100%"
        height="2"
        className={`block overflow-visible ${svgStyle ?? ""}`}
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="1"
          x2="100%"
          y2="1"
          stroke="#C8C8C8"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
      </svg>
      {children}
    </div>
  );
}

export function DashedLineVertical({
  className,
  svgStyle,
  children,
}: {
  className?: string;
  svgStyle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${className ?? ""}`}
    >
      <svg
        width="2"
        height="100%"
        className={`block overflow-visible ${svgStyle ?? ""}`}
        preserveAspectRatio="none"
      >
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="100%"
          stroke="#C8C8C8"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
      </svg>
      {children}
    </div>
  );
}

export default function CareerConfusionSection() {
  return (
    <div className="relative px-0 sm:px-4 mb-13">
      {/* Marker row: 👋 + "Hello Students" */}
      <div className="flex items-center relative gap-4 -translate-x-[22px] sm:-translate-x-22">
        <TimelineMarkerIcon size="big">👋</TimelineMarkerIcon>
        <h3 className="text-base sm:text-xl md:text-xl relative md:left-7 font-semibold text-gray-800">
          Hello Students
        </h3>
      </div>

      {/* Two columns: left = heading + pills + CTA, right = image + thought bubble */}
      <div
        className="grid grid-cols-1 gap-x-12 sm:grid-cols-[1fr_1fr] mt-6 pl-8 sm:pl-0"
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
              Are You Feeling <span className="text-[#F77124]">Confused</span>{" "}
              About Your <span className="text-[#F77124]">Career ?</span>
            </h2>
          </div>
          {/* <TimelineSectionsWrapper svgStyle="h-11/12" className="xl:ml-4"> */}
          <div className="flex flex-col gap-4 pt-6 sm:pt-8">
            <DashedLineVertical
              className="left-[46px] lg:left-[34px] h-40 sm:h-79 z-0"
              svgStyle="h-full"
            />
            {QUESTIONS.map((q, i) => (
              <div
                key={q}
                className="relative flex items-center"
              >
                <div className=" flex items-center w-full sm:w-64 gap-3 sm:gap-4 rounded-full bg-[#FFF3E8] z-1000 border border-orange-100/50">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 xl:h-9 xl:w-9 shrink-0 items-center justify-center rounded-full bg-[#F77124] text-white z-10">
                    <span className="text-[11px] sm:text-[13px] xl:text-[15px] text-[#F77124] bg-white w-3/5 h-3/5 rounded-full flex items-center justify-center font-black">?</span>
                  </div>
                  <span className={cn("whitespace-normal font-bold text-gray-800", "text-xs sm:text-sm font-semibold")}>
                    {q}
                  </span>
                </div>
                {i === 0 && (
                  <>
                    {/* Short connector line from main timeline to first icon */}
                    <DashedLineHorizontal
                      className="left-2.5 sm:left-28 w-[700px] z-99 -translate-y-1/2 hidden sm:block"
                      svgStyle="w-full"
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                        <button
                          aria-label="Talk To Our Professionals And Get Clarity."
                          type="button"
                          className="group relative inline-flex items-center bg-[#F77124]/10 hover:bg-[#F77124]/20 rounded-full transition-all"
                        >
                          <span className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[#F77124] text-white shadow-lg shadow-green-100">
                            <RiKakaoTalkFill className="text-xl sm:text-2xl" />
                          </span>
                        </button>
                      </div>
                    </DashedLineHorizontal>
                  </>
                )}
              </div>
            ))}

          </div>
          <DashedLineHorizontal
            svgStyle="absolute bottom-6 left-5 w-3/5"
            className="relative z-99 w-full h-28"
          >
            <div className="absolute bottom-0 left-8 sm:left-16 flex items-center">
              <button
                aria-label="Talk To Our Professionals And Get Clarity."
                type="button"
                className="group relative inline-flex items-center w-full sm:w-96 bg-[#ceffd2] rounded-full transition-all"
              >
                <span className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[#59CC62] text-white shadow-lg shadow-green-100">
                  <RiKakaoTalkFill className="text-xl sm:text-2xl" />
                </span>
                <span className={cn("w-full whitespace-nowrap py-2 sm:py-3 font-bold text-gray-800", "text-xs sm:text-[16px] font-bold")}>
                  Talk To Our Professionals And Get Clarity.
                </span>
              </button>
            </div>
          </DashedLineHorizontal>
          {/* </TimelineSectionsWrapper> */}
        </div>

        <div className="relative w-full sm:absolute sm:w-3/5 sm:right-0 sm:-bottom-10 hidden md:block">

          <div className="absolute inset-y-0 right-5 w-1/4 bg-linear-to-l from-[#fffcfa] to-transparent blur-sm z-10" />
          <div className="absolute inset-y-0 left-24 w-1/4 bg-linear-to-r from-[#fffcfa] to-transparent blur-sm z-10" />

          <Image
            src="/assets/confused-student.png"
            alt="Confused student thinking about career with laptop"
            width={520}
            height={550}
            className="h-4/5 w-4/5 relative bottom-12 ml-0 sm:ml-28 object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
