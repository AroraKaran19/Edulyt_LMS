"use client";

import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { cn } from "@/lib/utils";
import { internshipFeatures } from "@/constants/internshipData";

const InternshipFeaturesCarousel = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const swiperRef = useRef<any>(null);

  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24">
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-[#F77124]">Internship</span>{" "}
          <span className="text-gray-900">Features</span>
        </h2>
        <p className="text-gray-600 text-base lg:text-lg max-w-3xl mx-auto">
          Discover how this internship helps you grow through hands-on learning
          and industry exposure.
        </p>
      </div>

      <div className="mt-12">
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
              slidesPerView: 4,
            },
          }}
          className="internship-features-swiper"
        >
          {internshipFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <SwiperSlide key={index}>
                <div className="bg-white rounded-2xl p-6 border border-[#F77124] hover:shadow-lg transition-shadow h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-[#F77124] p-3 rounded-xl">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#F77124] mb-3 line-clamp-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-3">
                    {feature.description}
                  </p>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Custom Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {internshipFeatures.map((_, index) => (
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

export default InternshipFeaturesCarousel;

