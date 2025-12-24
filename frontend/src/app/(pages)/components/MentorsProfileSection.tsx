"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { cn } from "@/lib/utils";
import { mentorProfiles } from "@/constants/internshipData";
import { Linkedin, Star } from "lucide-react";

const MentorsProfileSection = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const swiperRef = useRef<any>(null);

  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24">
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-gray-900">Our</span>{" "}
          <span className="text-[#F77124]">Mentors</span>{" "}
          <span className="text-gray-900">Profile</span>
        </h2>
        <p className="text-gray-600 text-base lg:text-lg max-w-3xl mx-auto">
          A simple, step-by-step process to help you start, learn, and
          successfully complete your internship.
        </p>
      </div>

      <div className="mt-12">
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setActiveSlideIndex(swiper.realIndex);
          }}
          modules={[Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          onSlideChange={(swiper) => {
            setActiveSlideIndex(swiper.realIndex);
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="mentors-profile-swiper"
        >
          {mentorProfiles.map((mentor, index) => (
            <SwiperSlide key={index}>
              <div className="bg-white rounded-2xl p-6 border border-[#F77124] hover:shadow-lg transition-shadow h-full">
                {/* Profile Picture, Name, and LinkedIn Icon */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={mentor.profileImage}
                      alt={mentor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {mentor.name}
                      </h3>
                      {mentor.linkedinUrl ? (
                        <Link
                          href={mentor.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-black p-2 rounded flex-shrink-0"
                          aria-label={`${mentor.name} LinkedIn`}
                        >
                          <Linkedin className="w-5 h-5 text-white" />
                        </Link>
                      ) : (
                        <div className="bg-black p-2 rounded flex-shrink-0">
                          <Linkedin className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {mentor.specialization}
                    </p>
                  </div>
                </div>

                {/* Curriculum Description */}
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {mentor.curriculumDescription}
                </p>

                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < mentor.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {mentorProfiles.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (swiperRef.current) {
                  swiperRef.current.slideToLoop(index);
                }
              }}
              className={cn(
                "transition-all duration-300 rounded-full cursor-pointer",
                activeSlideIndex === index
                  ? "w-8 h-2 bg-[#F77124]"
                  : "w-2 h-2 bg-[#FED7AA] hover:bg-[#F77124]/70"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentorsProfileSection;

