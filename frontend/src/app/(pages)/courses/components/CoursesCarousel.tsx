"use client";
import React, { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { Course } from "@/types";
import TopCourseCard from "./TopCourseCard";
import { cn } from "@/lib/utils";
import type { Swiper as SwiperType } from "swiper";

const CoursesCarousel = ({ courses }: { courses: Course[] }) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slidesPerView, setSlidesPerView] = useState(1);
  const [windowWidth, setWindowWidth] = useState(0);

  // Custom media query hook that's hydration-safe
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width after hydration
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getScrollbarWidth = () => {
    // Use default width during SSR to prevent hydration mismatch
    if (windowWidth === 0) return 500;

    if (windowWidth <= 767) return 300;
    if (windowWidth >= 768 && windowWidth <= 1023) return 400;
    if (windowWidth >= 1024 && windowWidth <= 1439) return 500;
    return 600;
  };

  const scrollbarWidth = getScrollbarWidth();

  const originalSlidesCount = courses.length;

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
      <div className="w-full h-[500px] md:h-[520px] lg:h-[540px]">
        <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          onSwiperInit(swiper);
        }}
        modules={[Autoplay]}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        loop={courses.length > 3}
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
        initialSlide={courses.length > 3 ? 0 : 1}
        className={cn("w-full px-4 !py-4 sm:px-0 [&_.swiper-slide]:!flex [&_.swiper-slide]:!items-stretch [&_.swiper-slide]:!h-full")}
        breakpoints={{
          0: {
            slidesPerView: 1.2,
            spaceBetween: 5,
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
        {courses.map((course, index) => (
          <SwiperSlide key={`${course.title}-${index}`}>
            {({ isActive }) => (
              <TopCourseCard
                course={course}
                className={cn(
                  {
                    "border-2 border-[#f77124] shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] opacity-100":
                      isActive,
                    "opacity-90": !isActive,
                  },
                  "transition-all duration-300 ease-out"
                )}
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      </div>
      {courses.length > 3 && <div
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
      </div>}
    </div>
  );
};

export default CoursesCarousel;
