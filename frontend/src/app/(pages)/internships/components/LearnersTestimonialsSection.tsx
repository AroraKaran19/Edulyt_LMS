"use client";

import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { learnerStatistics, learnerTestimonials } from "@/constants/internshipData";
import LearnerCareerCard from "./LearnerCareerCard";

const LearnersTestimonialsSection = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const swiperRef = useRef<{ slideToLoop: (index: number) => void } | null>(null);

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 mt-12 sm:mt-16 lg:pt-16 bg-white">
      {/* Title Section */}
      <div className="text-center mb-8 sm:mb-12 max-w-md mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 font-coolvetica">
          <span className="text-gray-900 font-extrabold">Our learners</span>{" "}
          <span className="text-[#F77124] font-extrabold">transformed</span>{" "}
          <span className="text-gray-900 font-extrabold">their careers</span>
        </h2>
      </div>

      {/* Statistics Cards - inline, not reused */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-10 sm:mb-16">
        {learnerStatistics.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-4 sm:p-4 border-2 border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm lg:text-base text-gray-700 text-center">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Testimonials Slider Section */}
      <div className="w-full mx-auto relative">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 lg:w-52 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 lg:w-52 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

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
            onSlideChange={(swiper) => {
              setActiveSlideIndex(swiper.realIndex);
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
            }}
            className="learners-testimonials-swiper"
          >
            {learnerTestimonials.map((testimonial, index) => (
              <SwiperSlide key={index}>
                <LearnerCareerCard
                  item={testimonial}
                  showTestimonial={true}
                  isHighlighted={
                    index === (activeSlideIndex + 1) % learnerTestimonials.length
                  }
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default LearnersTestimonialsSection;
