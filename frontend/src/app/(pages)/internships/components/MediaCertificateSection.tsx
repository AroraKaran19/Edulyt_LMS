"use client";

import React from "react";
import Image from "next/image";

const MediaCertificateSection = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 mt-12 sm:mt-16 lg:mt-24 bg-[#fffcfa] py-8 sm:py-12">
      {/* Title Section */}
      <div className="text-center mb-6 sm:mb-8 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 max-w-sm text-center mx-auto">
          <span className="text-[#F77124] font-extrabold">Media Section</span>{" "}
          <span className="text-gray-900 font-extrabold">with certificate</span>
        </h2>
        <p className="text-black text-sm sm:text-base lg:text-lg mt-3 sm:mt-4 max-w-2xl mx-auto px-2">
          Meet the industry professionals and mentors who will guide you through
          the internship, helping you build real skills and understand how the
          industry works.
        </p>
      </div>

      {/* Three Panels Section */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Panel - Man with Social Media Icons */}
          <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[650px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/assets/Media1.png"
              alt="Man with smartphone and social media icons"
              width={800}
              height={650}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>

          {/* Middle Panel - Certificate Document */}
          <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[650px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/assets/Media2.png"
              alt="Certificate document"
              width={800}
              height={650}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>

          {/* Right Panel - Man Recording Video */}
          <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[650px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/assets/Media3.png"
              alt="Man recording video in studio"
              width={800}
              height={650}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCertificateSection;

