"use client";

import React from "react";
import Image from "next/image";
import { technologyRequirements } from "@/constants/internshipData";

const PrerequisitesSection = () => {
  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Section - Text Content */}
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            <span className="text-[#F77124]">Pre-Requisites:</span>{" "}
            <div className="text-gray-900">Technology Requirements</div>
          </h2>
          <p className="text-gray-600 text-base lg:text-lg mb-6">
            To Ensure A Smooth Learning Experience During The Internship,
            Students Are Expected To Have The Following Basic Technology Setup.
          </p>

          <ul className="space-y-4">
            {technologyRequirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#F77124] rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700 text-base lg:text-lg">
                  {requirement}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Section - Image */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative h-full min-h-[400px] lg:min-h-[500px]">
            <Image
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
              alt="Students collaborating around a laptop"
              fill
              className="object-cover rounded-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrerequisitesSection;

