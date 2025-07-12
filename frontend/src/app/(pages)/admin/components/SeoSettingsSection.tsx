import React from 'react';

const SeoSettingsSection = () => {
  return (
    <div id="seo-settings" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-[#F77124] rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">SEO Settings</h3>
          <p className="text-sm text-gray-600">Optimize your course for search engines and discovery</p>
        </div>
      </div>
      
      <div className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Course URL Slug *
          </label>
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 py-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              yoursite.com/courses/
            </span>
            <input
              type="text"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="complete-data-science-bootcamp"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">URL-friendly version of your course title (lowercase, hyphens only)</p>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Meta Title
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
            placeholder="Complete Data Science Bootcamp - Learn Python, ML & AI | YourSite"
            maxLength={60}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Title displayed in search engine results</p>
            <span className="text-xs text-gray-400">0/60 characters</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Meta Description
          </label>
          <textarea
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
            placeholder="Master data science with our comprehensive bootcamp. Learn Python, machine learning, and AI through hands-on projects. Perfect for beginners and professionals."
            maxLength={160}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Description shown in search results (compelling and informative)</p>
            <span className="text-xs text-gray-400">0/160 characters</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Focus Keywords
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="data science, python programming, machine learning"
            />
            <p className="text-xs text-gray-500 mt-2">Primary keywords for search optimization (3-5 keywords)</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Secondary Keywords
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="data analysis, pandas, numpy, scikit-learn"
            />
            <p className="text-xs text-gray-500 mt-2">Additional relevant keywords and phrases</p>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">SEO Preview</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-blue-600 text-lg font-medium hover:underline cursor-pointer">
              Complete Data Science Bootcamp - Learn Python, ML & AI | YourSite
            </div>
            <div className="text-green-600 text-sm mt-1">
              yoursite.com/courses/complete-data-science-bootcamp
            </div>
            <div className="text-gray-600 text-sm mt-2 leading-relaxed">
              Master data science with our comprehensive bootcamp. Learn Python, machine learning, and AI through hands-on projects. Perfect for beginners and professionals.
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-indigo-900 mb-1">SEO Optimization Tips</h4>
              <ul className="text-sm text-indigo-800 space-y-1">
                <li>• Keep meta titles under 60 characters for full display</li>
                <li>• Write compelling meta descriptions (150-160 characters)</li>
                <li>• Use URL-friendly slugs (lowercase, hyphens, no spaces)</li>
                <li>• Include primary keywords naturally in title and description</li>
                <li>• Make descriptions actionable and benefit-focused</li>
                <li>• Avoid keyword stuffing - focus on readability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoSettingsSection; 