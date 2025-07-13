import CourseTitle from "@/components/ui/course/CourseTitle";
import SectionContainer from "@/components/ui/course/SectionContainer";
import { Course } from "@/types";
import { Minus, Plus } from "lucide-react";
import React, { useState } from "react";

const FAQSection = ({ course }: { course: Course }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <SectionContainer>
      <div className="section-header flex flex-col gap-2 text-center">
        <CourseTitle title="FAQ" className="text-[#2B1508] text-[40px]" />
        <p className="text-base text-center text-[#2B1508] font-normal">
          Find answers to common questions about the course.
        </p>
      </div>
      <div className="w-full flex flex-col gap-2 sm:gap-3 md:gap-4 min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
        {course.faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg flex-shrink-0 p-2">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full text-left p-3 sm:p-4 flex justify-between items-start sm:items-center hover:bg-gray-50 transition-colors"
            >
              <p className="text-base sm:text-lg font-bold text-[#2B1508] pr-2 leading-tight">{faq.question}</p>
              <span className="text-xl font-bold text-[#2B1508] transform transition-transform duration-300 flex-shrink-0 mt-1 sm:mt-0">
                {openIndex === index ? (
                  <Minus className="size-4 md:size-5 rotate-0" />
                ) : (
                  <Plus className="size-4 md:size-5 rotate-0" />
                )}
              </span>
            </button>
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === index ? 'max-h-48 sm:max-h-64 md:max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                <p className="text-sm sm:text-base text-[#2B1508] leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};

export default FAQSection;
