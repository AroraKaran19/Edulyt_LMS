"use client";

import React from "react";
import { BookOpen } from "lucide-react";

const BasicInformationSection = () => {
  return (
    <div id="basic-info" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-[#F77124] rounded-lg">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
          <p className="text-sm text-gray-600">Essential details about your course</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Course Title *
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="e.g., Complete Data Science Bootcamp"
            />
            <p className="text-xs text-gray-500 mt-1">This will be the main title displayed to students</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Subtitle
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="e.g., Master Python, Pandas, NumPy, and Machine Learning"
            />
            <p className="text-xs text-gray-500 mt-1">Additional context about what students will learn</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Course Description *
          </label>
          <textarea
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
            placeholder="Provide a comprehensive description of your course. Include what students will learn, the teaching approach, and any unique features..."
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Detailed explanation of course content and objectives</p>
            <span className="text-xs text-gray-400">0/500 characters</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Short Description
          </label>
          <textarea
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
            placeholder="A brief, compelling summary that will appear in course listings and search results..."
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Concise summary for course previews and search results</p>
            <span className="text-xs text-gray-400">0/150 characters</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInformationSection; 