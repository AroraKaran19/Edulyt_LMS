"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { cn } from "@/lib/utils";
import { internshipFeatures } from "@/constants/internshipData";

const RX_LOGO = "/assets/internships/RX-logo.svg";

const InternshipFeaturesCarousel = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const swiperRef = useRef<{ slideToLoop: (index: number) => void } | null>(null);

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 mt-12 sm:mt-16 lg:mt-24">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
          <span className="text-[#F77124] font-extrabold">Internship</span>{" "}
          <span className="text-gray-900 font-extrabold">Features</span>
        </h2>
        <p className="text-black text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2">
          Discover how this internship helps you grow through hands-on learning
          and industry exposure.
        </p>
      </div>

      <div className="mt-8 sm:mt-12">
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
              slidesPerView: 4,
              spaceBetween: 24,
            },
          }}
          className="internship-features-swiper"
        >
          {internshipFeatures.map((feature, index) => (
              <SwiperSlide key={index}>
                <div className="relative rounded-2xl sm:rounded-3xl p-0.5 bg-linear-to-r from-[#F77124]/20 via-[#F77124]/60 to-[#F77124] h-full">
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 h-full">
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <Image
                        src={RX_LOGO}
                        alt={feature.title}
                        width={42}
                        height={42}
                        className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
                      />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#F77124] mb-2 sm:mb-3 line-clamp-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 line-clamp-4">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-6 sm:mt-8">
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
                  ? "w-6 sm:w-8 h-1.5 sm:h-2 bg-[#F77124]"
                  : "w-3 sm:w-4 h-1.5 sm:h-2 bg-[#FED7AA] hover:bg-[#F77124]/70"
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

