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
import NewCourseCard from "@/components/ui/NewCourseCard";
import { Course as CourseType } from "@/types";

export default function ProfessionalCoursesSection() {
    const [activeCategory, setActiveCategory] = useState(courseCategories[0]?.name || "Data Science");
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const swiperRef = useRef<any>(null);

    return (
        <div className="relative px-0 sm:px-4 mt-8 sm:mt-12 sm:py-10">
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
            <div className="mt-10 sm:mt-16 pl-8 sm:pl-0">
                <div className="flex flex-col gap-1 mb-6 sm:mb-8">
                    <h2 className={cn("text-xl sm:text-2xl lg:text-4xl font-extrabold leading-tight", "")}>
                        Our <span className="text-[#F77124]">Courses</span> 
                        <br />
                        <span className="font-medium text-base sm:text-xl">(For Working Professionals)</span>
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
                        {courses.map((course) => {
                            // Map static course data to NewCourseCard expected CourseType
                            const mappedCourse: CourseType = {
                                ...course,
                                _id: course.id,
                                isFeatured: course.isBestSeller,
                                plans: {
                                    essential: {
                                        title: "Essential Plan",
                                        type: "essential",
                                        price: course.originalPrice,
                                        features: [],
                                        discount: {
                                            discount: "percentage",
                                            value: course.discount,
                                            isActive: true,
                                        },
                                        isActive: true,
                                    }
                                },
                                analytics: {
                                    averageRating: course.rating,
                                    totalReviews: course.reviewCount,
                                    totalEnrollments: course.enrolledStudents,
                                    activeEnrollments: course.enrolledStudents,
                                    completionRate: 0,
                                    averageCompletionTime: 0,
                                    dropoffPoints: [],
                                    totalRatings: course.reviewCount,
                                }
                            } as any;

                            return (
                                <SwiperSlide key={course.id}>
                                    <NewCourseCard course={mappedCourse} className="h-full" />
                                </SwiperSlide>
                            );
                        })}
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
