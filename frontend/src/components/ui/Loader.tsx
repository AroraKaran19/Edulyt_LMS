"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Custom animations for the loader
const fadeInAnimation = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const scaleInAnimation = `
  @keyframes scale-in {
    from { 
      opacity: 0; 
      transform: scale(0.9) translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: scale(1) translateY(0); 
    }
  }
`;

// Inject animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = fadeInAnimation + scaleInAnimation;
  document.head.appendChild(style);
}

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
  showProgress?: boolean;
  progress?: number;
}> = ({
  text = "Loading...",
  variant = "spinner",
  size = "lg",
  showProgress = false,
  progress = 0,
}) => {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
      <div className="flex flex-col items-center space-y-6">
        {/* Enhanced Loader with better spacing */}
        <div className="relative">
          <Loader
            size={size}
            variant={variant}
            text=""
            showText={false}
            className="min-w-[80px]"
          />
          {/* Optional progress ring */}
          {showProgress && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-20 h-20 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 45 * (1 - progress / 100)
                  }`}
                  className="text-[#F77124] transition-all duration-300 ease-out"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Enhanced text styling */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-white animate-pulse drop-shadow-lg">
            {text}
          </h3>
          {showProgress && (
            <div className="space-y-2">
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-linear-to-r from-[#F77124] to-[#e65a1a] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-white/80 font-medium drop-shadow">
                {Math.round(progress)}% Complete
              </p>
            </div>
          )}
        </div>

        {/* Optional decorative elements - only show for dots variant */}
        {variant === "dots" && (
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-[#F77124] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-[#F77124] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 bg-[#F77124] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}
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
