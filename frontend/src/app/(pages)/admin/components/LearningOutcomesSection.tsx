import React from 'react';

export default function LearningOutcomesSection() {
  return (
    <div id="learning-outcomes" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
<div className="flex items-center gap-3 mb-6">
  <div className="flex items-center justify-center w-10 h-10 bg-[#F77124] rounded-lg">
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  </div>
  <div>
    <h3 className="text-xl font-semibold text-gray-900">Learning Outcomes</h3>
    <p className="text-sm text-gray-600">Define what students will achieve and who should enroll</p>
  </div>
</div>

<div className="space-y-8">
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-3">
      What Students Will Learn *
    </label>
    <textarea
      rows={6}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
      placeholder="• Master Python programming fundamentals&#10;• Build real-world data science projects&#10;• Understand machine learning algorithms&#10;• Create data visualizations with matplotlib&#10;• Work with pandas for data manipulation&#10;• Deploy models to production environments"
    />
    <div className="flex justify-between items-center mt-2">
      <p className="text-xs text-gray-500">Specific skills and knowledge students will gain (one per line)</p>
      <span className="text-xs text-gray-400">0/800 characters</span>
  </div>
  </div>
  
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Target Audience *
    </label>
    <textarea
        rows={5}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
        placeholder="• Software developers wanting to transition to data science&#10;• Recent graduates in computer science or related fields&#10;• Professionals looking to upskill in Python&#10;• Anyone interested in data analysis and visualization&#10;• Students preparing for data science interviews"
    />
      <p className="text-xs text-gray-500 mt-2">Who will benefit most from this course</p>
  </div>
    
  <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
      Prerequisites
    </label>
    <textarea
        rows={5}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
        placeholder="• Basic understanding of programming concepts&#10;• High school level mathematics&#10;• Familiarity with computers and internet&#10;• No prior Python experience required&#10;• Willingness to learn and practice"
      />
      <p className="text-xs text-gray-500 mt-2">Required knowledge or skills before starting (leave blank if none)</p>
    </div>
  </div>
  
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h4 className="text-sm font-semibold text-green-900 mb-1">Learning Outcomes Best Practices</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Use action verbs (master, build, understand, create, analyze)</li>
          <li>• Be specific about skills and knowledge gained</li>
          <li>• Focus on practical, applicable outcomes</li>
          <li>• Align outcomes with course content and difficulty level</li>
          <li>• Consider what students can achieve after completion</li>
        </ul>
      </div>
    </div>
  </div>
</div>
</div>
  );
}