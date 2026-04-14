"use client";

import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Internship } from "@/types";
import "swiper/css";

type Feature = Internship["features"][number];

// Carousel breakpoints configuration
const CAROUSEL_BREAKPOINTS = {
  0: {
    slidesPerView: 1.15,
    spaceBetween: 16,
    centeredSlides: true,
  },
  768: {
    slidesPerView: 2,
    spaceBetween: 20,
    centeredSlides: false,
  },
  1024: {
    slidesPerView: 3,
    spaceBetween: 24,
    centeredSlides: false,
  },
  1280: {
    slidesPerView: 4,
    spaceBetween: 24,
    centeredSlides: false,
  },
} as const;

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="h-full w-full min-w-0 shrink-0 rounded-2xl bg-linear-to-br from-primary to-[#F7AD24] p-[2px] shadow-[0_8px_24px_-8px_rgba(245,105,29,0.25)] transition-shadow duration-300 hover:shadow-[0_12px_28px_-8px_rgba(245,105,29,0.35)]">
      <article className="flex h-full min-h-[220px] w-full flex-col items-center rounded-[calc(1rem-2px)] bg-white px-4 py-6 text-center">
        <div className="mb-4 flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/20">
          <Icon
            icon={feature.icon}
            className="size-7 text-primary"
            aria-hidden
          />
        </div>
        <h3 className="text-base font-bold leading-snug text-primary">
          {feature.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-primary">
          {feature.description}
        </p>
      </article>
    </div>
  );
}

const FeatureCarousel = ({
  features,
}: {
  features: Internship["features"];
}) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);

  if (!features?.length) return null;

  // Calculate pagination based on current viewport
  const totalSlides = features.length;
  
  // For mobile (< 768px), show 1 dot per slide since only ~1 is visible
  // For larger screens, calculate positions based on visible slides
  const isMobileView = slidesPerView < 2; // slidesPerView will be 1.15 on mobile
  
  let totalPositions: number;
  let showPagination: boolean;
  
  if (isMobileView) {
    // Mobile: show dot for each feature
    totalPositions = totalSlides;
    showPagination = totalSlides > 1;
  } else {
    // Desktop/Tablet: show position-based dots
    const visibleSlides = Math.floor(slidesPerView);
    totalPositions = Math.max(1, totalSlides - visibleSlides + 1);
    showPagination = totalSlides > visibleSlides;
  }
  
  const activePosition = isMobileView 
    ? activeIndex 
    : Math.min(activeIndex, totalPositions - 1);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="relative w-full py-2">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-white/50 via-white/80 to-transparent sm:w-14 md:w-16"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-white/50 via-white/80 to-transparent sm:w-14 md:w-16"
          aria-hidden
        />
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setActiveIndex(swiper.realIndex);
            setSlidesPerView(swiper.params.slidesPerView as number);
          }}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          onResize={(swiper) => {
            setSlidesPerView(swiper.params.slidesPerView as number);
          }}
          modules={[Autoplay]}
          grabCursor
          roundLengths
          loop
          slidesPerView={CAROUSEL_BREAKPOINTS[0].slidesPerView}
          spaceBetween={CAROUSEL_BREAKPOINTS[0].spaceBetween}
          centeredSlides={CAROUSEL_BREAKPOINTS[0].centeredSlides}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
          }}
          breakpoints={{
            768: CAROUSEL_BREAKPOINTS[768],
            1024: CAROUSEL_BREAKPOINTS[1024],
            1280: CAROUSEL_BREAKPOINTS[1280],
          }}
          className="w-full [&_.swiper-slide]:box-border [&_.swiper-slide]:h-auto! [&_.swiper-slide]:min-w-0 [&_.swiper-slide]:flex! [&_.swiper-slide]:items-stretch"
        >
          {features.map((feature, index) => (
            <SwiperSlide
              key={`${feature.title}-${index}`}
              className="flex! h-auto min-w-0"
            >
              <FeatureCard feature={feature} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {showPagination && (
        <div className="flex w-full items-center justify-center px-4">
          <div className="flex items-center gap-1.5 py-2 sm:gap-2">
            {Array.from({ length: totalPositions }).map((_, position) => (
              <button
                key={position}
                type="button"
                aria-label={`Go to position ${position + 1}`}
                aria-current={activePosition === position ? "true" : undefined}
                onClick={() => {
                  swiperRef.current?.slideToLoop(position);
                }}
                className={cn(
                  "h-2 w-7 shrink-0 rounded-full transition-all duration-300 ease-out sm:w-9 cursor-pointer",
                  activePosition === position
                    ? "bg-primary"
                    : "bg-primary/25 hover:bg-primary/40",
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureCarousel;
