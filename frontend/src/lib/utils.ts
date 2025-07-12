import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import apiClient from '@/configs/apiConfig';
import { AXIOS_ERROR_CODES, ERROR_TYPES } from '@/constants/error/statusCodes';
import { ERROR_MESSAGES } from '@/constants/error/errorMessages';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to check if user has internet connection
export const checkInternetConnection = async (): Promise<boolean> => {
    try {
        // Try to reach a reliable external service with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('https://www.google.com/favicon.ico', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return true;
    } catch {
        try {
            // Fallback check
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch('https://httpbin.org/status/200', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return true;
        } catch {
            return false;
        }
    }
};

// Helper function to detect if server is down
export const isServerDown = async (error: any): Promise<boolean> => {
    // Check if it's a localhost/127.0.0.1 request
    const isLocalhost = error.config?.baseURL?.includes('localhost') || 
                       error.config?.baseURL?.includes('127.0.0.1') ||
                       error.config?.url?.includes('localhost') ||
                       error.config?.url?.includes('127.0.0.1');
    
    // If it's not a localhost request, it's likely a network issue
    if (!isLocalhost) {
        return false;
    }
    
    // Check request status
    const requestStatus = error.request?.status;
    const readyState = error.request?.readyState;
    
    // If we have a direct connection refused error, it's definitely server down
    if (error.code === 'ECONNREFUSED') {
        return true;
    }
    
    // For ERR_NETWORK with localhost, we need to check internet connectivity
    if (error.code === 'ERR_NETWORK' && isLocalhost && requestStatus === 0) {
        try {
            // Check if user has internet connection
            const hasInternet = await checkInternetConnection();
            
            if (!hasInternet) {
                console.log('🌐 No internet connection detected');
                return false; // It's a network issue, not server down
            } else {
                console.log('✅ Internet connection available, server appears to be down');
                return true; // Has internet but can't reach localhost server
            }
        } catch {
            // If we can't check internet, assume it's a network issue
            console.log('❓ Cannot determine internet status, assuming network issue');
            return false;
        }
    }
    
    // Other conditions that indicate server down
    const serverDownConditions = [
        isLocalhost && error.code === 'ERR_NETWORK' && readyState === 4,
        isLocalhost && !error.response && error.request && requestStatus === 0
    ];
    
    return serverDownConditions.some(condition => condition);
};

export const fetcher = async (url: string) => {
  const response = await apiClient.get(url);
  return response.data;
};
