"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { cn } from "@/lib/utils";
import { mentorProfiles } from "@/constants/internshipData";
import { Star } from "lucide-react";
import { SiDell } from "react-icons/si";
import { FaAmazon, FaGoogle, FaApple } from "react-icons/fa";

const companyIcons = [SiDell, FaAmazon, FaGoogle, FaApple];

const MentorsProfileSection = () => {
  return (
    <section className="bg-white px-4 sm:px-6 lg:px-8 xl:px-12 pt-10 sm:pt-12 pb-10 sm:pb-20">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          <span className="text-gray-900 font-extrabold">Our</span>{" "}
          <span className="text-[#F77124] font-extrabold">Mentors</span>{" "}
          <span className="text-gray-900 font-extrabold">Profile</span>
        </h2>
        <p className="mt-3 text-black text-sm sm:text-base max-w-3xl mx-auto">
          A simple, step-by-step process to help you start, learn, and
          successfully complete your internship.
        </p>
      </div>

      <div className="mt-10 flex justify-center">
        <div className="w-full max-w-6xl">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={32}
            slidesPerView={1}
            loop
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 24 },
              1024: { slidesPerView: 3, spaceBetween: 32 },
            }}
          >
            {mentorProfiles.map((mentor, index) => (
              <SwiperSlide key={`${mentor.name}-${index}`}>
                <div className="flex justify-center">
                  <div className="w-full max-w-[360px] bg-white rounded-xl border-2 border-[#F77124] shadow-[0_0_0_3px_rgba(247,113,36,0.18)] px-5 py-3">
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 border-2 border-gray-300 rounded-full overflow-hidden shrink-0">
                        <Image
                          src={mentor.profileImage}
                          alt={mentor.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-5">
                          <h3 className="text-base font-bold text-gray-900 truncate">
                            {mentor.name}
                          </h3>
                          {mentor.linkedinUrl && (
                            <Link
                              href={mentor.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${mentor.name} LinkedIn`}
                              className="shrink-0 inline-flex items-center justify-center w-8 h-8"
                            >
                              <Image
                                src="/assets/LinkedIn.svg"
                                alt="LinkedIn"
                                width={24}
                                height={24}
                                className="w-full h-full object-contain"
                              />
                            </Link>
                          )}
                        </div>

                        <p className="mt-2 text-[12px] text-gray-600 font-semibold truncate">
                          {mentor.specialization}
                        </p>
                        <p className="mt-0.5 text-[12px] text-gray-500 truncate">
                          {mentor.designation}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-4">
                      {companyIcons.map((Icon, idx) => (
                        <div
                          key={`${mentor.name}-logo-${idx}`}
                          className="w-10 h-10 flex items-center justify-center text-gray-700"
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-4 h-4",
                              i < mentor.rating
                                ? "text-[#F7AD24] fill-[#F7AD24]"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {mentor.ratingLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default MentorsProfileSection;
