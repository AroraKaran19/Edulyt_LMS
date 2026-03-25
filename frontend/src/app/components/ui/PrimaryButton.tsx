"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "gradient";
  size?: "sm" | "md" | "lg";
}

export function PrimaryButton({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: PrimaryButtonProps) {
  const baseStyles = "shrink-0 rounded-2xl font-bold text-white cursor-pointer transition hover:opacity-95";
  
  const variantStyles = {
    primary: "bg-[#F77124] shadow-[0_0_0_2px_rgba(247,113,36,0.4)] cursor-pointer",
    gradient: "bg-gradient-to-br from-[#F77124] to-[#fb923c] cursor-pointer shadow-[0_12px_30px_-8px_rgba(247,113,36,0.5)] hover:shadow-[0_15px_35px_-8px_rgba(247,113,36,0.6)] hover:translate-y-[-2px] active:translate-y-[0] active:scale-95",
  };

  const sizeStyles = {
    sm: "px-5 py-2.5 text-sm",
    md: "px-8 py-4 text-base",
    lg: "px-12 py-5 text-lg",
  };

  return (
    <button
      type="button"
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
