"use client";

import { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { learnerTestimonials } from "@/constants/internshipData";
import LearnerCareerCard from "@/app/(pages)/internships/components/LearnerCareerCard";
import { cn } from "@/lib/utils";
import { FaHeart } from "react-icons/fa";

const TABS = [
  { id: "students", label: "Students" },
  { id: "working", label: "Working Professionals" },
  { id: "internships", label: "Internships" },
] as const;

export default function TestimonialsSection() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("students");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const swiperRef = useRef<{ slideToLoop: (index: number) => void } | null>(null);

  return (
    <section className="relative px-40 mt-12 sm:py-10" aria-label="Hear from our past students">
      <div >
        {/* Title: heart + "Hear from our past students" */}
        <div className="flex items-center relative gap-4 -translate-x-12 sm:-translate-x-22">
          <FaHeart
            className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F77124] text-white p-2 rounded-full shrink-0 shadow-lg "
            aria-hidden
          />
          <span className="text-xl sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
            Hear from our past students
          </span>
        </div>

        {/* Headline with orange highlights */}
        <div className="flex flex-col gap-1 mt-10 mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
            Students who started{" "}
            <span className="text-[#F77124]">just like you</span> are now placed in{" "}
            <span className="text-[#F77124]">leading companies.</span>
          </h2>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex scroll-x-auto bg-white justify-between w-3/4 mb-8 sm:mb-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium transition-colors",
              "text-xs sm:text-sm font-medium",
              activeTab === tab.id
                ? "bg-linear-to-b from-[#F5891D] to-[#F5691D]  text-white"
                : " text-gray-700 "
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards carousel - only reused component is LearnerCareerCard */}
      <div className="w-full relative">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 lg:w-28 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 lg:w-28 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />

          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setActiveSlideIndex(swiper.realIndex);
            }}
            modules={[Autoplay]}
            spaceBetween={16}
            slidesPerView={1}
            loop={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            onSlideChange={(swiper) => setActiveSlideIndex(swiper.realIndex)}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
            }}
            className="learners-testimonials-swiper"
          >
            {learnerTestimonials.map((testimonial, index) => (
              <SwiperSlide key={index}>
                <LearnerCareerCard
                  item={testimonial}
                  showTestimonial={false}
                  isHighlighted={
                    index === (activeSlideIndex + 1) % learnerTestimonials.length
                  }
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
