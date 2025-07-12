import React from 'react';

const SettingsSection = () => {
  return (
    <div id="settings" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-[#F77124] rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Settings</h3>
          <p className="text-sm text-gray-600">Configure course visibility and administrative options</p>
        </div>
      </div>
      
      <div className="space-y-8">
        {/* Course Status */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Course Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#F77124] transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
                defaultChecked
              />
              <div className="ml-3">
                <div className="text-sm font-semibold text-gray-900">Active Course</div>
                <div className="text-xs text-gray-500">Course is live and visible to students</div>
              </div>
            </label>
            
            <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#F77124] transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
              />
              <div className="ml-3">
                <div className="text-sm font-semibold text-gray-900">Featured Course</div>
                <div className="text-xs text-gray-500">Highlight on homepage and listings</div>
              </div>
            </label>
            
            <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#F77124] transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
              />
              <div className="ml-3">
                <div className="text-sm font-semibold text-gray-900">Certified Course</div>
                <div className="text-xs text-gray-500">Provides completion certificate</div>
              </div>
            </label>
          </div>
        </div>

        {/* Enrollment Settings */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Settings</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Maximum Students
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="e.g., 100"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-2">Leave empty for unlimited enrollment</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Enrollment Deadline
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-2">Last date for new enrollments</p>
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Access Control</h4>
          <div className="space-y-4">
            <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#F77124] transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
              />
              <div className="ml-3">
                <div className="text-sm font-semibold text-gray-900">Require Approval</div>
                <div className="text-xs text-gray-500">Manually approve each enrollment request</div>
              </div>
            </label>
            
            <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[#F77124] transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
              />
              <div className="ml-3">
                <div className="text-sm font-semibold text-gray-900">Allow Preview</div>
                <div className="text-xs text-gray-500">Let students preview first lesson before enrollment</div>
              </div>
            </label>
          </div>
        </div>

        {/* Administrative Details */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Administrative Details</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Course Creator *
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="admin"
                defaultValue="admin"
              />
              <p className="text-xs text-gray-500 mt-2">Name of the course creator/instructor</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Course Version
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="1.0"
                defaultValue="1.0"
              />
              <p className="text-xs text-gray-500 mt-2">Version number for content tracking</p>
            </div>
          </div>
        </div>

        {/* Settings Tips */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Course Settings Guidelines</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Keep courses active only when content is complete and tested</li>
                <li>• Featured courses appear prominently in search results</li>
                <li>• Certified courses should meet quality standards</li>
                <li>• Set enrollment limits for cohort-based courses</li>
                <li>• Use approval requirements for premium or exclusive content</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection; 