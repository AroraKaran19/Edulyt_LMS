import React from "react";
import { AlertCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorProps {
  // Icon props
  icon?: LucideIcon;
  iconSize?: "sm" | "md" | "lg" | "xl";
  iconColor?: string;
  
  // Content props
  title?: string;
  description?: string;
  
  // Container props
  containerHeight?: string;
  
  // Action props
  showAction?: boolean;
  actionText?: string;
  onActionClick?: () => void;
  actionClassName?: string;
  
  // Styling props
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
}

const Error: React.FC<ErrorProps> = ({
  icon: Icon = AlertCircle,
  iconSize = "lg",
  iconColor = "text-red-500",
  title = "Something went wrong",
  description = "There was a problem loading the content. Please try again later.",
  containerHeight = "h-64",
  showAction = false,
  actionText = "Try Again",
  onActionClick,
  actionClassName,
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
  contentClassName,
}) => {
  const getIconSize = () => {
    switch (iconSize) {
      case "sm":
        return "w-6 h-6";
      case "md":
        return "w-8 h-8";
      case "lg":
        return "w-12 h-12";
      case "xl":
        return "w-16 h-16";
      default:
        return "w-12 h-12";
    }
  };

  return (
    <div className={cn("flex justify-center items-center", containerHeight, className)}>
      <div className={cn("flex flex-col items-center gap-4 text-center", contentClassName)}>
        <Icon 
          className={cn(getIconSize(), iconColor, iconClassName)} 
        />
        <div>
          <h3 className={cn("text-lg font-semibold text-gray-800 mb-2", titleClassName)}>
            {title}
          </h3>
          <p className={cn("text-gray-600", descriptionClassName)}>
            {description}
          </p>
          {showAction && onActionClick && (
            <button
              onClick={onActionClick}
              className={cn(
                "mt-4 px-4 py-2 bg-[#f77124] text-white rounded-lg hover:bg-[#e6651f] transition-colors",
                actionClassName
              )}
            >
              {actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Error;
