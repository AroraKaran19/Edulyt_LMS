"use client";

import TimelineMarkerIcon from "./TimelineMarkerIcon";
import { UserCheck, MessageSquare, FileText, Star, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const SUPPORT_SERVICES = [
    {
        icon: UserCheck,
        title: "1:1 Mentorship Sessions",
        description: "Personalised support to prepare you for real job opportunities.",
    },
    {
        icon: MessageSquare,
        title: "Mock Interviews",
        description: "Practice real interview scenarios and improve problem-solving skills.",
    },
    {
        icon: FileText,
        title: "Resume & Profile Review",
        description: "Get your resume reviewed by industry experts and improve your job visibility.",
    },
    {
        icon: Star,
        title: "Soft Skills & Career Training",
        description: "Improve communication, confidence, and interview presence.",
    },
];

export default function CareerPrepSection() {
    return (
        <div className="relative px-6 sm:px-10 lg:px-40 mt-8 sm:mt-12 sm:py-10">
            {/* Top Header with Lightbulb Icon */}
            <div className="flex items-center relative gap-4 -translate-x-[22px] sm:-translate-x-22">
                <TimelineMarkerIcon size="big">
                    <Lightbulb className="text-white w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </TimelineMarkerIcon>
                <div >
                    <h2 className="text-base sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
                        Everything You Need to Succeed
                    </h2>
                </div>
            </div>

            {/* Grid of Cards aligned with Timeline */}
            <div className="mt-10 sm:mt-16">
                <div className="flex flex-col gap-1 mt-6 mb-6 sm:mb-8">
                    <h2 className={cn("text-xl sm:text-2xl lg:text-4xl font-extrabold leading-tight", "line-clamp-1 overflow-visible whitespace-normal")}>
                        We Don&apos;t Just Train, We <span className="text-[#f77124]">Prepare You.</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-full sm:max-w-5xl">
                    {SUPPORT_SERVICES.map((service, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-start gap-3 sm:gap-4 p-4  border border-orange-100/50"
                        >
                            <div className="flex bg-[#fff6f1] w-full rounded-full align-center items-center gap-4">

                                <div className="flex shrink-0 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center rounded-full bg-[#f77124] text-white">
                                    <service.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                    <h3 className={cn("text-base sm:text-xl md:text-xl font-semibold")}>{service.title}</h3>
                            </div>
                                <div>
                                    <p className={cn("text-xs sm:text-base font-normal", "text-gray-800 leading-relaxed max-w-prose")}>
                                        {service.description}
                                    </p>
                                </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
