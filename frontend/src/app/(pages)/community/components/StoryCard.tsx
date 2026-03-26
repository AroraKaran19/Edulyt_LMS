"use client";

import { Linkedin, Heart, MessageCircle } from "lucide-react";

interface StoryCardProps {
  user: {
    name: string;
    avatar?: string;
    college: string;
    role: string;
    company: string;
  };
  title: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

const StoryCard = ({ user, title, content, likes, comments, timeAgo }: StoryCardProps) => {
  return (
    <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            {/* Placeholder for user avatar */}
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
              Avatar
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900">{user.name}</h4>
              <Linkedin className="text-black fill-transparent" size={16} />
            </div>
            <p className="text-xs font-bold text-gray-500">{user.college}</p>
            <p className="text-[10px] font-bold text-[#F77124]">
              {user.role} at <span className="text-[#F77124]">{user.company}</span>
            </p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-extrabold text-gray-900 mb-2 leading-tight">
        {title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6">
        {content}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Heart className="text-red-500 fill-red-500 group-hover:scale-110 transition-transform" size={18} />
            <span className="text-sm font-bold text-gray-500">{likes}</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer">
            <MessageCircle className="text-gray-400 group-hover:scale-110 transition-transform" size={18} />
            <span className="text-sm font-bold text-gray-500">{comments}</span>
          </div>
        </div>
        <span className="text-xs font-bold text-gray-400">{timeAgo}</span>
      </div>
    </div>
  );
};

export default StoryCard;
