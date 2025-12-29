"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { cn } from "@/lib/utils";
import { mentorProfiles } from "@/constants/internshipData";
import { Star } from "lucide-react";

const MentorsProfileSection = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const swiperRef = useRef<{ slideToLoop: (index: number) => void } | null>(null);

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 mt-12 sm:mt-16 lg:pt-16 pb-6 sm:pb-8 bg-white">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
          <span className="text-gray-900 font-extrabold">Our</span>{" "}
          <span className="text-[#F77124] font-extrabold">Mentors</span>{" "}
          <span className="text-gray-900 font-extrabold">Profile</span>
        </h2>
        <p className="text-black text-sm sm:text-base lg:text-lg max-w-3xl mx-auto px-2">
          A simple, step-by-step process to help you start, learn, and
          successfully complete your internship.
        </p>
      </div>

      <div className="mt-8 sm:mt-12">
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setActiveSlideIndex(swiper.realIndex);
          }}
          modules={[Autoplay]}
          spaceBetween={16}
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
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 24,
            },
          }}
          className="mentors-profile-swiper"
        >
          {mentorProfiles.map((mentor, index) => (
            <SwiperSlide key={index}>
              <div className="bg-white max-w-[430px] mx-auto sm:m-1 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-[#f77124] shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] opacity-100 transition-shadow h-full">
                {/* Profile Picture, Name, Specialization, and LinkedIn Icon */}
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={mentor.profileImage}
                      alt={mentor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {mentor.name}
                      </h3>
                      <p className="text-xs text-gray-600 truncate">
                        {mentor.specialization}
                      </p>
                    </div>
                      {mentor.linkedinUrl ? (
                        <Link
                          href={mentor.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        className="shrink-0 hidden md:block"
                          aria-label={`${mentor.name} LinkedIn`}
                        >
                        <Image
                          src="/assets/LinkedIn.svg"
                          alt="LinkedIn"
                          width={40}
                          height={40}
                          className="w-full h-full"
                        />
                        </Link>
                      ) : (
                      <div className="shrink-0 hidden md:block">
                        <Image
                          src="/assets/LinkedIn.svg"
                          alt="LinkedIn"
                          width={40}
                          height={40}
                          className="w-full h-full"
                        />
                        </div>
                      )}
                  </div>
                </div>

                {/* Curriculum Description */}
                <p className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                  {mentor.curriculumDescription}
                </p>

                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4 sm:w-5 sm:h-5",
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
        {/* <div className="flex justify-center items-center gap-2 mt-8">
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
                  : "w-8 h-2 bg-[#FED7AA] hover:bg-[#F77124]/70"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default MentorsProfileSection;

