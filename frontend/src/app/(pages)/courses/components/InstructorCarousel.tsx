import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Instructor } from "@/types";
import InstructorCard from "./InstructorCard";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { Autoplay } from "swiper/modules";

export interface Testimonial {
  name: string;
  image: string;
  category: string;
  pastRole: string;
  pastCompany: string;
  currentRole: string;
  currentCompany: string;
  linkedin?: string;
}

const InstructorCarousel = ({ instructors }: { instructors: Instructor[] }) => {

  return (
    <Swiper
      centeredSlides={true}
      grabCursor={true}
			modules={[Autoplay]}
			autoplay={{
				delay: 5000,
				disableOnInteraction: false,
			}}
      breakpoints={{
        0: {
          slidesPerView: 1.1,
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
      className="w-full h-full"
    >
      {instructors.length > 0 && instructors.map((instructor, index) => (
        <SwiperSlide key={index}>
          <InstructorCard instructor={instructor} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default InstructorCarousel;
