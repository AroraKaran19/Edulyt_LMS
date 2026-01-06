"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { learnerStatistics, learnerTestimonials } from "@/constants/internshipData";
import { cn } from "@/lib/utils";

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

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-10 sm:mb-16">
        {learnerStatistics.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-200 hover:shadow-md transition-shadow"
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
        {/* Gradient Overlay Wrapper */}
        <div className="relative">
          {/* Left Gradient Fade */}
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 lg:w-52 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          
          {/* Right Gradient Fade */}
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 lg:w-52 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          {/* Swiper Slider */}
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
                <div
                  className={cn(
                    "rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border m-1 transition-all relative overflow-hidden h-full",
                    index === (activeSlideIndex + 1) % learnerTestimonials.length
                      ? "bg-white border-[#F77124] shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] border-2"
                      : "bg-white/70 backdrop-blur-md border-gray-200 shadow-lg"
                  )}
                >
                  {/* Profile Section */}
                  <div className="flex flex-col items-center mb-4 sm:mb-6">
                    {/* Profile Picture */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 sm:mb-4">
                      <Image
                        src={testimonial.profileImage}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Name */}
                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-1">
                      {testimonial.name}
                    </h3>

                    {/* Course */}
                    <p className="text-xs text-gray-600 mb-2">
                      {testimonial.course}
                    </p>

                    {/* Role */}
                    <p className="text-sm sm:text-base mt-3 sm:mt-4 text-gray-900 mb-2">
                      {testimonial.role}
                    </p>

                    {/* Company */}
                    <p className="text-lg sm:text-xl text-center text-black font-extrabold mb-3 sm:mb-4">
                      {testimonial.company}
                    </p>

                    {/* Career Progression Arrow */}
                    <div className="flex flex-col items-center w-full mb-3 sm:mb-4">
                      <div className="relative flex flex-col items-center mb-2">
                        <svg
                          className="w-5 h-10 sm:w-6 sm:h-12"
                          viewBox="0 0 24 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 0 L12 40"
                            stroke="#F77124"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                          />
                          <path
                            d="M12 40 L6 34 M12 40 L18 34"
                            stroke="#F77124"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className="bg-[#F771241A] rounded-full p-2 sm:p-3 w-full border flex flex-col items-center justify-center border-gray-200">
                        <p className="text-sm sm:text-base text-gray-900 text-center mb-1 sm:mb-2">
                          {testimonial.role}
                        </p>
                        <p className="text-lg sm:text-xl text-black font-extrabold text-center">
                          {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-center line-clamp-6 min-h-24 sm:min-h-32">
                    {testimonial.testimonial}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>


      </div>
    </div>
  );
};

export default LearnersTestimonialsSection;
