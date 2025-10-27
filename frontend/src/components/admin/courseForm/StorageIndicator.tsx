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

  // Always return null to hide the popup
  return null;
};

export default StorageIndicator;
