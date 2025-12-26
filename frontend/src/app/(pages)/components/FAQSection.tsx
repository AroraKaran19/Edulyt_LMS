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
    <div className="px-4 lg:px-8 xl:px-12 mt-16 lg:mt-24 bg-white py-12">
      {/* Title Section */}
      <div className="text-center mb-8 max-w-4xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#F77124]">
          FAQ
        </h2>
        <p className="text-gray-700 text-base lg:text-lg mt-4">
          Dive into Artificial Intelligence & Machine Learning projects to
          sharpen skills and build a unique portfolio
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {faqItems.map((item) => {
            const isOpen = openItems.has(item.id);
            return (
              <div
                key={item.id}
                className="bg-gray-100 rounded-lg overflow-hidden transition-all"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-200 transition-colors"
                >
                  <span className="text-gray-900 font-medium pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-gray-600 flex-shrink-0 transition-transform duration-300",
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
                  <div className="px-6 py-4 text-gray-700 bg-white">
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

