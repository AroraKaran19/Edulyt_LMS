import { API_BASE_URL } from "@/constants/endpoints";
import { AXIOS_ERROR_CODES, ERROR_TYPES } from "@/constants/error/statusCodes";
import { ERROR_MESSAGES } from "@/constants/error/errorMessages";
import { isServerDown } from "@/lib/utils";
import axios from "axios";
import { getSession, signOut } from "next-auth/react";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Enable cookies for cross-origin requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Session cache to prevent repeated getSession() calls
let sessionCache: { session: any; timestamp: number } | null = null;
const SESSION_CACHE_DURATION = 5000; // Cache for 5 seconds

// Request interceptor to add access token
apiClient.interceptors.request.use(
  async (config) => {
    // Only add token for client-side requests
    if (typeof window !== "undefined") {
      // Use cached session if available and not expired
      let session = null;
      const now = Date.now();
      
      if (sessionCache && (now - sessionCache.timestamp) < SESSION_CACHE_DURATION) {
        session = sessionCache.session;
      } else {
        // Fetch fresh session and cache it
        session = await getSession();
        sessionCache = {
          session,
          timestamp: now,
        };
      }
      
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

      // Already retried once and still unauthorized → the session is dead, not
      // just stale. This is the path a *remotely signed-out* device takes: its
      // access token is still unexpired (so no refresh fires) but the backend
      // now rejects it because the session was revoked. Sign out cleanly.
      if (status === 401 && originalRequest._retry) {
        if (typeof window !== "undefined") {
          await signOut({ redirect: false });
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized - access token likely expired.
      // The refresh token lives only in the NextAuth encrypted session, so we
      // re-fetch the session (which triggers NextAuth's server-side rotation)
      // and retry with the fresh access token. We never call /auth/refresh-token
      // from the client — it has no refresh token to send.
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Clear session cache so getSession() goes to the server and refreshes
          sessionCache = null;

          const session = await getSession();
          sessionCache = {
            session,
            timestamp: Date.now(),
          };

          // Refresh failed server-side → session is unrecoverable, sign out.
          if ((session as any)?.error === "RefreshAccessTokenError") {
            if (typeof window !== "undefined") {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }
            return Promise.reject(error);
          }

          if (session?.accessToken) {
            // getSession() already rotated the token if it was expired.
            originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
            return apiClient(originalRequest);
          }

          // No session at all → not authenticated.
          if (typeof window !== "undefined") {
            window.location.href = "/login";
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
