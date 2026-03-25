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
        <div className="relative px-40 mt-12 sm:py-10">
            {/* Top Header with Icon */}
            <div className="flex items-center relative gap-4 -translate-x-12 sm:-translate-x-22">
                <TimelineMarkerIcon size="big">
                    <UserCheck className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </TimelineMarkerIcon>
                <div>
                    <h2 className="text-xl sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
                        Know Your Future Managers
                    </h2>
                </div>
            </div>

            {/* Content Area with Swiper Carousel */}
            <div className="mt-16 sm:mt-24 ">
                <div className="flex flex-col gap-1 mb-10">
                    <h2 className={cn("text-xl sm:text-lg lg:text-xl font-semibold leading-tight", "line-clamp-1")}>
                        <span className="text-[#F77124]">Learn</span>{" "}
                        From The People Who{" "}
                        <span className="text-[#F77124]">Hire.</span>
                    </h2>
                </div>
                <div className="max-w-6xl">
                    <Swiper
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                            setActiveSlideIndex(swiper.realIndex);
                        }}
                        modules={[Autoplay]}
                        spaceBetween={32}
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
                                slidesPerView: 2,
                            },
                            1024: {
                                slidesPerView: 3,
                            },
                        }}
                        className="cursor-grab active:cursor-grabbing pb-12"
                    >
                        {managers.map((manager) => (
                            <SwiperSlide key={manager.id}>
                                <div className="bg-white rounded-3xl order border-[#FED7AA] shadow-sm hover:shadow-md transition-shadow px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-12 flex flex-col items-center text-center h-full">
                                    {/* Profile Picture */}
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-6">
                                        <Image
                                            src={manager.profileImage}
                                            alt={manager.name}
                                            width={128}
                                            height={128}
                                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                                        />
                                    </div>

                                    <div className="w-full">
                                        {/* Name + LinkedIn */}
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
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
                                        <p className={cn("text-xs sm:text-sm font-medium", "font-bold text-gray-900 mb-2")}>
                                            {manager.sector}
                                        </p>

                                        {/* Role + Company */}
                                        <p className={cn("text-xs sm:text-sm font-medium", "mb-6")}>
                                            <span className="text-[#F77124] font-semibold">
                                                {manager.roleTitle}
                                            </span>{" "}
                                            <span className="text-gray-600">
                                                at{" "}
                                                <span className="font-bold text-gray-900">
                                                    {manager.companyName}
                                                </span>
                                            </span>
                                        </p>

                                        {/* Bottom company icons row */}
                                        <div className="flex items-center justify-center gap-8 mb-6">
                                            {companyIcons.map((Icon, idx) => (
                                                <div
                                                    key={idx}
                                                    className="text-gray-900"
                                                >
                                                    <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Description */}
                                        <p className={cn("text-xs sm:text-sm font-medium", "text-gray-600 leading-relaxed font-medium line-clamp-3")}>
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
                                        ? "w-4 h-1.5 bg-[#F77124]"
                                        : "w-4 h-1.5 bg-[#FED7AA] hover:bg-[#F77124]/70"
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
