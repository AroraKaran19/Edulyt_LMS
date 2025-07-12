export default function CourseFeaturesSection() {
    return <div id="course-features" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-[#F77124] rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            </div>
            <div>
                <h3 className="text-xl font-semibold text-gray-900">Course Features</h3>
                <p className="text-sm text-gray-600">Highlight key features and organize with tags</p>
            </div>
        </div>

        <div className="space-y-8">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Key Course Features *
                </label>
                <textarea
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                    placeholder="• Lifetime access to course materials&#10;• 30+ hours of video content&#10;• Downloadable resources and templates&#10;• Certificate of completion&#10;• 24/7 community support&#10;• Mobile and desktop access&#10;• Regular content updates&#10;• Money-back guarantee"
                />
                <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">Unique selling points and benefits of your course</p>
                    <span className="text-xs text-gray-400">0/600 characters</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Course Tags
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="python, data-science, machine-learning, beginner-friendly"
                    />
                    <p className="text-xs text-gray-500 mt-2">Comma-separated keywords for search and categorization</p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Course Difficulty
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124] focus:border-transparent transition-all duration-200 text-gray-900 bg-white">
                        <option value="">Select Difficulty Level</option>
                        <option value="beginner">Beginner - No prior experience needed</option>
                        <option value="intermediate">Intermediate - Some background knowledge required</option>
                        <option value="advanced">Advanced - Extensive experience required</option>
                        <option value="all-levels">All Levels - Suitable for everyone</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">Overall difficulty level for course discovery</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Course Format
                    </label>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="video-lectures"
                                className="w-4 h-4 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
                            />
                            <label htmlFor="video-lectures" className="text-sm text-gray-700">Video Lectures</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="hands-on-projects"
                                className="w-4 h-4 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
                            />
                            <label htmlFor="hands-on-projects" className="text-sm text-gray-700">Hands-on Projects</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="quizzes"
                                className="w-4 h-4 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
                            />
                            <label htmlFor="quizzes" className="text-sm text-gray-700">Quizzes & Assessments</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="assignments"
                                className="w-4 h-4 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
                            />
                            <label htmlFor="assignments" className="text-sm text-gray-700">Assignments</label>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Select all applicable content types</p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Additional Features
                    </label>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="certificate"
                                className="w-4 h-4 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
                            />
                            <label htmlFor="certificate" className="text-sm text-gray-700">Certificate of Completion</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="lifetime-access"
                                className="w-4 h-4 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
                            />
                            <label htmlFor="lifetime-access" className="text-sm text-gray-700">Lifetime Access</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="mobile-access"
                                className="w-4 h-4 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
                            />
                            <label htmlFor="mobile-access" className="text-sm text-gray-700">Mobile Access</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="community-access"
                                className="w-4 h-4 text-[#F77124] border-gray-300 rounded focus:ring-[#F77124] focus:ring-2"
                            />
                            <label htmlFor="community-access" className="text-sm text-gray-700">Community Access</label>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Premium features and benefits included</p>
                </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-semibold text-purple-900 mb-1">Feature Highlighting Tips</h4>
                        <ul className="text-sm text-purple-800 space-y-1">
                            <li>• Focus on unique value propositions that set your course apart</li>
                            <li>• Highlight practical benefits students will receive</li>
                            <li>• Use specific numbers (hours of content, number of projects)</li>
                            <li>• Include support and access details (lifetime, mobile, community)</li>
                            <li>• Mention certificates and credentials if applicable</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
}