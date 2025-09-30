"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Debug logging
  useEffect(() => {
    console.log("🔐 AuthGuard Debug:");
    console.log("  Status:", status);
    console.log("  Session:", session);
    console.log("  Has session token:", !!session);
    console.log("  User:", session?.user);
  }, [status, session]);

  useEffect(() => {
    if (status === "loading") {
      console.log("⏳ AuthGuard - Still loading...");
      return;
    }

    if (status === "unauthenticated") {
      console.log("❌ AuthGuard - Not authenticated, redirecting to login");
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (status === "authenticated") {
      console.log("✅ AuthGuard - Authenticated successfully!");
    }
  }, [status, router, callbackUrl]);

  // Show loading state while checking authentication
  if (status === "loading") {
    console.log("🔄 AuthGuard - Showing loading state");
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      )
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (status === "unauthenticated") {
    console.log("🚫 AuthGuard - Not authenticated, not rendering");
    return null;
  }

  console.log("🎉 AuthGuard - Rendering protected content");
  return <>{children}</>;
};

export default AuthGuard;
