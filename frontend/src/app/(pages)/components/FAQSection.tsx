"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqItems } from "@/constants/internshipData";
import { cn } from "@/lib/utils";

const FAQSection = () => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 mt-16 lg:mt-24 bg-[#fffcfa] py-8 sm:py-12">
      {/* Title Section */}
      <div className="text-center mb-6 sm:mb-8 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 text-[#F77124]">
          FAQ
        </h2>
        <p className="text-black text-sm sm:text-base lg:text-lg mt-3 sm:mt-4 px-2">
          Dive into Artificial Intelligence & Machine Learning projects to
          sharpen skills and build a unique portfolio
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-3 sm:space-y-4">
          {faqItems.map((item) => {
            const isOpen = openItems.has(item.id);
            return (
              <div
                key={item.id}
                className="bg-[#f3f3f3] rounded-lg sm:rounded-xl overflow-hidden transition-all"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-4 sm:px-6 cursor-pointer py-3 sm:py-4 flex items-center justify-between text-left hover:bg-gray-200 transition-colors gap-2 sm:gap-4"
                >
                  <span className="text-gray-900 font-medium text-sm sm:text-base pr-2 sm:pr-4 flex-1">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 text-gray-600 shrink-0 transition-transform duration-300",
                      isOpen && "transform rotate-180"
                    )}
                  />
                </button>

                {/* Answer Content */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-4 sm:px-6 py-3 sm:py-4 text-gray-700 bg-white text-sm sm:text-base">
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQSection;

