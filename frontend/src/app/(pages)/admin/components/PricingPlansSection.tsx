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
          <p className="text-sm text-gray-600">Set pricing for different student segments and plan tiers</p>
        </div>
      </div>
      
      <div className="space-y-8">
        {/* Professionals Plans */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-[#F77124] text-white px-3 py-1 rounded-full text-xs font-semibold">PROFESSIONALS</span>
            Working professionals and industry experts
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Professionals Elite Plan */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#F77124] transition-colors duration-200 relative">
              <div className="absolute -top-3 left-4">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  ELITE
                </span>
              </div>
              <div className="mt-2">
                <h5 className="text-lg font-semibold text-gray-900 mb-1">Elite Plan</h5>
                <p className="text-sm text-gray-600 mb-4">Premium features and personalized support</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Elite Price (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900"
                        placeholder="499"
                        min="0"
                        step="0.01"
                        id="professionals-elite-price"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Elite Features *
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                      placeholder="Full course access&#10;Certificate of completion&#10;1-on-1 mentoring sessions&#10;Priority support&#10;Downloadable resources&#10;Live Q&A sessions"
                      id="professionals-elite-features"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Professionals Essential Plan */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#F77124] transition-colors duration-200 relative">
              <div className="absolute -top-3 left-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  ESSENTIAL
                </span>
              </div>
              <div className="mt-2">
                <h5 className="text-lg font-semibold text-gray-900 mb-1">Essential Plan</h5>
                <p className="text-sm text-gray-600 mb-4">Core features for professional learning</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Essential Price (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900"
                        placeholder="299"
                        min="0"
                        step="0.01"
                        id="professionals-essential-price"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Essential Features *
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                      placeholder="Full course access&#10;Certificate of completion&#10;Community support&#10;Downloadable resources"
                      id="professionals-essential-features"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* College Students Plans */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">COLLEGE STUDENTS</span>
            Discounted pricing for verified college students
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* College Students Elite Plan */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#F77124] transition-colors duration-200 relative">
              <div className="absolute -top-3 left-4">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  ELITE
                </span>
              </div>
              <div className="mt-2">
                <h5 className="text-lg font-semibold text-gray-900 mb-1">Elite Plan</h5>
                <p className="text-sm text-gray-600 mb-4">Premium student experience with career support</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Elite Price (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900"
                        placeholder="299"
                        min="0"
                        step="0.01"
                        id="college-students-elite-price"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Elite Features *
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                      placeholder="Full course access&#10;Certificate of completion&#10;Career guidance sessions&#10;Student community access&#10;Resume review service&#10;Interview preparation"
                      id="college-students-elite-features"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* College Students Essential Plan */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#F77124] transition-colors duration-200 relative">
              <div className="absolute -top-3 left-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  ESSENTIAL
                </span>
              </div>
              <div className="mt-2">
                <h5 className="text-lg font-semibold text-gray-900 mb-1">Essential Plan</h5>
                <p className="text-sm text-gray-600 mb-4">Affordable access to core learning materials</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Essential Price (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900"
                        placeholder="149"
                        min="0"
                        step="0.01"
                        id="college-students-essential-price"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Essential Features *
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                      placeholder="Full course access&#10;Certificate of completion&#10;Student community access&#10;Basic career resources"
                      id="college-students-essential-features"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pricing Strategy Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1">Pricing Strategy Tips</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• <strong>Elite Plans:</strong> Include premium features like 1-on-1 mentoring and priority support</li>
                <li>• <strong>Essential Plans:</strong> Focus on core learning materials and community access</li>
                <li>• <strong>Student Discounts:</strong> Typically 40-60% off professional pricing</li>
                <li>• <strong>Value Proposition:</strong> Clearly differentiate between Elite and Essential offerings</li>
                <li>• <strong>Market Research:</strong> Regularly review and adjust pricing based on demand and competition</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlansSection; 