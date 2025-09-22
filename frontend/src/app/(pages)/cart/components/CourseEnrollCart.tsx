"use client";
import React, { useState } from "react";
import CourseTitle from "@/components/ui/course/CourseTitle";
import SectionContainer from "@/components/ui/course/SectionContainer";
import { ChevronDown, Star, Download } from "lucide-react";
import Image from "next/image";
import ApplicationDetails from "./ApplicationDetails";
import CartDetails from "./CartDetails";

const CourseEnrollCart = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const course = {
    faqs: [
      {
        question: "The curriculum, designed by the faculty of Texas McCombs,",
        answer: "This curriculum is crafted by experienced faculty to ensure comprehensive learning."
      },
      {
        question: "The curriculum, designed by the faculty of Texas McCombs,",
        answer: "This curriculum is crafted by experienced faculty to ensure comprehensive learning."
      },
      {
        question: "The curriculum, designed by the faculty of Texas McCombs,",
        answer: "This curriculum is crafted by experienced faculty to ensure comprehensive learning."
      },
      {
        question: "The curriculum, designed by the faculty of Texas McCombs,",
        answer: "This curriculum is crafted by experienced faculty to ensure comprehensive learning."
      },
      {
        question: "The curriculum, designed by the faculty of Texas McCombs,",
        answer: "This curriculum is crafted by experienced faculty to ensure comprehensive learning."
      }
    ]
  };

  return (
    <div className='w-full h-full flex flex-col gap-6'>
      {/* Cart Details */}
      <div className='w-full h-full flex gap-4'>
        <div className='w-full h-full flex-3 flex-col gap-4 bg-white rounded-3xl p-[6px]'>
          {/* Image */}
          <div className="w-full h-full">
            <div className="relative w-full  rounded-[18px] overflow-hidden mb-2 sm:mb-3">
              <Image src="/cart-ai-image.png"
                alt="certificate" width={300} height={226}
                className="w-full h-full object-contain min-h-[620px]"
              />
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 px-2">
                <p className="font-bold text-xs sm:text-lg font-plus-jakarta mb-2 text-[#F7AD24] line-clamp-2 px-2"
                  style={{ background: "linear-gradient(89.99deg, rgba(247, 191, 36, 0.23) 0.19%, rgba(255, 217, 195, 0) 99.99%)" }}>
                  Best seller
                  <span className="font-medium text-xs sm:text-lg font-plus-jakarta mb-2 text-[#F7AD2496] leading-[173%]">
                    (enrolled by 35k students)
                  </span>
                </p>
                <p className="font-normal text-xs sm:text-lg font-coolvetica mb-2 text-white line-clamp-2 text-center sm:text-left">
                  Data Science: Zero to Hundred
                </p>
                <p className="font-bold text-xs sm:text-lg font-plus-jakarta mb-2 text-[#F7AD24] line-clamp-2 flex items-center gap-[5px]">
                  <Star className="w-4 h-4 text-[#F7AD24]" fill="#F7AD24" />
                  <span>4.5 Rating</span>
                  <span className="font-normal text-xs sm:text-lg font-plus-jakarta  text-white leading-[173%]">
                    (more than 6,000 reviews)
                  </span>
                </p>
                <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                  <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Image src="/user.svg" alt="user" width={20} height={20} className="sm:w-6 sm:h-6 rounded-full border border-white" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium hidden sm:inline">John Doe</span>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium sm:hidden">JD</span>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Image src="/user.svg" alt="user" width={20} height={20} className="sm:w-6 sm:h-6 rounded-full border border-white" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium hidden sm:inline">John Doe</span>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium sm:hidden">JD</span>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-gray-700 font-medium m-[2px]">+1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Details */}
        <div className='w-full h-full flex-7 flex-col'>
          {/* progress steps */}
          <div className="flex justify-between items-center gap-2 w-full bg-white rounded-3xl p-2 mb-4">

            {/* Progress Steps */}
            <div className="flex items-center">
              {/* Application Step - Completed */}
              <div className="flex items-center gap-1 bg-[#23CB0221] border border-[#0000000F] rounded-full px-3 py-2">
                <Image src="/check-cart.svg" alt="check" width={24} height={24} />
                <span className="text-base font-bold font-plus-jakarta text-[#0E4E01] ">Application</span>
              </div>

              {/* Connector Line */}
              <div className="w-4 h-0.5 bg-gray-300"></div>

              {/* T&C Step - Completed */}
              <div className="flex items-center gap-1 bg-white border border-[#D4E9D1] rounded-full px-3 py-2">
                <Image src="/check-cart.svg" alt="check" width={24} height={24} className="opacity-20" />
                <span className="text-base font-bold font-plus-jakarta text-[#0E4E01] mr-6">T&C</span>
              </div>

              {/* Connector Line */}
              <div className="w-4 h-0.5 bg-gray-300"></div>

              {/* Enrol Step - Current */}
              <div className="flex items-center gap-1 bg-white border border-[#D4E9D1] rounded-full px-3 py-2">
                <Image src="/check-cart.svg" alt="check" width={24} height={24} className="opacity-20" />
                <span className="text-base font-bold font-plus-jakarta text-[#0E4E01] mr-6">Enrol</span>
              </div>
            </div>

            {/* Download Brochure Button */}
            <button type="button"
              className="flex items-center gap-2 bg-[#000000] hover:bg-gray-900 text-white px-5 py-3 rounded-[18px] transition-colors"
              style={{ boxShadow: "0px 4px 13px 0px #FFFFFF69 inset" }}>
              <span className="text-sm font-bold font-plus-jakarta text-white">Download Brochure</span>
              <Download className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full h-full flex flex-row gap-4">

            {/* Application Details */}
            <ApplicationDetails />

            {/* Cart Details */}
            <CartDetails />

          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className='w-full h-full flex flex-col gap-4'>
        <SectionContainer>
          <div className="section-header flex flex-col gap-2 text-center">
            <CourseTitle title="FAQ" className="text-text-primary text-[40px]" />
            <p className="text-base text-center text-text-primary font-normal">
              Dive into Artifical Intelligence & Machine Learning projects to sharpen skills and build a unique portfolio
            </p>
          </div>
          <div className="w-full flex flex-col gap-2 sm:gap-3 md:gap-4 min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
            {course.faqs.map((faq, index) => (
              <div key={index} className="border border-[#00000014] rounded-2xl flex-shrink-0 p bg-[#F3F3F3]">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left p-3 sm:p-4 flex justify-between items-start sm:items-center transition-colors cursor-pointer"
                >
                  <p className="text-base sm:text-lg font-medium text-[#000000] pr-2 leading-tight font-plus-jakarta">{faq.question}</p>
                  <span className="text-xl font-medium text-[#000000] transform transition-transform duration-300 flex-shrink-0 mt-1 sm:mt-0">
                    <ChevronDown className="size-4 md:size-5 rotate-0" />
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 sm:max-h-64 md:max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <p className="text-sm sm:text-base text-text-primary leading-relaxed font-plus-jakarta">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionContainer>
      </div>
    </div>
  )
}

export default CourseEnrollCart