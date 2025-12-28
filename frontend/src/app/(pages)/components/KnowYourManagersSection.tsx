"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { managers } from "@/constants/internshipData";
import { cn } from "@/lib/utils";
import { Facebook, Twitter, Github, Globe } from "lucide-react";

const KnowYourManagersSection = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const swiperRef = useRef<{ slideToLoop: (index: number) => void } | null>(
    null
  );

  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24 bg-white py-12">
      {/* Title Section */}
      <div className="text-center mb-8 max-w-4xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-gray-900 font-extrabold">Know Your</span>{" "}
          <span className="text-[#F77124] font-extrabold">Future Managers</span>
        </h2>
        <p className="text-black text-base lg:text-lg mt-4">
          Learn from experienced industry experts and seasoned mentor
        </p>
      </div>

      {/* Managers Carousel */}
      <div className="max-w-7xl mx-auto">
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setActiveSlideIndex(swiper.realIndex);
          }}
          modules={[Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          loop={managers.length > 4}
          grabCursor={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          onSlideChange={(swiper) => {
            setActiveSlideIndex(swiper.realIndex);
          }}
          breakpoints={{
            640: {
              slidesPerView: 3,
              loop: managers.length > 3,
            },
            1024: {
              slidesPerView: 4,
              loop: managers.length > 4,
            },
          }}
          className="managers-swiper cursor-grab active:cursor-grabbing"
        >
          {managers.map((manager, index) => (
            <SwiperSlide key={manager.id}>
              <div className="bg-white rounded-lg p-4 m-2 shadow-md border border-gray-200 hover:shadow-lg transition-shadow h-full">
                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-full h-52 rounded-lg overflow-hidden">
                    <Image
                      src={manager.profileImage}
                      alt={manager.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-gray-900 text-left">
                  {manager.name}
                </h3>

                {/* Title */}
                <p className="text-sm text-black font-medium text-left mb-2">
                  {manager.title}
                </p>

                {/* Description */}
                <p className="text-sm text-black text-left mb-4 line-clamp-3">
                  {manager.description}
                </p>

                {/* Social Media Icons */}
                <div className="flex justify-start items-center gap-3">
                  <a
                    href={manager.socialLinks.facebook}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href={manager.socialLinks.twitter}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href={manager.socialLinks.github}
                    className="text-gray-400 hover:text-gray-900 transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href={manager.socialLinks.linkedin}
                    className="text-gray-400 hover:text-blue-700 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-8">
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
                  : "w-4 h-2 bg-gray-300 hover:bg-[#F77124]/70"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowYourManagersSection;

