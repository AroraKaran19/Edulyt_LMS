"use client";

import React from "react";
import { GraduationCap } from "lucide-react";

const CourseDetailsSection = () => {
  return (
    <div id="course-details" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-[#F77124] rounded-lg">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Course Details</h3>
          <p className="text-sm text-gray-600">Categorization and technical specifications</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Category *
            </label>
            <select 
              id="course-category"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
            >
              <option value="">Select Category</option>
              <option value="Data Science">Data Science</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="AI">AI</option>
              <option value="Web Development">Web Development</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Primary subject area for course classification</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Subcategory
            </label>
            <input
              type="text"
              id="course-subcategory"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="e.g., Python, React, TensorFlow"
            />
            <p className="text-xs text-gray-500 mt-1">Specific technology or subtopic within the category</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Skill Level *
            </label>
            <select 
              id="course-skill-level"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
            >
              <option value="">Select Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="College Students">College Students</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Target audience based on their experience level</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Language *
            </label>
            <select 
              id="course-language"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Spanish">Spanish</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Primary language used for course instruction</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Course Duration
            </label>
            <input
              type="text"
              id="course-duration"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="e.g., 45 hours, 6 weeks, 3 months"
            />
            <p className="text-xs text-gray-500 mt-1">Total estimated time to complete the course</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Total Lectures *
            </label>
            <input
              type="number"
              id="course-total-lectures"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="120"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">Total number of video lectures in the course</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsSection; 