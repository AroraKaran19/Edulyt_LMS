"use client";

import React, { useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { collegesCarousel } from "@/constants/internshipData";
import { cn } from "@/lib/utils";
import CollegeCard from "./CollegeCard";
 
 const CollegesSection = () => {
  const swiperRef = useRef<{ slideToLoop: (index: number) => void } | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const slides = useMemo(() => {
    const perSlide = 6;
    const out: typeof collegesCarousel[] = [];
    for (let i = 0; i < collegesCarousel.length; i += perSlide) {
      out.push(collegesCarousel.slice(i, i + perSlide));
    }
    return out;
  }, []);

   return (
     <div className="px-4 sm:px-6 lg:px-8 xl:px-12 mt-12 sm:mt-16 lg:pt-12 bg-white py-8 sm:py-12">
      {/* Title Section */}
      <div className="text-center mb-6 sm:mb-10">
         <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 max-w-md mx-auto">
           <span className="text-[#F77124] font-extrabold">Colleges our</span>{" "}
           <span className="text-gray-900 font-extrabold">students</span>{" "}
           <span className="text-gray-900 font-extrabold">comes from</span>
         </h2>
         <p className="text-black text-sm sm:text-base lg:text-lg mt-2 sm:mt-3 max-w-4xl mx-auto">
           Students from diverse academic backgrounds and leading colleges have
           joined our internship to gain real industry experience and practical
           skills. Here are some of the institutes our past interns come from.
         </p>
       </div>
 
      {/* Colleges Slider */}
      <div className="max-w-6xl mx-auto">
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
            delay: 3500,
            disableOnInteraction: false,
          }}
          onSlideChange={(swiper) => {
            setActiveSlideIndex(swiper.realIndex);
          }}
        >
          {slides.map((slideColleges, slideIdx) => (
            <SwiperSlide key={slideIdx}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 p-2">
                {slideColleges.map((college) => (
                  <CollegeCard key={college.id} college={college} />
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Pagination + Show all */}
        <div className="mt-6 sm:mt-8 flex items-center justify-between">
          <div className="flex justify-center items-center gap-2 flex-1">
            {slides.map((_, index) => (
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
          <button className="text-[#F77124] font-semibold cursor-pointer text-sm sm:text-base underline underline-offset-4">
            Show all
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollegesSection;
