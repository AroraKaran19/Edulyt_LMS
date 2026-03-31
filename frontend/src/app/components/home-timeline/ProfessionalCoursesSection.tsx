"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { courses, courseCategories } from "@/constants/internshipData";
import { cn } from "@/lib/utils";
import TimelineMarkerIcon from "./TimelineMarkerIcon";
import { MousePointerClick, Star, ChevronRight } from "lucide-react";
import { PrimaryButton } from "../ui/PrimaryButton";

export default function ProfessionalCoursesSection() {
    const [activeCategory, setActiveCategory] = useState(courseCategories[0]?.name || "Data Science");
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const swiperRef = useRef<any>(null);

    return (
        <div className="relative px-6 sm:px-10 lg:px-40 mt-8 sm:mt-12 sm:py-10">
            {/* Top Header with Icon */}
            <div className="flex items-center relative gap-4 -translate-x-[22px] sm:-translate-x-22">
                <TimelineMarkerIcon size="big">
                    <MousePointerClick className="text-white w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </TimelineMarkerIcon>
                <div >
                    <h2 className="text-base sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
                        Switch to Tech with Industry-Focused Programs
                    </h2>
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-10 sm:mt-16">
                <div className="flex flex-col gap-1 mb-6 sm:mb-8">
                    <h2 className={cn("text-xl sm:text-2xl lg:text-4xl font-extrabold leading-tight", "line-clamp-1")}>
                        Our <span className="text-[#F77124]">Courses</span> (For Working Professionals)
                    </h2>
                </div>
                {/* Category Filter */}
                <div className="mb-6 sm:mb-8 max-w-full sm:max-w-6xl">
                    <div className="bg-[#F66F221F] scrollbar-hide rounded-full flex items-center justify-between border border-orange-100 shadow-sm overflow-x-auto relative pr-10 sm:pr-12">
                        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto ">
                            {courseCategories.map((cat) => (
                                <button
                                    key={cat.name}
                                    onClick={() => setActiveCategory(cat.name)}
                                    className={cn(
                                        "px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-[15px] transition-all whitespace-nowrap",
                                        activeCategory === cat.name
                                            ? "bg-linear-to-b from-[#F5891D] to-[#F5691D] text-white"
                                            : "text-gray-700"
                                    )}
                                >
                                    {cat.name} <span className={cn("ml-1 font-medium", activeCategory === cat.name ? "text-white/80" : "text-gray-400")}>{cat.count}</span>
                                </button>
                            ))}
                        </div>
                        <button className="absolute right-1 sm:right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F77124] flex items-center justify-center text-white shadow-md z-10">
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>

                {/* Carousel */}
                <div className="max-w-full sm:max-w-6xl relative">
                    <Swiper
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                            setActiveSlideIndex(swiper.realIndex);
                        }}
                        modules={[Autoplay, Navigation]}
                        spaceBetween={32}
                        slidesPerView={1}
                        loop={courses.length > 3}
                        autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                        }}
                        onSlideChange={(swiper) => {
                            setActiveSlideIndex(swiper.realIndex);
                        }}
                        breakpoints={{
                            640: {
                                slidesPerView: 1,
                            },
                            768: {
                                slidesPerView: 2,
                            },
                            1280: {
                                slidesPerView: 3,
                            },
                        }}
                        className="pb-16"
                    >
                        {courses.map((course) => (
                            <SwiperSlide key={course.id}>
                                <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#FED7AA] overflow-hidden group hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                                    {/* Thumbnail & Badge */}
                                    <div className="relative aspect-video overflow-hidden">
                                        <Image
                                            src={course.thumbnail}
                                            alt={course.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                        />
                                        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-[#F77124] text-white text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg">
                                            {course.discount}% off
                                        </div>
                                        {course.isBestSeller && (
                                            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-white/95 backdrop-blur-sm border border-orange-200 p-1.5 sm:p-2 rounded-xl shadow-lg">
                                                <p className="text-[9px] sm:text-[10px] font-bold text-[#F77124] uppercase tracking-wider">Best seller</p>
                                                <p className="text-[8px] sm:text-[9px] text-gray-500 font-medium">(enrolled by {(course.enrolledStudents / 1000).toFixed(0)}k students)</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 sm:p-6 flex flex-col flex-1">
                                        <h3 className={cn("text-base sm:text-xl md:text-2xl font-bold", "mb-3 line-clamp-2 min-h-12 sm:min-h-14")}>
                                            {course.title}
                                        </h3>

                                        {(course.rating > 0 || course.reviewCount > 0) && (
                                            <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6">
                                                {course.rating > 0 && (
                                                    <div className="flex items-center gap-0.5 sm:gap-1 bg-[#22C55E] text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold">
                                                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                                                        {course.rating.toFixed(1)} Rating
                                                    </div>
                                                )}
                                                {course.reviewCount > 0 && (
                                                    <span className="text-[10px] sm:text-xs text-gray-400 font-bold">
                                                        {(course.reviewCount / 1000).toFixed(0)}k Ratings
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-auto flex items-center justify-between gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
                                            <div className="flex items-baseline gap-1 sm:gap-2">
                                                <span className={cn("text-gray-400 line-through", "text-xs sm:text-sm font-medium")}>₹{course.originalPrice}</span>
                                                <span className={cn("font-extrabold text-gray-900", "text-base sm:text-lg md:text-xl lg:text-2xl font-bold")}>₹{course.currentPrice}</span>
                                            </div>
                                            <PrimaryButton size="sm">
                                                Enroll Now
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Dots */}
                    <div className="flex justify-center items-center gap-2 mt-2">
                        {courses.slice(0, Math.ceil(courses.length / 2)).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => swiperRef.current?.slideToLoop(index * 2)}
                                className={cn(
                                    "transition-all duration-300 rounded-full",
                                    activeSlideIndex === index * 2
                                        ? "w-4 h-1.5 bg-[#F77124]"
                                        : "w-4 h-1.5 bg-[#FED7AA] hover:bg-[#F77124]/70"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
