"use client";
import React, { useState } from "react";
import CourseTitle from "@/components/ui/course/CourseTitle";
import SectionContainer from "@/components/ui/course/SectionContainer";
import { ChevronDown, Star, Download } from "lucide-react";
import Image from "next/image";
import ApplicationDetails from "./ApplicationDetails";
import CartDetails from "./CartDetails";
import EnrollmentDetails from "./EnrollmentDetails";
import TermsConditions from "./TermsConditions";

const CourseEnrollCart = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Handle step transitions
  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
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
    <div className='w-full h-full flex flex-col gap-4 sm:gap-6 px-2 sm:px-4 lg:px-0'>
      {/* Cart Details */}
      <div className='w-full h-full flex flex-col lg:flex-row gap-4'>
        {/* Course Image Section */}
        <div className='w-full lg:flex-3 bg-white rounded-2xl sm:rounded-3xl p-1 sm:p-[6px]'>
          <div className="w-full h-full">
            <div className="relative w-full rounded-xl sm:rounded-[18px] overflow-hidden mb-2 sm:mb-3">
              <Image 
                src="/cart-ai-image.png"
                alt="certificate" 
                width={300} 
                height={226}
                className="w-full h-full object-cover min-h-[200px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-[620px]"
              />
              
              {/* Overlay Content */}
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 px-1 sm:px-2 w-full pr-4 sm:pr-6">
                {/* Best Seller Badge */}
                <div className="mb-2 sm:mb-3">
                  <p className="font-bold text-xs sm:text-sm md:text-lg font-plus-jakarta text-[#F7AD24] px-2 py-1 rounded"
                    style={{ background: "linear-gradient(89.99deg, rgba(247, 191, 36, 0.23) 0.19%, rgba(255, 217, 195, 0) 99.99%)" }}>
                    Best seller
                    <span className="font-medium text-xs sm:text-sm md:text-lg font-plus-jakarta text-[#F7AD2496] leading-[173%] block sm:inline">
                      (enrolled by 35k students)
                    </span>
                  </p>
                </div>

                {/* Course Title */}
                <p className="font-normal text-sm sm:text-lg md:text-xl font-coolvetica mb-2 sm:mb-3 text-white">
                  Data Science: Zero to Hundred
                </p>

                {/* Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#F7AD24]" fill="#F7AD24" />
                    <span className="font-bold text-xs sm:text-sm md:text-lg font-plus-jakarta text-[#F7AD24]">4.5 Rating</span>
                  </div>
                  <span className="font-normal text-xs sm:text-sm md:text-lg font-plus-jakarta text-white leading-[173%]">
                    (more than 6,000 reviews)
                  </span>
                </div>

                {/* User Avatars */}
                <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                  <div className="bg-[#EEEEEE] rounded-full sm:rounded-[34px] p-1 sm:p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Image src="/user.svg" alt="user" width={16} height={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border border-white" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium hidden md:inline pr-1 sm:pr-2">John Doe</span>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium md:hidden pr-1 sm:pr-2">JD</span>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-full sm:rounded-[34px] p-1 sm:p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Image src="/user.svg" alt="user" width={16} height={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border border-white" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium hidden md:inline pr-1 sm:pr-2">John Doe</span>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium md:hidden pr-1 sm:pr-2">JD</span>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-full sm:rounded-[34px] p-1 sm:p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-gray-700 font-medium px-2 py-1">+1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Details Section */}
        <div className='w-full lg:flex-7 flex flex-col'>
          {/* Progress Steps */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2 w-full bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-2 mb-4">
            {/* Progress Steps */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto">
              <div className="flex items-center w-full sm:w-auto">
                {/* Application Step */}
                <div className={`flex items-center gap-1 sm:gap-2 ${currentStep >= 1 ? 'bg-[#23CB0221] border border-[#0000000F]' : 'bg-white border border-[#D4E9D1]'} rounded-full px-2 sm:px-3 py-2`}>
                  <Image src="/check-cart.svg" alt="check" width={20} height={20} className={`sm:w-6 sm:h-6 ${currentStep >= 1 ? '' : 'opacity-20'}`} />
                  <span className="text-sm sm:text-base font-bold font-plus-jakarta text-[#0E4E01]">Application</span>
                </div>

                {/* Connector Line */}
                <div className="w-2 sm:w-4 h-0.5 bg-gray-300 hidden sm:block"></div>

                {/* T&C Step */}
                <div className={`flex items-center gap-1 sm:gap-2 ${currentStep >= 2 ? 'bg-[#23CB0221] border border-[#0000000F]' : 'bg-white border border-[#D4E9D1]'} rounded-full px-2 sm:px-3 py-2 ml-2 sm:ml-0`}>
                  <Image src="/check-cart.svg" alt="check" width={20} height={20} className={`sm:w-6 sm:h-6 ${currentStep >= 2 ? '' : 'opacity-20'}`} />
                  <span className="text-sm sm:text-base font-bold font-plus-jakarta text-[#0E4E01]">T&C</span>
                </div>

                {/* Connector Line */}
                <div className="w-2 sm:w-4 h-0.5 bg-gray-300 hidden sm:block"></div>

                {/* Enrol Step */}
                <div className={`flex items-center gap-1 sm:gap-2 ${currentStep >= 3 ? 'bg-[#23CB0221] border border-[#0000000F]' : 'bg-white border border-[#D4E9D1]'} rounded-full px-2 sm:px-3 py-2 ml-2 sm:ml-0`}>
                  <Image src="/check-cart.svg" alt="check" width={20} height={20} className={`sm:w-6 sm:h-6 ${currentStep >= 3 ? '' : 'opacity-20'}`} />
                  <span className="text-sm sm:text-base font-bold font-plus-jakarta text-[#0E4E01]">Enrol</span>
                </div>
              </div>
            </div>

            {/* Download Brochure Button */}
            <button type="button"
              className="flex items-center gap-2 bg-[#000000] hover:bg-gray-900 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-[18px] transition-colors w-full sm:w-auto justify-center"
              style={{ boxShadow: "0px 4px 13px 0px #FFFFFF69 inset" }}>
              <span className="text-xs sm:text-sm font-bold font-plus-jakarta text-white">Download Brochure</span>
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="w-full h-full flex flex-col xl:flex-row gap-4">
            {/* Step Content */}
            <div className="w-full xl:flex-1">
              {currentStep === 1 && <ApplicationDetails onNext={handleNextStep} />}
              {currentStep === 2 && <TermsConditions onNext={handleNextStep} />}
              {currentStep === 3 && <EnrollmentDetails />}
            </div>

            {/* Cart Details */}
            <div className="w-full xl:w-80 xl:flex-shrink-0">
              <CartDetails />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className='w-full flex flex-col gap-4'>
        <SectionContainer>
          <div className="section-header flex flex-col gap-2 sm:gap-4 text-center mb-6 sm:mb-8">
            <CourseTitle title="FAQ" className="text-text-primary text-2xl sm:text-3xl md:text-[40px]" />
            <p className="text-sm sm:text-base text-center text-text-primary font-normal px-2 sm:px-4 lg:px-0">
              Dive into Artifical Intelligence & Machine Learning projects to sharpen skills and build a unique portfolio
            </p>
          </div>
          
          <div className="w-full flex flex-col gap-2 sm:gap-3 md:gap-4 min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
            {course.faqs.map((faq, index) => (
              <div key={index} className="border border-[#00000014] rounded-xl sm:rounded-2xl bg-[#F3F3F3] overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left p-3 sm:p-4 md:p-5 flex justify-between items-start transition-colors cursor-pointer hover:bg-[#EEEEEE]"
                >
                  <p className="text-sm sm:text-base md:text-lg font-medium text-[#000000] pr-2 sm:pr-4 leading-tight font-plus-jakarta">
                    {faq.question}
                  </p>
                  <span className="text-xl font-medium text-[#000000] transform transition-transform duration-300 flex-shrink-0 mt-0.5">
                    <ChevronDown 
                      className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-transform duration-300 ${
                        openIndex === index ? 'rotate-180' : 'rotate-0'
                      }`} 
                    />
                  </span>
                </button>
                
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index 
                      ? 'max-h-48 sm:max-h-64 md:max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 md:pb-5">
                    <p className="text-sm sm:text-base text-text-primary leading-relaxed font-plus-jakarta">
                      {faq.answer}
                    </p>
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