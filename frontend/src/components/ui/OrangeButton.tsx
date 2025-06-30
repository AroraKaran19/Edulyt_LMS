"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

interface OrangeButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  blinkIcon?: boolean;
  glow?: boolean;
}

const OrangeButton = ({ children, className, onClick, blinkIcon, glow }: OrangeButtonProps) => {
  return (
    <button
      className={cn(
        "bg-[#F77124] text-white px-6 py-3 rounded-2xl cursor-pointer",
        className,
        blinkIcon && "flex items-center gap-2",
        glow && "shadow-[0_0_2px_3px_rgba(247,173,36,1)]",
        "lg:px-4 lg:py-2.5"
      )}
      onClick={onClick}
    >
      {blinkIcon && (
        <Circle className="w-2 h-2 animate-pulse fill-[#f7ad24] text-[#F7AD24]" />
      )}
      {children}
    </button>
  );
};

export default OrangeButton;
