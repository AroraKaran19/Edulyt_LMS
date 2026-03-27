"use client";

import TimelineMarkerIcon from "./TimelineMarkerIcon";
import { HelpCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import TimelineSectionsWrapper from "./TimelineSectionsWrapper";
import { DashedLineHorizontal } from "./CareerConfusionSection";
import { GoHeartFill } from "react-icons/go";

const GROWTH_POINTS = [
    "Stuck In A Non-Tech Job?",
    "Working In A Low-Salary Role?",
    "Want To Switch To Tech?",
    "Looking To Upskill For Higher Pay?",
];

export default function ProfessionalGrowthSection() {
    return (
        <div className="relative px-4 sm:px-10 lg:px-40 mt-8 sm:mt-12 sm:py-10">
            {/* Top Header with Icon */}
            <div className="flex items-center relative gap-4 -translate-x-6 sm:-translate-x-22">
                <TimelineMarkerIcon size="big">
                    <HelpCircle className="text-white w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </TimelineMarkerIcon>
                <div >
                    <h2 className="text-base sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
                        Your Career Path Doesn&apos;t End Here
                    </h2>
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-10 sm:mt-16">
                <div className="flex flex-col gap-1 mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg lg:text-xl font-semibold leading-tight">
                        Not a <span className="text-[#F77124]">Student Anymore?</span><br />
                        Already Working, <span className="text-[#F77124]">But Not Growing?</span>
                    </h2>
                </div>
                <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 xl:gap-20">
                    {/* Left Side: Points & Sub-timeline */}
                    <div className="flex-1 w-full relative">


                        <DashedLineHorizontal
                            svgStyle="absolute bottom-0 -left-2 md:w-1/5 lg:w-1/8"
                            className="relative z-99 w-full h-14 -left-8 sm:-left-12 "
                        />
                        <TimelineSectionsWrapper svgStyle="h-11/12" className="xl:ml-4">
                            <div className="flex flex-col -ml-4 sm:-ml-8 gap-3 sm:gap-4">
                                {GROWTH_POINTS.map((q) => (
                                    <div
                                        key={q}
                                        className="relative  flex items-center"
                                    >
                                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-full bg-[#F77124] text-white shadow-[0_4px_12px_rgba(247,113,36,0.3)] z-10">
                                            <span className="text-[11px] sm:text-[13px] lg:text-[15px] text-[#F77124] bg-white w-3/5 h-3/5 rounded-full flex items-center justify-center font-black">?</span>
                                        </div>
                                        <div className="-ml-3 sm:-ml-4 pl-6 sm:pl-8 pr-4 sm:pr-6 py-2 lg:pl-10 lg:pr-8 lg:py-3 rounded-full bg-[#FFF3E8] border border-orange-100/50">
                                            <span className={cn("whitespace-normal font-bold text-gray-800", "text-xs sm:text-sm font-medium")}>
                                                {q}
                                            </span>
                                        </div>

                                    </div>
                                ))}



                            </div>
                            <DashedLineHorizontal
                                svgStyle="absolute bottom-6 -left-2 w-3/5"
                                className="relative z-99 w-full h-14 "
                            >
                                <div className="absolute bottom-0 left-6 sm:left-10 flex items-center">
                                    <button
                                        type="button"
                                        className="group w-full relative inline-flex items-center bg-[#59CC62]/30 hover:bg-[#59CC62]/20 rounded-full transition-all"
                                    >
                                        <span className="flex h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-full bg-[#59CC62] text-white shadow-lg shadow-green-100">
                                            <GoHeartFill className="text-lg sm:text-xl lg:text-2xl" />
                                        </span>
                                        <span className={cn("pl-2 sm:pl-4 pr-2 sm:pr-4 w-full whitespace-nowrap py-2 sm:py-3 font-bold text-gray-800 capitalize", "text-xs sm:text-sm font-medium")}>
                                            We have professional courses for you
                                        </span>
                                    </button>
                                </div>
                            </DashedLineHorizontal>
                        </TimelineSectionsWrapper>
                    </div>

                    {/* Right Side: Image Section */}
                    <div className="flex-1 w-full lg:max-w-lg h-[300px] sm:h-[350px] lg:h-[400px] relative rounded-xl overflow-hidden">
                        <div className="w-1/3 h-full absolute z-9 left-0 bg-white  blur-3xl"></div>
                        <div className="w-1/3 h-full absolute z-9 right-0 bg-white  blur-3xl"></div>
                        <div className="h-1/4 w-full absolute z-9 top-0 bg-white  blur-3xl"></div>
                        <div className="h-1/4 w-full absolute z-9 bottom-0 bg-white  blur-3xl"></div>
                        <Image
                            alt="professional-growth"
                            src="/assets/professional-growth.png"
                            fill
                            className="object-cover"
                            // sizes="(max-width: 1024px) 100vw, 500px"
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
