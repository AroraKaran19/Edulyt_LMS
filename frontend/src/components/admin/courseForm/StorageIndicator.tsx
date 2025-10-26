"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { getStorageInfo } from "@/lib/courseFormUtils";

interface StorageIndicatorProps {
  mode: "create" | "edit";
  courseId?: string;
  className?: string;
}

const StorageIndicator: React.FC<StorageIndicatorProps> = ({
  mode,
  courseId,
  className = "",
}) => {
  const [storageInfo, setStorageInfo] = useState<{
    hasData: boolean;
    lastSaved?: string;
    version?: string;
    key: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const updateStorageInfo = () => {
      const info = getStorageInfo(mode, courseId);
      setStorageInfo(info);

      // Show indicator briefly when data is saved
      if (info.hasData) {
        setIsVisible(true);
        const timer = setTimeout(() => setIsVisible(false), 2000);
        return () => clearTimeout(timer);
      }
    };

    // Check storage info on mount
    updateStorageInfo();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageInfo?.key) {
        updateStorageInfo();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for auto-save updates
    const interval = setInterval(updateStorageInfo, 5000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [isMounted, mode, courseId, storageInfo?.key]);

  // Don't render anything on server-side or before mounting
  if (!isMounted || !storageInfo?.hasData || !isVisible) {
    return null;
  }

  const formatLastSaved = (lastSaved: string) => {
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-2 text-sm">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <div className="flex flex-col">
          <span className="text-gray-700 font-medium">
            {mode === "create" ? "Draft saved" : "Changes saved"}
          </span>
          {storageInfo.lastSaved && (
            <span className="text-gray-500 text-xs">
              {formatLastSaved(storageInfo.lastSaved)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageIndicator;
