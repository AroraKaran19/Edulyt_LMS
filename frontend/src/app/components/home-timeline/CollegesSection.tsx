"use client";

import React, { useMemo, useRef, useState } from "react";
import { Shield } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { collegesCarousel } from "@/constants/internshipData";
import CollegeCard from "@/app/(pages)/internships/components/CollegeCard";
import { cn } from "@/lib/utils";



export default function CollegesSection() {
  const swiperRef = useRef<{ slideToLoop: (index: number) => void } | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [perSlide, setPerSlide] = useState(6);

  React.useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      // Show 1 card on mobile/tablet (< 1024px) and 6 on desktop
      setPerSlide(window.innerWidth < 1024 ? 1 : 6);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const slides = useMemo(() => {
    if (!isMounted) return [];
    const out: typeof collegesCarousel[] = [];
    for (let i = 0; i < collegesCarousel.length; i += perSlide) {
      out.push(collegesCarousel.slice(i, i + perSlide));
    }
    return out;
  }, [perSlide, isMounted]);

  if (!isMounted) return null;

  return (
    <section
      className="relative px-4 sm:px-10 lg:px-40 mt-8 sm:mt-12 sm:py-10"
      aria-label="Colleges our students come from"
    >
      <div>
        {/* Shield + "Trusted by Students from Top Institutions" */}
        <div className="flex items-center relative gap-4 -translate-x-6 sm:-translate-x-22">
          <Shield
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full px-2 py-2 text-white shrink-0 bg-[#F77124]"
            aria-hidden
          />
          <h3 className="text-base sm:text-xl md:text-xl relative md:left-7 font-semibold text-gray-800">
            Trusted by Students from Top Institutions
          </h3>
        </div>

        {/* Title and Heading */}
        <div className="flex flex-col gap-1 mt-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
            <span className="text-[#F77124]">Colleges our</span>{" "}
            <span className="text-gray-900">students comes from</span>
          </h2>
        </div>

        {/* Description */}
        <p className="text-black text-xs sm:text-sm lg:text-base mt-6 max-w-4xl mb-6 sm:mb-8">
          Students from diverse academic backgrounds and leading colleges have
          joined our internship to gain real industry experience and practical
          skills. Here are some of the institutes our past interns come from.
        </p>
      </div>

      {/* Grid of college cards (Swiper: 6 per slide, 3x2 grid on desktop, 1 per slide on mobile) */}
      <div className="max-w-full sm:max-w-6xl">
        <Swiper
          key={perSlide} // Re-initialize Swiper when chunk size changes
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setActiveSlideIndex(swiper.realIndex);
          }}
          modules={[Autoplay]}
          spaceBetween={16}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          onSlideChange={(swiper) => setActiveSlideIndex(swiper.realIndex)}
        >
          {slides.map((slideColleges, slideIdx) => (
            <SwiperSlide key={slideIdx}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 p-2">
                {slideColleges.map((college) => (
                  <CollegeCard key={college.id} college={college} />
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Pagination + Show all */}
        <div className="mt-4 sm:mt-6 flex items-center justify-between">
          <div className="flex justify-center items-center gap-2 flex-1 flex-wrap">
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
                    ? "w-4 sm:w-6 lg:w-8 h-1.5 sm:h-2 bg-[#F77124]"
                    : "w-2 sm:w-3 lg:w-4 h-1.5 sm:h-2 bg-[#FED7AA] hover:bg-[#F77124]/70"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="text-[#F77124] font-semibold cursor-pointer text-xs sm:text-sm underline underline-offset-4 shrink-0"
          >
            Show all
          </button>
        </div>
      </div>
    </section>
  );
}
