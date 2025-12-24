"use client";

import React from "react";
import { whyJoinItems } from "@/constants/internshipData";

const WhyJoinSection = () => {
  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24">
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-gray-900">Why Join This</span>{" "}
          <span className="text-[#F77124]">Internship?</span>
        </h2>
        <p className="text-gray-600 text-base lg:text-lg max-w-3xl mx-auto">
          Gain hands-on experience, real project exposure, and learn directly
          from industry mentors- all in one structured, beginner-friendly
          internship program.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {whyJoinItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 transition-shadow"
            >
              <div className="flex justify-center mb-4">
                <div className="bg-[#F77124] w-16 h-16 rounded-full flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600 text-center">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WhyJoinSection;

