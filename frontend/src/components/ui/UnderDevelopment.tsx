import { cn } from "@/lib/utils";
import React from "react";

const UnderDevelopment = ({ className }: { className?: string }) => {
  return (
    <div className={cn("max-w-md mx-auto space-y-6", className)}>
      <div className="w-24 h-24 mx-auto bg-[#FFE9DB] rounded-full flex items-center justify-center">
        <svg
          className="w-12 h-12 text-[#F77124]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-text-primary font-coolvetica">
          Work in Progress
        </h2>
        <p className="text-text-primary/70 font-normal">
          This page is not accessible right now. We&apos;re working hard to bring you
          something amazing!
        </p>
      </div>
      <div className="bg-[#FFE9DB] border border-[#F77124]/20 rounded-lg p-4">
        <p className="text-sm text-[#F77124] font-medium">
          🚧 Feature under development - Coming soon!
        </p>
      </div>
    </div>
  );
};

export default UnderDevelopment;
