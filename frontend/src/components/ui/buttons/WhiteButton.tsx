"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WhiteButtonProps {
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
  disabled?: boolean;
}

const WhiteButton = ({
  type,
  children,
  className,
  onClick,
  glow,
  disabled = false,
}: WhiteButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        "bg-white text-black px-6 py-3 rounded-2xl border border-gray-200 shadow-[inset_0_-2px_2px_0_rgba(0,0,0,0.1)]",
        className,
        "lg:px-4 lg:py-2.5",
        disabled 
          ? "cursor-not-allowed opacity-50" 
          : "cursor-pointer",
        !disabled && glow &&
          "hover:shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] hover:bg-gradient-to-br from-[#fff] to-[#f77124]/5 transition-all duration-300 ease-in-out"
      )}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default WhiteButton;
