"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { FullScreenLoader } from "../ui";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }
  }, [status, router, callbackUrl]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      fallback || (
        <FullScreenLoader
          text="Authenticating..."
          variant="spinner"
          size="lg"
        />
      )
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return children;
};

export default AuthGuard;
