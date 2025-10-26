import { ENDPOINTS } from "@/constants/endpoints";
import { Course } from "@/types";
import axios, { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import apiClient from "@/configs/apiConfig";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateDiscountTime = (course: Course) => {
  if (
    !course?.discount ||
    !course.discount.isActive ||
    course.discount.value <= 0
  )
    return null;

  const now = new Date();
  const startDate = new Date(course?.discount?.startDate || "");
  const endDate = new Date(course?.discount?.endDate || "");

  // Check if discount is within valid time range
  if (startDate && endDate && endDate > now) {
    // If discount hasn't started yet, show countdown to start date
    if (startDate > now) {
      const diff = startDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return {
        days: Math.max(0, days),
        hours: Math.max(0, hours),
        minutes: Math.max(0, minutes),
        seconds: Math.max(0, seconds),
      };
    }

    // If discount has started, show countdown to end date
    if (startDate <= now) {
      const diff = endDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return {
        days: Math.max(0, days),
        hours: Math.max(0, hours),
        minutes: Math.max(0, minutes),
        seconds: Math.max(0, seconds),
      };
    }
  }
  return null;
};

/**
 * Formats duration in seconds to a human-readable format
 * @param totalSeconds - Total duration in seconds
 * @returns Formatted string like "2h 30m" or "45m" or "30s"
 */
export const formatDuration = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) {
    return "0s";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} ${hours > 1 ? "Hrs" : "Hr"} ${minutes} ${
        minutes > 1 ? "Mins" : "Min"
      }`;
    } else {
      return `${hours} ${hours > 1 ? "Hrs" : "Hr"}`;
    }
  } else if (minutes > 0) {
    if (seconds > 0 && minutes < 5) {
      // Show seconds for short durations
      return `${minutes} ${minutes > 1 ? "Mins" : "Min"} ${seconds}s`;
    } else {
      return `${minutes} ${minutes > 1 ? "Mins" : "Min"}`;
    }
  } else {
    return `${seconds}s`;
  }
};

export async function fetcher(url: string) {
  try {
    // Use apiClient instead of plain axios to get authentication
    const response = await apiClient.get(url);
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      return {
        status: error.response?.status,
        data: error.response?.data,
      };
    } else {
      return {
        status: 500,
        data: null,
      };
    }
  }
}

// Helper function to detect if server is down
export const isServerDown = async (error: {
  config: { baseURL: string; url: string };
  request: { status: number; readyState: number };
  code: string;
  response: { status: number };
}): Promise<boolean> => {
  // Check if it's a localhost/127.0.0.1 request
  const isLocalhost =
    error.config?.baseURL?.includes("localhost") ||
    error.config?.baseURL?.includes("127.0.0.1") ||
    error.config?.url?.includes("localhost") ||
    error.config?.url?.includes("127.0.0.1");

  // If it's not a localhost request, it's likely a network issue
  if (!isLocalhost) {
    return false;
  }

  // Check request status
  const requestStatus = error.request?.status;
  const readyState = error.request?.readyState;

  // If we have a direct connection refused error, it's definitely server down
  if (error.code === "ECONNREFUSED") {
    return true;
  }

  // For ERR_NETWORK with localhost, we need to check internet connectivity
  if (error.code === "ERR_NETWORK" && isLocalhost && requestStatus === 0) {
    try {
      // Check if user has internet connection
      const hasInternet = await checkInternetConnection();

      if (!hasInternet) {
        console.log("🌐 No internet connection detected");
        return false; // It's a network issue, not server down
      } else {
        console.log(
          "✅ Internet connection available, server appears to be down"
        );
        return true; // Has internet but can't reach localhost server
      }
    } catch {
      // If we can't check internet, assume it's a network issue
      console.log(
        "❓ Cannot determine internet status, assuming network issue"
      );
      return false;
    }
  }

  // Other conditions that indicate server down
  const serverDownConditions = [
    isLocalhost && error.code === "ERR_NETWORK" && readyState === 4,
    isLocalhost && !error.response && error.request && requestStatus === 0,
  ];

  return serverDownConditions.some((condition) => condition);
};

// Helper function to check if user has internet connection
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    // Try to reach a reliable external service with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-cache",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch internet connection");
    }

    clearTimeout(timeoutId);
    return true;
  } catch {
    try {
      // Fallback check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("https://httpbin.org/status/200", {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-cache",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch internet connection");
      }

      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }
};

// Debounce utility function for cart updates
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
