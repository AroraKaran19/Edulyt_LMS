import { Swiper, SwiperSlide } from "swiper/react";
import { Instructor } from "@/types";
import InstructorCard from "./InstructorCard";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { Autoplay } from "swiper/modules";

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
      className="w-full h-full px-4 py-4! sm:px-0 [&_.swiper-slide]:h-auto! [&_.swiper-slide]:flex! [&_.swiper-slide]:flex-col"
    >
      {instructors?.length > 0 &&
        instructors.map((instructor, index) => (
          <SwiperSlide key={index}>
            <InstructorCard instructor={instructor} />
          </SwiperSlide>
        ))}
    </Swiper>
  );
};

export default InstructorCarousel;
