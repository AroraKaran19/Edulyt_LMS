"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { managers } from "@/constants/internshipData";
import { cn } from "@/lib/utils";
import TimelineMarkerIcon from "./TimelineMarkerIcon";
import { UserCheck } from "lucide-react";
import { SiDell } from "react-icons/si";
import { FaAmazon, FaApple } from "react-icons/fa";

const companyIcons = [SiDell, FaAmazon, FaApple];

export default function ManagersSection() {
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const swiperRef = useRef<{ slideToLoop: (index: number) => void } | null>(
        null
    );

    return (
        <div className="relative px-4 sm:px-10 lg:px-40 mt-8 sm:mt-12 sm:py-10">
            {/* Top Header with Icon */}
            <div className="flex items-center relative gap-4 -translate-x-6 sm:-translate-x-22">
                <TimelineMarkerIcon size="big">
                    <UserCheck className="text-white w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </TimelineMarkerIcon>
                <div>
                    <h2 className="text-base sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
                        Know Your Future Managers
                    </h2>
                </div>
            </div>

            {/* Content Area with Swiper Carousel */}
            <div className="mt-10 sm:mt-16 ">
                <div className="flex flex-col gap-1 mb-6 sm:mb-8">
                    <h2 className={cn("text-lg sm:text-lg lg:text-4xl font-extrabold leading-tight", "line-clamp-1")}>
                        <span className="text-[#F77124]">Learn</span>{" "}
                        From The People Who{" "}
                        <span className="text-[#F77124]">Hire.</span>
                    </h2>
                </div>
                <div className="max-w-full sm:max-w-6xl">
                    <Swiper
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                            setActiveSlideIndex(swiper.realIndex);
                        }}
                        modules={[Autoplay]}
                        spaceBetween={48}
                        slidesPerView={1}
                        loop={managers.length > 3}
                        autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                        }}
                        onSlideChange={(swiper) => {
                            setActiveSlideIndex(swiper.realIndex);
                        }}
                        breakpoints={{
                            768: {
                                slidesPerView: 3,
                            },
                        }}
                        className="cursor-grab active:cursor-grabbing pb-12"
                    >
                        {managers.map((manager) => (
                            <SwiperSlide key={manager.id}>
                                <div className="bg-white rounded-4xl border-2 border-[#F77124] shadow-[0_0_0_3px_rgba(247,113,36,0.18)] px-6 pt-10 pb-8 sm:px-8 sm:pt-10 sm:pb-10 flex flex-col items-center text-center h-full">
                                    {/* Profile Picture */}
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#FFE4D4] overflow-hidden bg-gray-200 shadow-[0_10px_25px_rgba(0,0,0,0.12)] mx-auto mb-4">
                                        <Image
                                            src={manager.profileImage}
                                            alt={manager.name}
                                            width={112}
                                            height={112}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="w-full">
                                        {/* Name + LinkedIn */}
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
                                                {manager.name}
                                            </h3>
                                            {manager.linkedinUrl && (
                                                <div className="shrink-0 inline-flex items-center justify-center w-7 h-7">
                                                    <Image
                                                        src="/assets/LinkedIn.svg"
                                                        alt="LinkedIn"
                                                        width={24}
                                                        height={24}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Sector */}
                                        <p className="text-sm sm:text-lg font-medium text-black mb-2">
                                            {manager.sector}
                                        </p>

                                        {/* Role + Company */}
                                        <p className="text-sm sm:text-base mb-3">
                                            <span className="text-[#F77124] font-semibold">
                                                {manager.roleTitle}
                                            </span>{" "}
                                            <span className="text-black">
                                                at{" "}
                                                <span className="font-semibold">
                                                    {manager.companyName}
                                                </span>
                                            </span>
                                        </p>

                                        {/* Bottom company icons row */}
                                        <div className="flex items-center justify-center gap-6 mb-4">
                                            {companyIcons.map((Icon, idx) => (
                                                <div
                                                    key={idx}
                                                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-700"
                                                >
                                                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs sm:text-sm text-black leading-relaxed">
                                            {manager.description}
                                        </p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Custom Pagination Dots */}
                    <div className="flex justify-center items-center gap-2 mt-4">
                        {managers.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (swiperRef.current) {
                                        swiperRef.current.slideToLoop(index);
                                    }
                                }}
                                className={cn(
                                    "transition-all duration-300 rounded-full cursor-pointer",
                                    activeSlideIndex === index
                                        ? "w-8 h-2 bg-[#F77124]"
                                        : "w-4 h-2 bg-[#FED7AA] hover:bg-[#F77124]/70"
                                )}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
