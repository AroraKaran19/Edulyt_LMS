"use client";
import React, { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { CourseCardProps } from "@/types";
import CourseCard from "./CourseCard";
import { cn } from "@/lib/utils";
import type { Swiper as SwiperType } from "swiper";

const CoursesCarousel = ({ courses }: { courses: CourseCardProps[] }) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slidesPerView, setSlidesPerView] = useState(1);

  const totalSlides = courses.length * 4;
  
      const getThumbWidth = () => {
      const visibleRatio = slidesPerView / totalSlides;
      const scrollbarWidth = 600; // Total scrollbar width
      const padding = 8; // p-1 = 4px on each side = 8px total
      const availableWidth = scrollbarWidth - padding;
      const minWidth = 60; 
      const maxWidth = 200;
      const calculatedWidth = Math.max(minWidth, Math.min(maxWidth, visibleRatio * availableWidth));
      return `${calculatedWidth}px`;
    };

  // Handle global mouse events for drag functionality
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !swiperRef.current || !scrollbarRef.current) return;
      
      const rect = scrollbarRef.current.getBoundingClientRect();
      const clickPosition = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetSlide = Math.floor(clickPosition * totalSlides);
      
      swiperRef.current.slideTo(targetSlide);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, totalSlides]);

  // Handle scrollbar click and drag
  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!swiperRef.current || !scrollbarRef.current) return;
    
    const rect = scrollbarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const targetSlide = Math.floor(clickPosition * totalSlides);
    
    swiperRef.current.slideTo(targetSlide);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleScrollbarClick(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleScrollbarClick(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const onSlideChange = (swiper: SwiperType) => {
    const progress = swiper.progress;
    setScrollProgress(progress);
    setSlidesPerView(swiper.slidesPerViewDynamic());
  };

  const onSwiperInit = (swiper: SwiperType) => {
    setSlidesPerView(swiper.slidesPerViewDynamic());
  };

  return (
    <div className="courses-carousel flex flex-col gap-4 items-center">
      <style jsx global>{`
        .swiper-slide {
          transition: all 0.3s ease;
          opacity: 0.9;
          transform: scale(0.9);
        }

        .swiper-slide-active {
          opacity: 1 !important;
          transform: scale(1) !important;
        }

        .swiper-slide-active .course-card {
          border: 2px solid #f77124 !important;
        }
      `}</style>

      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          onSwiperInit(swiper);
        }}
        modules={[Autoplay]}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        loop={false}
        onSlideChange={onSlideChange}
        onProgress={(swiper, progress) => setScrollProgress(progress)}
        onResize={(swiper) => setSlidesPerView(swiper.slidesPerViewDynamic())}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
        }}
        className={cn("w-full h-full px-4 !py-4 sm:px-0")}
        breakpoints={{
          0: {
            slidesPerView: 1,
            spaceBetween: 0,
          },
          768: {
            slidesPerView: 2.2,
          },
          1024: {
            slidesPerView: 3,
          },
          1100: {
            slidesPerView: 3,
          },
          1440: {
            slidesPerView: 3.5,
          },
          1600: {
            slidesPerView: 4.2,
            spaceBetween: 40,
          },
        }}
      >
        {[...courses, ...courses, ...courses, ...courses].map((course, index) => (
          <SwiperSlide key={`${course.title}-${index}`}>
            <CourseCard {...course} />
          </SwiperSlide>
        ))}
      </Swiper>
      <div 
        ref={scrollbarRef}
        className="scrollbar-container mt-4 w-[600px] h-6 p-1 bg-[#EDEDED] rounded-full overflow-hidden cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="scrollbar-thumb bg-white h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: getThumbWidth(),
            transform: `translateX(${scrollProgress * (592 - parseInt(getThumbWidth()))}px)`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default CoursesCarousel;
