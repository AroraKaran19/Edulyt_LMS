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
  ...props
}: WhiteButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-2xl border border-gray-200 shadow-[inset_0_-2px_2px_0_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 ease-in-out",
        className,
        "lg:px-4 lg:py-2.5",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        !disabled &&
          glow &&
          "hover:shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] hover:bg-linear-to-br from-white to-primary/5 transition-all duration-300 ease-in-out",
      )}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default WhiteButton;
