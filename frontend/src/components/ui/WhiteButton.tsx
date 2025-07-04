"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WhiteButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const WhiteButton = ({ children, className, onClick }: WhiteButtonProps) => {
  return (
    <button
      className={cn(
        "bg-white text-black px-6 py-3 rounded-2xl border border-gray-200 cursor-pointer shadow-sm",
        className,
        "lg:px-4 lg:py-2.5"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default WhiteButton;
