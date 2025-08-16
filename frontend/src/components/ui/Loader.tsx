"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
  text?: string;
  showText?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  size = "md",
  variant = "spinner",
  className,
  text = "Loading...",
  showText = false,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const renderSpinner = () => (
    <div
      className={cn(
        "border-2 border-gray-200 border-t-[#F77124] rounded-full animate-spin",
        sizeClasses[size]
      )}
    />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "bg-[#F77124] rounded-full animate-pulse",
            size === "sm" && "w-1.5 h-1.5",
            size === "md" && "w-2 h-2",
            size === "lg" && "w-2.5 h-2.5",
            size === "xl" && "w-3 h-3"
          )}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div
      className={cn(
        "bg-[#F77124] rounded-full animate-pulse shadow-[0_0_2px_3px_rgba(247,173,36,0.3)]",
        sizeClasses[size]
      )}
    />
  );

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      {renderLoader()}
      {showText && (
        <p
          className={cn(
            "text-[#2B1508] font-medium animate-pulse",
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
};

// Full screen loader variant
export const FullScreenLoader: React.FC<{
  text?: string;
  variant?: "spinner" | "dots" | "pulse";
  size?: "sm" | "md" | "lg" | "xl";
}> = ({ text = "Loading...", variant = "spinner", size = "lg" }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <Loader
          size={size}
          variant={variant}
          text={text}
          showText={true}
          className="min-w-[120px]"
        />
      </div>
    </div>
  );
};

// Inline loader variant
export const InlineLoader: React.FC<{
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
}> = ({ size = "sm", variant = "spinner", className }) => {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <Loader size={size} variant={variant} />
    </div>
  );
};

// Button loader variant
export const ButtonLoader: React.FC<{
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ size = "sm", className }) => {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Loader size={size} variant="spinner" />
      <span className="text-sm font-medium">Loading...</span>
    </div>
  );
};

export default Loader;
