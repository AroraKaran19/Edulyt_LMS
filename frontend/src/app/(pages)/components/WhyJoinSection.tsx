"use client";

import React from "react";
import { whyJoinItems } from "@/constants/internshipData";

const WhyJoinSection = () => {
  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24">
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-gray-900 font-extrabold">Why Join This</span>{" "}
          <span className="text-[#F77124] font-extrabold">Internship?</span>
        </h2>
        <p className="text-black text-base lg:text-lg max-w-3xl mx-auto">
          Gain hands-on experience, real project exposure, and learn directly
          from industry mentors- all in one structured, beginner-friendly
          internship program.
        </p>
      </div>

      <div className="flex flex-col gap-6 mt-12">
        {/* First Row - 3 items */}
        <div className="flex flex-wrap justify-center gap-6">
          {whyJoinItems.slice(0, 3).map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="rounded-2xl p-4 transition-shadow max-w-md"
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-[#F77124] w-16 h-16 rounded-full flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-black text-center mb-3">
                  {item.title}
                </h3>
                <p className="text-[#808080] text-center">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Second Row - 2 items */}
        <div className="flex flex-wrap justify-center gap-6">
          {whyJoinItems.slice(3, 5).map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index + 3}
                className="rounded-2xl p-4 transition-shadow max-w-md"
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-[#F77124] w-16 h-16 rounded-full flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-black text-center mb-3">
                  {item.title}
                </h3>
                <p className="text-[#808080] text-center">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WhyJoinSection;

