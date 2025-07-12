import React from 'react';
import { GraduationCap } from "lucide-react";

const WelcomeContent: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-white">
      <GraduationCap className="w-16 h-16 text-[#F77124] mb-4" />
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
        Welcome to Admin Dashboard
      </h2>
      <p className="text-gray-600">
        Select a menu item to get started
      </p>
    </div>
  );
};

export default WelcomeContent; 