import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { cn } from "@/lib/utils";
import "swiper/css";
import "swiper/css/effect-coverflow";
import TestimonialCard from "./TestimonialCard";

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

const TestimonialCarousel = () => {
  const defaultTestimonials : Testimonial[] = [
    {
      name: "Priya Sharma",
      image: "/courseDefaultTestimonial.png",
      category: "Full Stack Development",
      pastRole: "Junior Developer",
      pastCompany: "StartupTech Solutions",
      currentRole: "Senior Full Stack Developer",
      currentCompany: "Microsoft",
      linkedin: "https://www.linkedin.com/",
    },
    {
      name: "Rahul Gupta",
      image: "/courseDefaultTestimonial.png",
      category: "Data Science & Analytics",
      pastRole: "Business Analyst",
      pastCompany: "Local Consulting Firm",
      currentRole: "Senior Data Scientist",
      currentCompany: "Amazon",
      linkedin: "https://www.linkedin.com/",
    },
    {
      name: "Sneha Patel",
      image: "/courseDefaultTestimonial.png",
      category: "UI/UX Design",
      pastRole: "Graphic Designer",
      pastCompany: "Creative Agency",
      currentRole: "Lead UX Designer",
      currentCompany: "Adobe",
      linkedin: "https://www.linkedin.com/",
    },
    {
      name: "Arjun Singh",
      image: "/courseDefaultTestimonial.png",
      category: "DevOps & Cloud Computing",
      pastRole: "System Administrator",
      pastCompany: "IT Services Company",
      currentRole: "Cloud Solutions Architect",
      currentCompany: "Google Cloud",
      linkedin: "https://www.linkedin.com/",
    },
    {
      name: "Kavya Reddy",
      image: "/courseDefaultTestimonial.png",
      category: "Digital Marketing",
      pastRole: "Marketing Assistant",
      pastCompany: "Small Business",
      currentRole: "Digital Marketing Manager",
      currentCompany: "HubSpot",
      linkedin: "https://www.linkedin.com/",
    },
    {
      name: "Vikram Joshi",
      image: "/courseDefaultTestimonial.png",
      category: "Cybersecurity",
      pastRole: "IT Support Specialist",
      pastCompany: "Regional Bank",
      currentRole: "Security Engineer",
      currentCompany: "Cisco",
      linkedin: "https://www.linkedin.com/",
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
      loop={true}
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
      className="w-full h-full px-4 !py-4 sm:px-0 [&_.swiper-slide]:!h-auto [&_.swiper-slide]:!flex [&_.swiper-slide]:!flex-col"
    >
      {defaultTestimonials.map((testimonial, index) => (
        <SwiperSlide key={index}>
          {({ isActive }) => (
            <TestimonialCard
              testimonial={testimonial}
              className={cn({
                "opacity-100 border-2 border-[#f77124] shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] z-20 relative":
                  isActive,
                "opacity-90 shadow-[0_0_2px_3px_rgba(0,0,0,0.1)] z-0 relative": !isActive,
              })}
            />
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default TestimonialCarousel;
