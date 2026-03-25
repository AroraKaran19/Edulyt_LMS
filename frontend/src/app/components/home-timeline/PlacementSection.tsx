"use client";

import React from "react";
import TimelineMarkerIcon from "./TimelineMarkerIcon";
import { Plane, CheckIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import TimelineSectionsWrapper from "./TimelineSectionsWrapper";
import { PrimaryButton } from "../ui/PrimaryButton";

const BENEFITS = [
    "Get Placed In Top Companies",
    "Earn A Higher Salary",
    "Break Into Tech With Confidence",
    "Accelerate Your Career Growth",
];

export default function PlacementSection() {
    return (
        <div className="relative px-40 mt-12 sm:py-10">
            {/* Top Header with Icon */}
            <div className="flex items-center relative gap-4 -translate-x-12 sm:-translate-x-22">
                <TimelineMarkerIcon size="big">
                    <Plane className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </TimelineMarkerIcon>
                <div className="sm:ml-">
                    <h2 className="text-xl sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
                        Land in your Dream Job
                    </h2>
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-16 sm:mt-14 flex gap-16 ">
                <div className="">
                    <div className="flex flex-col gap-1  mb-10">
                        <h2 className="text-xl sm:text-lg lg:text-xl font-semibold leading-tight">
                            A structured path from <span className="text-[#F77124]">Learning</span><br />
                            to <span className="text-[#F77124]">Placement.</span>
                        </h2>
                    </div>

                    {/* Left Side: Benefits & CTA */}
                    <div className="flex-1 w-full space-y-6 ">
                        <TimelineSectionsWrapper className="md:ml-10">
                            <div className="space-y-4 ml-2 md:-ml-8">
                                {BENEFITS.map((benefit, index) => (
                                    <div key={index} className="flex items-center gap-4 group">
                                        <div className="w-8 h-8 shrink-0 rounded-full bg-[#F77124] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110">
                                            <span className="bg-white rounded-full text-[#F77124]">
                                                <CheckIcon className="w-5 h-5" />
                                            </span>
                                        </div>
                                        <div className="flex-1 bg-[#FFF7F0] px-6 py-4 rounded-full border border-orange-100/50 shadow-sm transition-shadow hover:shadow-md">
                                            <p className={cn("font-bold text-gray-800", "text-xs sm:text-sm font-medium")}>
                                                {benefit}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TimelineSectionsWrapper>

                        <div className="pt-6">
                            <PrimaryButton size="md">
                                Get Started Now
                            </PrimaryButton>
                        </div>
                    </div>

                </div>
                {/* Right Side: Image Placeholder */}
                <div className="flex-1 w-full lg:max-w-2xl h-[450px] bg-gray-50 rounded-4xl border-2 border-dashed border-gray-200 relative overflow-hidden group shadow-inner">
                    <div className="w-1/4 h-full bg-white blur-3xl absolute"></div>
                    <div className="w-1/4 h-full right-0 bg-white blur-3xl absolute"></div>
                    <Image
                        src="/assets/placement-path.png"
                        alt="Placement Path"
                        width={1000}
                        height={1000}
                        className="w-full h-full object-contain"
                    />

                </div>
            </div>
        </div>
    );
}
