"use client";

import React from "react";
import {
  FileCheck,
  ClipboardList,
  BarChart3,
  FileText,
  Handshake,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { internshipJourneySteps } from "@/constants/internshipData";

const InternshipJourneySection = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "apply":
        return <FileCheck className="w-8 h-8 text-green-600" />;
      case "test":
        return <ClipboardList className="w-8 h-8 text-blue-600" />;
      case "result":
        return <BarChart3 className="w-8 h-8 text-blue-600" />;
      case "offer":
        return <FileText className="w-8 h-8 text-red-600" />;
      case "joining":
        return <Handshake className="w-8 h-8 text-blue-600" />;
      case "certificate":
        return <GraduationCap className="w-8 h-8 text-blue-600" />;
      default:
        return <CheckCircle2 className="w-8 h-8 text-blue-600" />;
    }
  };

  return (
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:pt-12 bg-[#fffbf8]">
      {/* Title Section */}
      <div className="text-center mb-12 max-w-4xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          <span className="text-gray-900 font-extrabold">Your</span>{" "}
          <span className="text-[#F77124] font-extrabold">Internship </span>
            <span className="text-gray-900 font-extrabold">Journey</span>
        </h2>
        <p className="text-black text-base lg:text-lg mt-4">
          A simple, step-by-step process to help you start, learn, and
          successfully complete your internship.
        </p>
      </div>

      {/* Timeline Section */}
      <div className="max-w-5xl mx-auto">
        <div className="relative">
          {/* Vertical Dotted Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-[#F77124] transform -translate-x-1/2 hidden md:block"></div>

          {/* Steps */}
          <div className="relative space-y-12">
            {internshipJourneySteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-0 ${
                  step.position === "left" ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* Text Box */}
                <div
                  className={`flex-1 ${
                    step.position === "left" ? "text-right pr-8" : "text-left pl-8"
                  }`}
                >
                  <div className="bg-white rounded-lg p-6 border-[#F77124] border-2 shadow-sm hover:shadow-md transition-shadow inline-block max-w-md">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>

                {/* Connecting Line */}
                <div className={`relative z-0 ${step.position === "left" ? "w-32" : "w-32"}`}>
                  <div className={`h-0.5 bg-[#F77124] ${step.position === "left" ? "w-full" : "w-full"}`}></div>
                </div>

                {/* Icon Circle */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 bg-[#F77124] rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      {getIcon(step.icon)}
                    </div>
                  </div>
                </div>

                {/* Empty space for alignment */}
                <div className="flex-1 hidden md:block"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipJourneySection;

