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
    const fallbackTestimonials: Testimonial[] = [
    {
      name: "Priya Sharma",
      profileImage: "/courseDefaultTestimonial.png",
      currentRole: "Senior Full Stack Developer",
      pastRole: "Junior Developer",
      pastCompany: "StartupTech Solutions",
      currentCompany: "Microsoft",
      linkedin: "https://www.linkedin.com/",
      verified: true,
      reviewableType: "Course",
      reviewableId: "123",
      isActive: true,
    },
    {
      name: "Rahul Gupta",
      profileImage: "/courseDefaultTestimonial.png",
      pastRole: "Business Analyst",
      pastCompany: "Local Consulting Firm",
      currentRole: "Senior Data Scientist",
      currentCompany: "Amazon",
      linkedin: "https://www.linkedin.com/",
      verified: true,
      reviewableType: "Course",
      reviewableId: "123",
      isActive: true,
    },
    {
      name: "Sneha Patel",
      profileImage: "/courseDefaultTestimonial.png",
      pastRole: "Graphic Designer",
      pastCompany: "Creative Agency",
      currentRole: "Lead UX Designer",
      currentCompany: "Adobe",
      linkedin: "https://www.linkedin.com/",
      verified: true,
      reviewableType: "Course",
      reviewableId: "123",
      isActive: true,
    },
    {
      name: "Arjun Singh",
      profileImage: "/courseDefaultTestimonial.png",
      pastRole: "System Administrator",
      pastCompany: "IT Services Company",
      currentRole: "Cloud Solutions Architect",
      currentCompany: "Google Cloud",
      linkedin: "https://www.linkedin.com/",
      verified: true,
      reviewableType: "Course",
      reviewableId: "123",
      isActive: true,
    }, 
    {
      name: "Vikram Joshi",
      profileImage: "/courseDefaultTestimonial.png",
      pastRole: "IT Support Specialist",
      pastCompany: "Regional Bank",
      currentRole: "Security Engineer",
      currentCompany: "Cisco",
      linkedin: "https://www.linkedin.com/",
      verified: true,
      reviewableType: "Course",
      reviewableId: "123",
      isActive: true,
    },
  ];

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
        "w-full h-full px-4 !py-4 sm:px-0 [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col",
        props.className
      )}
    >
      {(testimonials ?? fallbackTestimonials).map((testimonial, index) => (
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
