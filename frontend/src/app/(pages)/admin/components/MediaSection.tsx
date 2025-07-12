"use client";

import React from "react";

const MediaSection = () => {
  return (
    <div id="media" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-[#F77124] rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Media</h3>
          <p className="text-sm text-gray-600">Visual content and preview materials</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Course Thumbnail *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#F77124] transition-colors duration-200">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="thumbnail-upload"
            />
            <label
              htmlFor="thumbnail-upload"
              className="cursor-pointer block"
            >
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 mb-1">Click to upload thumbnail</span>
                <span className="text-xs text-gray-500">or drag and drop</span>
              </div>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 2MB (recommended: 1280x720px)</p>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Preview Image *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#F77124] transition-colors duration-200">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="preview-image-upload"
            />
            <label
              htmlFor="preview-image-upload"
              className="cursor-pointer block"
            >
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 mb-1">Click to upload preview image</span>
                <span className="text-xs text-gray-500">or drag and drop</span>
              </div>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 2MB - showcases course content preview</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Image Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use high-quality, professional images (PNG, JPG, GIF)</li>
                <li>• Thumbnail should be eye-catching and relevant to course content</li>
                <li>• Preview image should showcase key course materials or outcomes</li>
                <li>• Ensure images are properly licensed for commercial use</li>
                <li>• Recommended dimensions: 1280x720px for best display quality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaSection; 