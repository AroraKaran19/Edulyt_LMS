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
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24 bg-white">
      {/* Title Section */}
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-gray-900">Our learners</span>{" "}
          <span className="text-[#F77124]">transformed</span>{" "}
          <span className="text-gray-900">their careers</span>
        </h2>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16">
        {learnerStatistics.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg flex flex-col items-center justify-center p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
              {stat.value}
            </div>
            <div className="text-sm lg:text-base text-gray-700">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Testimonials Slider Section */}
      <div className="max-w-5xl mx-auto relative">
        {/* Gradient Overlay Wrapper */}
        <div className="relative">
          {/* Left Gradient Fade */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          
          {/* Right Gradient Fade */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          {/* Swiper Slider */}
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setActiveSlideIndex(swiper.realIndex);
            }}
            modules={[Autoplay]}
            spaceBetween={24}
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
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            className="learners-testimonials-swiper"
          >
            {learnerTestimonials.map((testimonial, index) => (
              <SwiperSlide key={index}>
                <div
                  className={cn(
                    "rounded-lg p-6 border transition-all relative overflow-hidden h-full",
                    index === (activeSlideIndex + 1) % learnerTestimonials.length
                      ? "bg-white border-[#F77124] border-2 shadow-lg"
                      : "bg-white/70 backdrop-blur-md border-gray-200 hover:shadow-md"
                  )}
                >
                  {/* Profile Section */}
                  <div className="flex flex-col items-center mb-6">
                    {/* Profile Picture */}
                    <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4">
                      <Image
                        src={testimonial.profileImage}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Name */}
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {testimonial.name}
                    </h3>

                    {/* Course */}
                    <p className="text-sm text-gray-600 mb-2">
                      {testimonial.course}
                    </p>

                    {/* Role */}
                    <p className="text-base font-semibold text-gray-900 mb-2">
                      {testimonial.role}
                    </p>

                    {/* Company */}
                    <p className="text-base font-bold text-gray-900 mb-4">
                      {testimonial.company}
                    </p>

                    {/* Career Progression Arrow */}
                    <div className="flex flex-col items-center w-full mb-4">
                      <div className="relative flex flex-col items-center mb-2">
                        <svg
                          className="w-6 h-12"
                          viewBox="0 0 24 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 0 L12 40"
                            stroke="#9CA3AF"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                          />
                          <path
                            d="M12 40 L6 34 M12 40 L18 34"
                            stroke="#9CA3AF"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 w-full border flex flex-col items-center justify-center border-gray-200">
                        <p className="text-sm text-gray-900 font-semibold text-center">
                          {testimonial.role}
                        </p>
                        <p className="text-xs text-gray-600 font-bold text-center">
                          {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-6 min-h-36">
                    {testimonial.testimonial}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Custom Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {learnerTestimonials.map((_, index) => (
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
                  : "w-2 h-2 bg-[#FED7AA] hover:bg-[#F77124]/70"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearnersTestimonialsSection;

