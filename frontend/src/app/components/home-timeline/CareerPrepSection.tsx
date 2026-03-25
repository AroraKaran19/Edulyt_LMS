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
        <div className="relative px-40 mt-12 sm:py-10">
            {/* Top Header with Lightbulb Icon */}
            <div className="flex items-center relative gap-4 -translate-x-12 sm:-translate-x-22">
                <TimelineMarkerIcon size="big">
                    <Lightbulb className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </TimelineMarkerIcon>
                <div >
                    <h2 className="text-xl sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
                        Everything You Need to Succeed
                    </h2>
                </div>
            </div>

            {/* Grid of Cards aligned with Timeline */}
            <div className="mt-16 sm:mt-24">
                <div className="flex flex-col gap-1 mb-8">
                    <h2 className={cn("text-xl sm:text-lg lg:text-xl font-semibold leading-tight", "line-clamp-1")}>
                        We Don&apos;t Just Train, We <span className="text-[#F39200]">Prepare You.</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                    {SUPPORT_SERVICES.map((service, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-4 p-6 rounded-3xl bg-[#FFF8F3] border border-orange-100/50 hover:shadow-md transition-shadow"
                        >
                            <div className="flex shrink-0 w-12 h-12 items-center justify-center rounded-full bg-[#F39200] text-white">
                                <service.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={cn("text-lg sm:text-xl md:text-2xl font-bold", "mb-2")}>{service.title}</h3>
                                <p className={cn("text-xs sm:text-sm font-medium", "text-gray-500 leading-relaxed font-semibold max-w-prose")}>
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
