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

const InstructorCarousel = () => {
  const demoInstructors: Instructor[] = [
    {
      id: "instructor-001",
      name: "Dr. Sarah Chen",
      profileImage: "/courseDefaultTestimonial.png",
      bio: "Former Google Senior Software Engineer with 12+ years of experience in full-stack development and machine learning. Passionate about teaching practical coding skills that land jobs.",
      experience: "12+ years",
      rating: 4.9,
      linkedinUrl: "https://linkedin.com/in/sarahchen",
      totalStudents: 15420,
      totalCourses: 8,
    },
		{
      id: "instructor-001",
      name: "Dr. Sarah Chen",
      profileImage: "/courseDefaultTestimonial.png",
      bio: "Former Google Senior Software Engineer with 12+ years of experience in full-stack development and machine learning. Passionate about teaching practical coding skills that land jobs.",
      experience: "12+ years",
      rating: 4.9,
      linkedinUrl: "https://linkedin.com/in/sarahchen",
      totalStudents: 15420,
      totalCourses: 8,
    },
		{
      id: "instructor-001",
      name: "Dr. Sarah Chen",
      profileImage: "/courseDefaultTestimonial.png",
      bio: "Former Google Senior Software Engineer with 12+ years of experience in full-stack development and machine learning. Passionate about teaching practical coding skills that land jobs.",
      experience: "12+ years",
      rating: 4.9,
      linkedinUrl: "https://linkedin.com/in/sarahchen",
      totalStudents: 15420,
      totalCourses: 8,
    },
  ];

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
      {demoInstructors.map((instructor, index) => (
        <SwiperSlide key={index}>
          <InstructorCard instructor={instructor} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default InstructorCarousel;
