import { AlertCircle, Wifi, WifiOff, Server, LucideIcon } from "lucide-react";
import { ERROR_MESSAGES } from '@/constants/error/errorMessages';
import { ERROR_TYPES } from '@/constants/error/statusCodes';

export interface ErrorUIConfig {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

export const ERROR_UI_CONFIGS: Record<string, ErrorUIConfig> = {
  [ERROR_TYPES.NETWORK_ERROR]: {
    icon: WifiOff,
    iconColor: "text-orange-500",
    title: "Network Connection Issue",
    description: ERROR_MESSAGES.NETWORK_ERROR,
  },
  [ERROR_TYPES.SERVER_DOWN]: {
    icon: Server,
    iconColor: "text-red-600",
    title: "Server Unavailable",
    description: ERROR_MESSAGES.SERVER_DOWN,
  },
  [ERROR_TYPES.DNS_ERROR]: {
    icon: AlertCircle,
    iconColor: "text-red-500",
    title: "Configuration Error",
    description: ERROR_MESSAGES.DNS_ERROR,
  },
  [ERROR_TYPES.TIMEOUT_ERROR]: {
    icon: Wifi,
    iconColor: "text-yellow-500",
    title: "Request Timeout",
    description: ERROR_MESSAGES.TIMEOUT_ERROR,
  },
  [ERROR_TYPES.BACKEND_ERROR]: {
    icon: Server,
    iconColor: "text-red-600",
    title: "Server Error",
    description: ERROR_MESSAGES.SERVER_ERROR,
  },
  [ERROR_TYPES.UNKNOWN_ERROR]: {
    icon: AlertCircle,
    iconColor: "text-red-500",
    title: "Something went wrong",
    description: ERROR_MESSAGES.UNKNOWN_ERROR,
  },
};

// Default error configuration
export const DEFAULT_ERROR_CONFIG: ErrorUIConfig = {
  icon: AlertCircle,
  iconColor: "text-red-500",
  title: ERROR_MESSAGES.COURSES_LOAD_ERROR,
  description: ERROR_MESSAGES.CONNECTION_PROBLEM,
};

// Helper function to get error UI configuration
export const getErrorUIConfig = (error: { errorType: string, statusCode: number }): ErrorUIConfig => {
  if (!error) return DEFAULT_ERROR_CONFIG;

  // Handle backend errors with specific status codes
  if (error.errorType === ERROR_TYPES.BACKEND_ERROR) {
    const status = error.statusCode;
    if (status >= 500) {
      return {
        icon: Server,
        iconColor: "text-red-600",
        title: "Server Error",
        description: ERROR_MESSAGES.SERVER_ERROR,
      };
    } else if (status === 404) {
      return {
        icon: AlertCircle,
        iconColor: "text-orange-500",
        title: "Not Found",
        description: ERROR_MESSAGES.NOT_FOUND,
      };
    } else if (status >= 400) {
      return {
        icon: AlertCircle,
        iconColor: "text-orange-500",
        title: "Request Error",
        description: ERROR_MESSAGES.BAD_REQUEST,
      };
    }
  }

  // Return configured error UI or default
  return ERROR_UI_CONFIGS[error.errorType] || DEFAULT_ERROR_CONFIG;
}; 