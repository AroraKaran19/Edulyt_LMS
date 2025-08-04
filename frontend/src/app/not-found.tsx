"use client";

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import OrangeButton from '@/components/ui/buttons/OrangeButton';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-78px)] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* 404 Animation */}
        <div className="relative mb-8">
          <div className="text-8xl sm:text-9xl lg:text-[12rem] font-bold text-gray-200 select-none">
            404
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
            Oops! Page Not Found
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The page you&apos;re looking for seems to have wandered off. 
            Don&apos;t worry, even the best students sometimes take a wrong turn!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link href="/">
              <OrangeButton className="flex items-center gap-2 min-w-[160px] justify-center">
                <Home className="w-4 h-4" />
                Go Home
              </OrangeButton>
            </Link>
            
            <button 
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-2xl border-2 border-gray-300 hover:border-[#F77124] hover:text-[#F77124] transition-all duration-300 min-w-[160px] justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotFound;