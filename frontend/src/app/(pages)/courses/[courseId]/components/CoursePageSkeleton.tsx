import React from 'react';

const CoursePageSkeleton = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center gap-6 bg-gray-50">
      {/* Course Header Skeleton */}
      <div className="course-header w-full h-auto bg-white rounded-2xl py-4 px-4 lg:px-[13%] md:py-8 flex flex-col items-center animate-pulse">
        {/* Video Skeleton */}
        <div className="course-preview-video w-full mt-2 flex flex-col items-center">
          <div className="w-full min-h-[200px] max-h-[270px] bg-gray-300 rounded-xl"></div>
        </div>
        
        {/* Course Header Content Skeleton */}
        <div className="course-header-content w-full my-6 flex flex-col gap-6">
          <div className="course-details w-full flex flex-col lg:flex-row">
            <div className="course-details-content-left w-full lg:w-3/5">
              {/* Bestseller Badge Skeleton */}
              <div className="flex items-center gap-2 mb-5">
                <div className="h-6 w-24 bg-gray-300 rounded"></div>
                <div className="h-6 w-32 bg-gray-300 rounded"></div>
              </div>
              
              {/* Title and Subtitle Skeleton */}
              <div className="course-info flex flex-col gap-2 mt-5">
                <div className="h-8 w-3/4 bg-gray-300 rounded"></div>
                <div className="h-5 w-full bg-gray-300 rounded"></div>
              </div>
            </div>
            
            <div className="course-details-content-right w-full lg:w-2/5 flex flex-col gap-4 mt-3 lg:mt-0 items-center lg:items-end justify-center">
              {/* Discount Countdown Skeleton */}
              <div className="h-6 w-48 bg-gray-300 rounded"></div>
              {/* Enroll Button Skeleton */}
              <div className="h-12 w-32 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-full h-0.5 bg-gray-300"></div>
          
          {/* Course Information Skeleton */}
          <div className="course-information w-full flex flex-row flex-wrap sm:flex-nowrap md:justify-between lg:justify-start gap-4 md:gap-20">
            <div className="rating-container w-full md:w-max flex flex-col items-center md:items-start gap-2">
              <div className="h-4 w-12 bg-gray-300 rounded"></div>
              <div className="flex gap-2 items-center">
                <div className="h-5 w-5 bg-gray-300 rounded"></div>
                <div className="h-6 w-8 bg-gray-300 rounded"></div>
                <div className="h-4 w-24 bg-gray-300 rounded"></div>
              </div>
            </div>
            <div className="course-proficency w-full md:w-max flex flex-col items-center md:items-start gap-2">
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
              <div className="h-6 w-16 bg-gray-300 rounded"></div>
            </div>
            <div className="course-total-time w-full md:w-max flex flex-col items-center md:items-start gap-2">
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
              <div className="h-6 w-16 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scholarship Banner Skeleton */}
      <div className="w-full bg-gradient-to-r from-orange-100 to-orange-200 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-6 w-48 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-300 rounded"></div>
          </div>
          <div className="h-10 w-24 bg-gray-300 rounded-lg"></div>
        </div>
      </div>

      {/* Testimonial Section Skeleton */}
      <div className="testimonial-section w-full bg-white rounded-2xl py-4 px-8 lg:px-[13%] md:py-10 flex flex-col items-center justify-center gap-8 animate-pulse">
        <div className="w-full h-0.75 bg-gray-300"></div>
        <div className="h-8 w-64 bg-gray-300 rounded"></div>
        
        {/* Stats Grid Skeleton */}
        <div className="how-it-helped w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="how-it-helped-item w-full py-4 flex flex-col gap-1.5 items-center justify-center border-2 border-gray-200 rounded-2xl">
              <div className="h-8 w-16 bg-gray-300 rounded"></div>
              <div className="h-4 w-24 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
        
        {/* Testimonial Cards Skeleton */}
        <div className="testimonial-cards w-full flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-80 h-48 bg-gray-300 rounded-xl"></div>
          ))}
        </div>
      </div>

      {/* Course Overview Section Skeleton */}
      <div className="course-overview-section w-full bg-white rounded-2xl py-10 flex flex-col items-center justify-center px-5 md:px-[13%] animate-pulse">
        {/* Tab Switcher Skeleton */}
        <div className="tab-switcher w-full p-1.5 flex items-center bg-gray-100 rounded-full mb-8">
          <div className="w-1/2 h-12 bg-gray-300 rounded-full"></div>
          <div className="w-1/2 h-12 bg-gray-200 rounded-full"></div>
        </div>
        
        {/* Content Skeleton */}
        <div className="w-full space-y-4">
          <div className="h-6 w-full bg-gray-300 rounded"></div>
          <div className="h-6 w-5/6 bg-gray-300 rounded"></div>
          <div className="h-6 w-4/5 bg-gray-300 rounded"></div>
          <div className="h-6 w-full bg-gray-300 rounded"></div>
          <div className="h-6 w-3/4 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default CoursePageSkeleton; 