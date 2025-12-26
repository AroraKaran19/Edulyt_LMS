"use client";

import React from "react";
import Image from "next/image";

const MediaCertificateSection = () => {
  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24 bg-white py-12">
      {/* Title Section */}
      <div className="text-center mb-8 max-w-4xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-[#F77124]">Media Section</span>{" "}
          <span className="text-gray-900">with certificate</span>
        </h2>
        <p className="text-gray-700 text-base lg:text-lg mt-4">
          Meet the industry professionals and mentors who will guide you through
          the internship, helping you build real skills and understand how the
          industry works.
        </p>
      </div>

      {/* Three Panels Section */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel - Man with Social Media Icons */}
          <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-full min-h-[500px]">
            <div className="relative w-full h-full">
              <Image
                src="https://thumbs.dreamstime.com/b/bearded-user-smartphone-optical-eyewear-vision-correction-looking-camera-portrait-handsome-caucasian-man-modern-295017650.jpg"
                alt="Man with smartphone and social media icons"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Middle Panel - Certificate Document */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow overflow-hidden relative h-full min-h-[500px]">
            {/* Certificate Content */}
            <div className="relative z-10">
              {/* Company Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="text-xs text-gray-700">
                  <p className="font-bold">Airkrit India Pvt. Ltd.</p>
                  <p>D-160, Dwarka, New Delhi-110075</p>
                  <p>CIN: U85499DL2023PTC423549</p>
                  <p>www.airkrit.com</p>
                  <p>support@airkrit.com</p>
                  <p>+91 8929252575</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#F77124] rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white text-xs font-bold text-center">
                      AIRKRIT
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 font-semibold">
                    EDUCATION TO EMPLOYMENT
                  </p>
                </div>
              </div>

              {/* Certificate Title */}
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">
                Certificate
              </h3>

              {/* Watermark Circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#F77124]/10 rounded-full z-0"></div>

              {/* Certificate Body */}
              <div className="relative z-10 text-sm text-gray-800 space-y-2 mb-6">
                <p className="text-center text-gray-600">DD-MM-YYYY</p>
                <p className="font-semibold">Dear [Your Name],</p>
                <p className="text-gray-600">ID : AI-XXXX</p>
                <p className="mt-4">
                  This is to certify that <span className="font-bold">[Full Name]</span> has
                  successfully completed the <span className="font-bold">[Course Name]</span>{" "}
                  offered by Airkrit India. During this program, the participant has acquired
                  essential skills and demonstrated commitment to learning.
                </p>
                <p>
                  The participant has actively engaged with the curriculum, attended live
                  sessions, received mentorship, and applied practical knowledge throughout
                  the program.
                </p>
              </div>

              {/* Footer with Signature */}
              <div className="relative z-10 mt-8">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="border-t-2 border-gray-400 w-32 mt-12 mb-2"></div>
                    <p className="text-xs text-gray-700">Vishal Yadav - Manager HR</p>
                  </div>
                  <div className="text-xs text-gray-700 text-right">
                    <p className="font-semibold">Edulyt India</p>
                    <p>Education to Employment</p>
                  </div>
                </div>
                {/* Seal */}
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <div className="text-center">
                    <p className="text-[8px] text-white font-bold">EDULYT</p>
                    <p className="text-[8px] text-white font-bold">INDIA</p>
                    <div className="text-yellow-400 text-xs">★</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Man Recording Video */}
          <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-full min-h-[500px]">
            <div className="relative w-full h-full">
              <Image
                src="https://img.freepik.com/premium-photo/videography-camera-man-filming-studio-photography-production-media_1313853-14220.jpg?w=2000"
                alt="Man recording video in studio"
                fill
                className="object-cover"
                unoptimized
              />
              {/* Overlay gradient for better text visibility if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCertificateSection;

