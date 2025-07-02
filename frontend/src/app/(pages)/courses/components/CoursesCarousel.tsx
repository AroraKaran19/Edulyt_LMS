"use client";
import React, { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { CourseCardProps } from "@/types";
import TopCourseCard from "./TopCourseCard";
import { cn } from "@/lib/utils";
import type { Swiper as SwiperType } from "swiper";
import { useMediaQuery } from "usehooks-ts";

const CoursesCarousel = ({ courses }: { courses: CourseCardProps[] }) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slidesPerView, setSlidesPerView] = useState(1);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isDesktop = useMediaQuery("(max-width: 1440px)");
  const scrollbarWidth = isMobile ? 300 : isTablet ? 400 : isDesktop ? 500 : 600;

  const originalSlidesCount = courses.length * 4;

  const getThumbWidth = () => {
    const visibleRatio = slidesPerView / originalSlidesCount;
    const padding = 8; // p-1 = 4px on each side = 8px total
    const availableWidth = scrollbarWidth - padding;
    const minWidth = 60;
    const maxWidth = 200;
    const calculatedWidth = Math.max(
      minWidth,
      Math.min(maxWidth, visibleRatio * availableWidth)
    );
    return `${calculatedWidth}px`;
  };

  // Handle global mouse events for drag functionality
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !swiperRef.current || !scrollbarRef.current) return;

      const rect = scrollbarRef.current.getBoundingClientRect();
      const clickPosition = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const targetSlide = Math.floor(clickPosition * originalSlidesCount);

      swiperRef.current.slideToLoop(targetSlide);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, originalSlidesCount]);

  // Handle scrollbar click and drag
  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!swiperRef.current || !scrollbarRef.current) return;

    const rect = scrollbarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const targetSlide = Math.floor(clickPosition * originalSlidesCount);

    swiperRef.current.slideToLoop(targetSlide);
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
    // For loop mode, calculate progress based on real index
    const realIndex = swiper.realIndex;
    const progress = realIndex / (originalSlidesCount - 1);
    setScrollProgress(Math.max(0, Math.min(1, progress)));
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
        loop={true}
        onSlideChange={onSlideChange}
        onProgress={(swiper) => {
          const realIndex = swiper.realIndex;
          const progress = realIndex / (originalSlidesCount - 1);
          setScrollProgress(Math.max(0, Math.min(1, progress)));
        }}
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
            slidesPerView: 1.2,
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
        {[...courses, ...courses, ...courses, ...courses].map(
          (course, index) => (
            <SwiperSlide key={`${course.title}-${index}`}>
              {({ isActive }) => (
                <TopCourseCard
                  {...course}
                  className={
                    isActive
                      ? "border-2 border-[#f77124] shadow-[0_0_2px_3px_rgba(233,117,0,0.5)]"
                      : ""
                  }
                />
              )}
            </SwiperSlide>
          )
        )}
      </Swiper>
      <div
        ref={scrollbarRef}
        className="scrollbar-container mt-4 h-6 p-1 bg-[#EDEDED] rounded-full overflow-hidden cursor-pointer"
        style={{
          width: scrollbarWidth + "px",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="scrollbar-thumb bg-white h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: getThumbWidth(),
            transform: `translateX(${
              scrollProgress * (scrollbarWidth - 8 - parseInt(getThumbWidth()))
            }px)`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default CoursesCarousel;
