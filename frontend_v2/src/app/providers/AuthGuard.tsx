"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import useAuth from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredUserType?: User["userType"][];
  requiredPermissions?: string[];
  fallbackPath?: string;
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
  showLoading = true,
}) => {
  const { user, isAuthenticated, isLoading, isUnauthenticated } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (isLoading) return;

    // User is not authenticated
    if (isUnauthenticated || !user) {
      router.push(fallbackPath);
      return;
    }

    // Check user type if required
    if (
      requiredUserType &&
      requiredUserType.length > 0 &&
      !requiredUserType.includes(user.userType as User["userType"])
    ) {
      router.back();
      return;
    }

    // Check permissions if required
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some((permission) =>
        user.permissions?.includes(permission)
      );
      if (!hasPermission) {
        router.back();
        return;
      }
    }
  }, [
    user,
    isAuthenticated,
    isLoading,
    isUnauthenticated,
    router,
    requiredUserType,
    fallbackPath,
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

  // User is not authenticated
  if (isUnauthenticated || !user) {
    return null;
  }

  // Check user type if required
  if (
    requiredUserType &&
    requiredUserType.length > 0 &&
    !requiredUserType.includes(user.userType as User["userType"])
  ) {
    return null;
  }

  // Check permissions if required
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some((permission) =>
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
