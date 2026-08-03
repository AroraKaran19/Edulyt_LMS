"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { User } from "@/types";
import useAuth from "@/hooks/useAuth";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { notFound } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredUserType?: User["userType"][];
  requiredPermissions?: string[];
  fallbackPath?: string;
  /** If true, wrong signed-in role is sent to {@link getPostLoginRedirectPath} instead of history back. Ignored when `wrongRoleShowsNotFound` is true. */
  redirectToRoleHomeOnMismatch?: boolean;
  /** If true, authenticated users with the wrong role trigger the nearest `not-found` boundary (404) instead of redirecting. */
  wrongRoleShowsNotFound?: boolean;
  showLoading?: boolean;
}

/**
 * AuthGuard component to protect routes
 * @param children - The child components to protect
 * @param requiredUserType - The user types required to access the route
 * @param requiredPermissions - The permissions required to access the route
 * @param fallbackPath - The path to redirect to if the user is not authenticated
 * @param showLoading - Whether to show a loading spinner while checking authentication
 * @returns The child components if the user is authenticated and authorized, otherwise null
 */
const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredUserType,
  requiredPermissions,
  fallbackPath = "/login",
  redirectToRoleHomeOnMismatch = false,
  wrongRoleShowsNotFound = false,
  showLoading = true,
}) => {
  const { user, session, isAuthenticated, isLoading, isUnauthenticated } =
    useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const sessionExpired =
    (session as { error?: string } | null)?.error === "RefreshAccessTokenError";

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (isLoading) return;

    /**
     * Where to come back to after signing in.
     *
     * Read off `window` rather than `useSearchParams`, which would force every
     * layout wrapped in this guard behind a Suspense boundary.
     *
     * Without this the destination was dropped: a guarded link from an email
     * (say the referral reward's `/dashboard?refer=1`) sent the reader to
     * login and then to the plain role home, so whatever they clicked for
     * never opened.
     */
    const returnTo =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "";
    const loginPath =
      fallbackPath === "/login" && returnTo
        ? `/login?callbackUrl=${encodeURIComponent(returnTo)}`
        : fallbackPath;

    // Refresh failed server-side — sign out cleanly instead of white-screening.
    if (sessionExpired) {
      signOut({ callbackUrl: loginPath });
      return;
    }

    // User is not authenticated
    if (isUnauthenticated || !user) {
      router.push(loginPath);
      return;
    }

    // Check user type if required
    if (
      requiredUserType &&
      requiredUserType.length > 0 &&
      !requiredUserType.includes(user.userType as User["userType"])
    ) {
      if (!wrongRoleShowsNotFound) {
        if (redirectToRoleHomeOnMismatch) {
          router.replace(getPostLoginRedirectPath(user, undefined));
        } else {
          router.back();
        }
      }
      return;
    }

    // Check permissions if required (super-admins have implicit full access)
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission =
        user.userType === "super-admin" ||
        requiredPermissions.some((permission) =>
          user.permissions?.includes(permission)
        );
      if (!hasPermission) {
        router.back();
        return;
      }
    }
  }, [
    user,
    session,
    sessionExpired,
    isAuthenticated,
    isLoading,
    isUnauthenticated,
    router,
    requiredUserType,
    fallbackPath,
    redirectToRoleHomeOnMismatch,
    wrongRoleShowsNotFound,
    requiredPermissions,
    isClient,
  ]);

  // Show loading state while checking authentication
  if (isLoading || !isClient) {
    return showLoading ? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    ) : null;
  }

  // Session refresh failed or user is not authenticated — render nothing while
  // the effect above redirects / signs out.
  if (sessionExpired || isUnauthenticated || !user) {
    return null;
  }

  // Check user type if required
  if (
    requiredUserType &&
    requiredUserType.length > 0 &&
    !requiredUserType.includes(user.userType as User["userType"])
  ) {
    if (wrongRoleShowsNotFound) {
      notFound();
    }
    return null;
  }

  // Check permissions if required (super-admins have implicit full access)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission =
      user.userType === "super-admin" ||
      requiredPermissions.some((permission) =>
        user.permissions?.includes(permission)
      );
    if (!hasPermission) {
      return null;
    }
  }

  // User is authenticated and authorized
  return children;
};

export default AuthGuard;
