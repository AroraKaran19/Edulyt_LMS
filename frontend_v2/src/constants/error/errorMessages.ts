export const ERROR_MESSAGES = {
  // Network related errors
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  CONNECTION_ERROR: "Unable to connect to server. Please check your internet connection.",
  TIMEOUT_ERROR: "Request timeout. Please try again.",
  SERVER_DOWN: "Backend server is not running. Please try again later.",
  DNS_ERROR: "Invalid server address. Please contact support.",
  
  // HTTP status related errors
  UNAUTHORIZED: "You are not authorized to access this resource.",
  FORBIDDEN: "Access to this resource is forbidden.",
  NOT_FOUND: "The requested item was not found.",
  BAD_REQUEST: "Request failed. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable. Please try again later.",
  TOO_MANY_REQUESTS: "Too many requests. Please wait a moment and try again.",
  
  // Generic errors
  UNEXPECTED_ERROR: "An unexpected error occurred.",
  SOMETHING_WRONG: "Something went wrong. Please try again.",
  UNKNOWN_ERROR: "An unknown error occurred. Please try again.",
  
  // Loading states
  LOADING: "Loading...",
  RETRYING: "Retrying...",
  
  // User-friendly error messages
  COURSES_LOAD_ERROR: "Unable to load courses",
  COURSES_LOAD_DESCRIPTION: "There was a problem loading the courses. Please try again.",
  CONNECTION_PROBLEM: "There was a problem connecting to the server. Please check your internet connection and try again.",
  SERVER_MAINTENANCE: "The server is currently under maintenance. Please try again later.",
};
