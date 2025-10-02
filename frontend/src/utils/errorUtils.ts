import { AxiosError } from "axios";

/**
 * Extract error message from various error response formats
 * @param error - The error object (AxiosError or generic Error)
 * @param fallbackMessage - Fallback message if no specific error is found
 * @returns The error message to display
 */
export const getErrorMessage = (error: unknown, fallbackMessage: string = "Something went wrong. Please try again."): string => {
  if (error instanceof AxiosError) {
    // Try different possible error message locations
    const errorMessage = 
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      error.message || 
      fallbackMessage;
    
    return errorMessage;
  }
  
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }
  
  return fallbackMessage;
};

/**
 * Extract error message specifically for API responses
 * @param error - The AxiosError object
 * @param fallbackMessage - Fallback message if no specific error is found
 * @returns The error message to display
 */
export const getApiErrorMessage = (error: AxiosError, fallbackMessage: string = "Something went wrong. Please try again."): string => {
  // Check for nested error structure (backend format)
  if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
    const errorData = error.response.data as any;
    if (errorData.error?.message) {
      return errorData.error.message;
    }
  }
  
  // Check for direct message in response data
  if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
    const responseData = error.response.data as any;
    if (responseData.message) {
      return responseData.message;
    }
  }
  
  // Check for error message in response data
  if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
    const errorData = error.response.data as any;
    if (errorData.error) {
      return errorData.error;
    }
  }
  
  // Fallback to Axios error message
  if (error.message) {
    return error.message;
  }
  
  return fallbackMessage;
};

/**
 * Check if error is a specific type
 * @param error - The error object
 * @param errorType - The error type to check for
 * @returns Boolean indicating if error matches the type
 */
export const isErrorType = (error: unknown, errorType: string): boolean => {
  if (error instanceof AxiosError) {
    if (error.response?.data && typeof error.response.data === 'object') {
      const responseData = error.response.data as any;
      return responseData.error?.type === errorType || responseData.type === errorType;
    }
  }
  
  return false;
};

/**
 * Get error status code
 * @param error - The error object
 * @returns The HTTP status code or null
 */
export const getErrorStatusCode = (error: unknown): number | null => {
  if (error instanceof AxiosError) {
    return error.response?.status || null;
  }
  
  return null;
};
