"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WhiteButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
}

const WhiteButton = ({ children, className, onClick, glow }: WhiteButtonProps) => {
  return (
    <button
      className={cn(
        "bg-white text-black px-6 py-3 rounded-2xl border border-gray-200 cursor-pointer shadow-sm",
        className,
        "lg:px-4 lg:py-2.5",
        glow && "hover:shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] hover:bg-gradient-to-br from-[#fff] to-[#f77124]/5 transition-all duration-300 ease-in-out"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default WhiteButton;
