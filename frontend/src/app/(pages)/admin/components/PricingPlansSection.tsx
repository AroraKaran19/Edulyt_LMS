"use client";

import React from "react";

const PricingPlansSection = () => {
  return (
    <div id="pricing" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-[#F77124] rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Pricing Plans</h3>
          <p className="text-sm text-gray-600">Set pricing for different student segments</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Professionals Plan */}
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#F77124] transition-colors duration-200 relative">
            <div className="absolute -top-3 left-4">
              <span className="bg-[#F77124] text-white px-3 py-1 rounded-full text-xs font-semibold">
                PROFESSIONAL
              </span>
            </div>
            <div className="mt-2">
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Professionals Plan</h4>
              <p className="text-sm text-gray-600 mb-4">For working professionals and industry experts</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="299"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Standard pricing for professional learners</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Plan Features *
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                    placeholder="• Full course access&#10;• Certificate of completion&#10;• Priority support&#10;• Downloadable resources"
                  />
                  <p className="text-xs text-gray-500 mt-1">List key features included in this plan (one per line)</p>
                </div>
              </div>
            </div>
          </div>

          {/* College Students Plan */}
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#F77124] transition-colors duration-200 relative">
            <div className="absolute -top-3 left-4">
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                STUDENT
              </span>
            </div>
            <div className="mt-2">
              <h4 className="text-lg font-semibold text-gray-900 mb-1">College Students Plan</h4>
              <p className="text-sm text-gray-600 mb-4">Discounted pricing for college students</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="199"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Discounted rate for verified college students</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Plan Features *
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                    placeholder="• Full course access&#10;• Certificate of completion&#10;• Student community access&#10;• Career guidance resources"
                  />
                  <p className="text-xs text-gray-500 mt-1">List key features included in this plan (one per line)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1">Pricing Strategy Tips</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Consider market research when setting prices</li>
                <li>• Student discounts typically range from 30-50% off professional pricing</li>
                <li>• Include clear value propositions in your feature lists</li>
                <li>• Regularly review and adjust pricing based on demand</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlansSection; 