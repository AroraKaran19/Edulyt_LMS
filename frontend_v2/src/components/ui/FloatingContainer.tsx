import { cn } from "@/lib/utils";
import React from "react";

const FloatingContainer = ({
  title,
  markerTitle,
  onMarkerClick,
  onViewAll,
  onElementClick,
  elements,
  showViewAll = true,
  className,
}: {
  title: string;
  markerTitle?: string;
  onMarkerClick?: () => void;
  onViewAll?: () => void;
  onElementClick?: (element: React.ReactNode) => void;
  elements: React.ReactNode[];
  showViewAll?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "absolute top-10 right-0 w-96 bg-white rounded-lg shadow-lg border border-gray-100",
        className
      )}
    >
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary select-none">
            {title}
          </h2>
          <button
            className="text-sm text-[#F77124] hover:text-[#F77124]/80"
            onClick={onMarkerClick && onMarkerClick}
          >
            {markerTitle}
          </button>
        </div>
      </div>
      <div className="min-h-[100px] max-h-[400px] overflow-y-auto">
        <div className="p-4 flex flex-col gap-4">
          {elements.map((element, index) => (
            <div
              key={index}
              onClick={() => onElementClick && onElementClick(element)}
              className="cursor-pointer"
            >
              {element}
            </div>
          ))}
        </div>
      </div>
      {showViewAll && elements.length > 0 && (
        <div className="p-3 border-t border-gray-100">
          <button
            className="w-full text-center text-sm text-[#F77124] hover:text-[#F77124]/80"
            onClick={onViewAll && onViewAll}
          >
            View all {title.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingContainer;
