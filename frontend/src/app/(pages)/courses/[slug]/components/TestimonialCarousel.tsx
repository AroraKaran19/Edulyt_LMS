import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { cn } from "@/lib/utils";
import "swiper/css";
import "swiper/css/effect-coverflow";
import TestimonialCard from "./TestimonialCard";
import { Testimonial } from "@/types";

const TestimonialCarousel = ({
  testimonials,
  ...props
}: { testimonials: Testimonial[] } & {
  className?: string;
  style?: React.CSSProperties;
}) => {


  if (!testimonials || testimonials.length === 0) return null;

  return (
    <Swiper
      centeredSlides={true}
      grabCursor={true}
      coverflowEffect={{
        rotate: 0,
        stretch: 0,
        depth: 100,
        modifier: 2.5,
      }}
      effect="coverflow"
      modules={[Autoplay]}
      autoplay={{
        delay: 2500,
        disableOnInteraction: false,
      }}
      breakpoints={{
        0: {
          slidesPerView: 1.2,
          spaceBetween: 10,
        },
        768: {
          slidesPerView: 2.2,
          spaceBetween: 20,
        },
        1100: {
          slidesPerView: 2.3,
          spaceBetween: 60,
        },
        1440: {
          slidesPerView: 2.5,
          spaceBetween: 100,
        },
      }}
      className={cn(
        "w-full h-full px-4 py-4! sm:px-0 [&_.swiper-slide]:h-auto! [&_.swiper-slide]:flex! [&_.swiper-slide]:flex-col",
        props.className
      )}
    >
      {testimonials.map((testimonial, index) => (
        <SwiperSlide key={index}>
          {({ isActive }) => (
            <TestimonialCard
              testimonial={testimonial}
              className={cn({
                "opacity-100 border-2 border-[#f77124] shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] z-20 relative":
                  isActive,
                "opacity-90 shadow-[0_0_2px_3px_rgba(0,0,0,0.1)] z-0 relative":
                  !isActive,
              })}
            />
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default TestimonialCarousel;
