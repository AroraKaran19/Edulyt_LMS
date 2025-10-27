import { API_BASE_URL } from "@/constants/endpoints";
import { AXIOS_ERROR_CODES, ERROR_TYPES } from "@/constants/error/statusCodes";
import { ERROR_MESSAGES } from "@/constants/error/errorMessages";
import { isServerDown } from "@/lib/utils";
import axios from "axios";
import { getSession } from "next-auth/react";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Enable cookies for cross-origin requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add access token
apiClient.interceptors.request.use(
  async (config) => {
    // Only add token for client-side requests
    if (typeof window !== "undefined") {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for comprehensive error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error has a response (server responded with error status)
    if (error.response) {
      // Backend responded with a status code out of the 2xx range
      const status = error.response.status;
      const data = error.response.data;

      // Handle 401 Unauthorized - token might be expired
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token using the same apiClient
          const session = await getSession();
          if (session?.accessToken) {
            const refreshResponse = await apiClient.post(
              "/auth/refresh-token",
              {
                accessToken: session.accessToken,
              },
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (refreshResponse.status === 200) {
              const newAccessToken = refreshResponse.data.data.accessToken;

              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

              // Retry the original request
              return apiClient(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // If refresh fails, redirect to login
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }

      // Attach error type for UI handling
      error.errorType = ERROR_TYPES.BACKEND_ERROR;
      error.statusCode = status;
      error.serverMessage = data?.message || "Server error occurred";
    } else if (error.request) {
      // Request was made but no response received
      // Use helper function to detect server down (with internet check)
      const serverDown = await isServerDown(error);

      if (serverDown) {
        console.log(
          "🔴 Backend server is not running (internet available but server unreachable)."
        );
        error.errorType = ERROR_TYPES.SERVER_DOWN;
        error.message = ERROR_MESSAGES.SERVER_DOWN;
      } else if (error.code === AXIOS_ERROR_CODES.NOT_FOUND) {
        console.log("DNS resolution failed - invalid domain/URL");
        error.errorType = ERROR_TYPES.DNS_ERROR;
        error.message = ERROR_MESSAGES.DNS_ERROR;
      } else if (error.code === AXIOS_ERROR_CODES.TIMEOUT) {
        console.log("Request timeout");
        error.errorType = ERROR_TYPES.TIMEOUT_ERROR;
        error.message = ERROR_MESSAGES.TIMEOUT_ERROR;
      } else {
        console.log("🌐 Network error - check internet connection");
        error.errorType = ERROR_TYPES.NETWORK_ERROR;
        error.message = ERROR_MESSAGES.NETWORK_ERROR;
      }
    } else {
      // Something else happened in setting up the request
      console.log("Unknown Error:", error.message);
      error.errorType = ERROR_TYPES.UNKNOWN_ERROR;
      error.message = error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
