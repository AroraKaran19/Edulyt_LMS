"use client";

import React from "react";
import { cn } from "@/lib/utils";

const categories = [
  "All",
  "Career Switch",
  "Interviews",
  "Projects",
  "Campus Placements",
  "Freshers",
  "On Job",
  "Internships",
  "Articles",
];

const CommunitySidebar = ({ activeCategory = "All" }: { activeCategory?: string }) => {
  return (
    <div className="w-full max-w-60 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
      <ul className="flex flex-col gap-2">
        {categories.map((category) => (
          <li key={category}>
            <button
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl font-bold transition-all",
                activeCategory === category
                  ? "bg-orange-50 text-[#F77124] shadow-[0_2px_8px_rgba(247,113,36,0.1)]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommunitySidebar;
