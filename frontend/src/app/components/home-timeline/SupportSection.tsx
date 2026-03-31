"use client";

import TimelineMarkerIcon from "./TimelineMarkerIcon";
import { cn } from "@/lib/utils";

const SUPPORT_FEATURES = [
    {
        title: "Instant 1:1 doubt support",
        highlight: "1:1",
        description: "Get personalised guidance through live sessions, chat support, and expert mentorship to solve your doubts quickly and effectively.",
    },
    {
        title: "200+ Mentors helping learners grow faster",
        highlight: "200+ Mentors",
        description: "Get personalised guidance through live sessions, chat support, and expert mentorship to solve your doubts quickly and effectively.",
    },
    {
        title: "5/5 satisfaction rating from our students",
        highlight: "5/5",
        description: "Get personalised guidance through live sessions, chat support, and expert mentorship to solve your doubts quickly and effectively.",
    },
];

export default function SupportSection() {
    return (
        <div className="relative px-4 sm:px-10 lg:px-40 mt-8 sm:mt-12 sm:py-10">
            {/* Top Header with Icon */}
            <div className="flex items-center relative gap-4 -translate-x-5 sm:-translate-x-22">
                <TimelineMarkerIcon size="big">
                    <span className="text-white text-base sm:text-xl font-bold">?</span>
                </TimelineMarkerIcon>
                <div className="mt-1">
                    <h2 className="text-base sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
                        We are Always here for your help with
                    </h2>
                </div>
            </div>

            <div className="mt-10 sm:mt-16">
                {/* Content Area with Vertical Dotted Line Alignment */}
                <div className="mt-4 space-y-6 sm:space-y-8 ">
                    {SUPPORT_FEATURES.map((feature, index) => {
                        const parts = feature.title.split(feature.highlight);
                        return (
                            <div key={index} className="flex flex-col gap-2">
                                <h3 className="text-xl sm:text-2xl lg:text-4xl font-extrabold leading-tight">
                                    {parts[0]}
                                    <span className="text-[#f77124]">{feature.highlight}</span>
                                    {parts[1]}
                                </h3>
                                <p className={cn("max-w-prose max-w-md text-gray-700 leading-relaxed font-semibold", "text-xs sm:text-sm font-medium")}>
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
