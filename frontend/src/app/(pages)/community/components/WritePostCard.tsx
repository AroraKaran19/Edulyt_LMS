"use client";

import { Plus } from "lucide-react";

const WritePostCard = () => {
  return (
    <div className="w-full max-w-lg bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4 mt-6">
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-orange-100">
          {/* Placeholder for user avatar */}
          <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-xs">Avatar</span>
          </div>
        </div>
        <div>
          <h3 className="font-bold text:md sm:text-lg text-gray-900 leading-tight">Aman Sharma</h3>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <span className="text-[#F77124] font-bold">5</span>
              <span className="text-yellow-400">★</span>
              <span className="text-xs font-bold text-gray-400 ml-1">SP</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-900">8</span>
              <span className="text-xs font-bold text-gray-400 ml-1">Reviews</span>
            </div>
          </div>
        </div>
      </div>

      <button className="bg-[#F77124] text-xs sm:text-base text-white font-bold px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-[#e66013] transition-colors shadow-[0_4px_12px_rgba(247,113,36,0.3)]">
        <Plus size={20} strokeWidth={3} />
        <span className="hidden sm:block">Write a post</span>
      </button>
    </div>
  );
};

export default WritePostCard;
