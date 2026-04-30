"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WhiteButton2Props {
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
  disabled?: boolean;
}

const WhiteButton2 = ({
  type,
  children,
  className,
  onClick,
  glow,
  disabled = false,
  ...props
}: WhiteButton2Props & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      type={type}
      className={cn(
        "bg-[#FFF6F2] text-black px-6 py-3 rounded-xl border border-primary shadow-[inset_0_-2px_2px_0_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 ease-in-out",
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

export default WhiteButton2;
