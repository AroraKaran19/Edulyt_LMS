"use client";

import React from "react";
import TimelineMarkerIcon from "./TimelineMarkerIcon";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
    {
        title: "Industry-Led Mentorship",
        description: "Learn directly from professionals.",
    },
    {
        title: "Hands-On Projects",
        description: "Work on real-world problems.",
    },
    {
        title: "Internship Opportunities",
        description: "Learn directly from professionals.",
    },
    {
        title: "Career Support",
        description: "Resume, interviews, and placement.",
    },
];

export default function TransformationSection() {
    return (
        <div className="relative px-4 sm:px-10 lg:px-40 mt-8 sm:mt-12 sm:py-10">
            {/* Top Header with Icon */}
            <div className="flex items-center relative gap-4 -translate-x-5 sm:-translate-x-22">
                <TimelineMarkerIcon size="big">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-[#F77124] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110">
                        <span className="bg-white rounded-full text-[#F77124]">
                            <CheckIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </span>
                    </div>
                </TimelineMarkerIcon>
                <div >
                    <h2 className="text-base sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
                        It&apos;s Time to Choose the Right Path.
                    </h2>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-col lg:flex-row justify-center gap-8 lg:gap-12 mt-6 sm:mt-8">
                <div className="flex flex-col max-w-2xl gap-10 mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl lg:text-4xl font-extrabold leading-tight">
                        Your <span className="text-[#F77124]">Transformation</span><br />
                        Decision Starts With <span className="text-[#F77124]">One Decision.</span>
                    </h2>
                    <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 xl:gap-20">
                        {/* Left Side: Descriptions */}
                        <div className="flex-1 w-full space-y-4 sm:space-y-6">
                            <p className={cn("text-sm sm:text-base md:text-lg leading-relaxed", "text-gray-600")}>
                                We help students and professionals move from confusion to clarity with <span className="font-bold text-gray-900">expert guidance and practical learning.</span>
                            </p>
                            <p className={cn("text-sm sm:text-base md:text-lg leading-relaxed", "text-gray-600")}>
                                Our programs are designed around real industry demands, <span className="font-bold text-gray-900">focusing on practical skills, hands-on projects, and job-ready training.</span> Everything we offer is aligned toward meaningful career growth and real placement outcomes.
                            </p>
                        </div>

                    </div>
                    {/* Right Side: Features & Sub-timeline */}
                </div>
                    <div className="flex-1 w-full relative">

                        <div className="space-y-4 sm:space-y-6">
                            {FEATURES.map((feature, index) => (
                                <div key={index} className="flex items-center bg-[#FFF3E8] rounded-full justify-center gap-4 sm:gap-6">
                                    {/* Feature Icon Case */}
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-15 lg:h-15 shrink-0 rounded-full bg-[#F77124] flex items-center justify-center text-white">
                                        <span className="bg-white rounded-full text-[#F77124]">
                                            <CheckIcon className="w-7 h-7 sm:w-9 sm:h-9 lg:w-9 lg:h-9" />
                                        </span>
                                    </div>

                                    {/* Feature Text Case */}
                                    <div className="flex-1 bg-[#FFF3E8] px-4 py-3 sm:py-4">
                                        <h4 className={cn("text-base sm:text-xl md:text-2xl font-bold", "")}>
                                            {feature.title}
                                        </h4>
                                        <p className={cn("text-gray-500 font-medium", "text-xs sm:text-sm font-medium")}>
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
            </div>
        </div>
    );
}
