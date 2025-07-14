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
        {/* Course Thumbnail */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Course Thumbnail URL *
          </label>
          <input
            type="url"
            id="thumbnail-url"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
            placeholder="https://example.com/course-thumbnail.jpg"
          />
          <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF - publicly accessible URL (recommended: 1280x720px)</p>
        </div>

        {/* Promotional Video */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Promotional Video URL
          </label>
          <input
            type="url"
            id="promotional-video-url"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
          />
          <p className="text-xs text-gray-500 mt-2">YouTube, Vimeo, or direct video URL - keep under 2-3 minutes for best engagement</p>
        </div>
        
        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Media Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Thumbnail:</strong> Should be eye-catching and relevant to course content</li>
                <li>• <strong>Videos:</strong> Keep promotional videos under 2-3 minutes for best engagement</li>
                <li>• <strong>URLs:</strong> Ensure all URLs are publicly accessible and properly formatted</li>
                <li>• <strong>Recommended:</strong> Images 1280x720px, Videos 1920x1080px for best quality</li>
                <li>• <strong>Copyright:</strong> Ensure all media is properly licensed for commercial use</li>
                <li>• <strong>Testing:</strong> Always test URLs in a new browser tab to verify accessibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaSection; 