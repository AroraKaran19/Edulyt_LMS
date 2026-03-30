"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

interface OrangeButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  blinkIcon?: boolean;
  glow?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const OrangeButton = ({
  children,
  className,
  onClick,
  blinkIcon,
  glow = true,
  disabled = false,
  type = "button",
}: OrangeButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "bg-[#F77124] text-white px-6 py-3 rounded-2xl cursor-pointer",
        glow && "shadow-[0_0_2px_3px_rgba(247,173,36,1)]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {blinkIcon && (
        <Circle className="w-2 h-2 animate-pulse fill-[#f7ad24] text-[#F7AD24]" />
      )}
      {children}
    </button>
  );
};

export default OrangeButton;
