import axios from "axios";
import { API_BASE_URL } from "@/constants/endpoints";

/**
 * A bare client for the public scholarship flow, deliberately free of the
 * interceptors on `apiClient`.
 *
 * Two of those interceptors are actively wrong here:
 *
 * 1. The request interceptor overwrites `Authorization` with the signed-in
 *    user's NextAuth access token. These routes authenticate with a scholarship
 *    session token instead, so that overwrite destroys the only credential the
 *    backend will accept and every call comes back 401.
 *
 * 2. The response interceptor treats any 401 as an expired login and sends the
 *    browser to `/login`. On a page most visitors reach with no account at all,
 *    a 401 means "verify your email again", never "you have been signed out".
 *
 * The result of both together was that a signed-in visitor got ejected from the
 * campaign page the moment it asked for their attempt.
 */
const scholarshipClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

/** Authorization header for a scholarship session token. */
export const schAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export default scholarshipClient;
